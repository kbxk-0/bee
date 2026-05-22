// server.js — مليون لعبة الورق
// تثبيت: npm install ws
// تشغيل: node server.js

const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('مليون سيرفر شغال ✓');
});
const wss = new WebSocket.Server({ server });

const rooms = new Map();
const players = new Map();

// ─── الورق ───────────────────────────────────────────
const SUITS = ['♥','♦','♠','♣'];
const SUIT_COLOR = {'♥':'red','♦':'red','♠':'black','♣':'black'};
const BASE_VALS = [
  {ar:'أكك', n:14}, {ar:'شيبه', n:13},
  {ar:'بنت', n:12}, {ar:'ولد',  n:11}
];
const EXTRA_VALS = [
  {ar:'10', n:10}, {ar:'9', n:9},
  {ar:'8', n:8},   {ar:'7', n:7}
];

function buildDeck(playerCount) {
  const extra = playerCount <= 4 ? 0
    : playerCount <= 6 ? 1
    : playerCount <= 8 ? 2
    : playerCount <= 10 ? 3 : 4;
  const vals = [...BASE_VALS, ...EXTRA_VALS.slice(0, extra)];
  const deck = [];
  for (const s of SUITS) for (const v of vals)
    deck.push({ suit:s, val:v.ar, num:v.n, color:SUIT_COLOR[s] });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function evalHand(cards) {
  const cnt = {};
  cards.forEach(c => cnt[c.val] = (cnt[c.val]||0)+1);
  const vals = Object.values(cnt).sort((a,b) => b-a);
  const high = Math.max(...cards.map(c => c.num));
  if (vals[0]===4) return {rank:8, name:'أربعة متشابهة', high};
  if (vals[0]===3) return {rank:6, name:'ثلاثة متشابهة', high};
  if (vals[0]===2 && vals[1]===2) return {rank:4, name:'زوجان', high};
  if (vals[0]===2) return {rank:2, name:'زوج واحد', high};
  return {rank:0, name:'أعلى ورقة', high};
}

function cmpHand(a,b) {
  return a.rank !== b.rank ? a.rank-b.rank : a.high-b.high;
}

// ─── غرفة ────────────────────────────────────────────
class Room {
  constructor(id, cfg, hostId, isTournament=false) {
    this.id = id; this.hostId = hostId;
    this.isTournament = isTournament;
    this.entryCost = cfg.entryCost || 0;
    this.cfg = cfg;
    this.seats = [];   // {id, name, bal, cards, bet, rs, ws, avatar}
    this.status = 'waiting';
    this.pot = 0; this.round = 0;
    this.timer = null; this.timeLeft = 0;
  }

  seat(p) { this.seats.push(p); }
  unseat(id) { this.seats = this.seats.filter(s => s.id !== id); }

  send(id, msg) {
    const s = this.seats.find(s => s.id === id);
    if (s && s.ws.readyState === WebSocket.OPEN)
      s.ws.send(JSON.stringify(msg));
  }
  bcast(msg, skip=null) {
    this.seats.forEach(s => {
      if (s.id !== skip && s.ws.readyState === WebSocket.OPEN)
        s.ws.send(JSON.stringify(msg));
    });
  }
  bcastAll(msg) { this.bcast(msg); }

  // ── شروع لعبة ──
  start() {
    this.status = 'playing';
    this.seats.forEach(s => {
      s.bal = this.cfg.startBal;
      s.status = 'in';
    });
    this.bcastAll({type:'game_start', players: this.publicSeats()});
    this.newRound();
  }

  publicSeats() {
    return this.seats.map(s => ({
      id:s.id, name:s.name, bal:s.bal,
      status:s.status, avatar:s.avatar
    }));
  }

  newRound() {
    this.round++;
    this.pot = 0;
    const active = this.seats.filter(s => s.status==='in');
    active.forEach(s => { s.bet=0; s.rs='wait'; s.cards=[]; });

    const deck = buildDeck(active.length);
    active.forEach((s,i) => { s.cards = deck.slice(i*4, i*4+4); });

    this.bcastAll({
      type:'round_start', round:this.round,
      players: this.publicSeats()
    });
    active.forEach(s => this.send(s.id, {type:'your_cards', cards:s.cards}));
    this.advance();
  }

  waiting() { return this.seats.filter(s=>s.status==='in'&&s.rs==='wait'); }
  stillIn() { return this.seats.filter(s=>s.status==='in'&&s.rs!=='fold'); }

  advance() {
    const w = this.waiting();
    if (!w.length || this.stillIn().length<=1) { this.resolve(); return; }
    const cur = w[0];
    this.timeLeft = this.cfg.timer;
    this.bcastAll({type:'your_turn', pid:cur.id, name:cur.name, timeLeft:this.timeLeft});
    this.clearTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.bcastAll({type:'tick', timeLeft:this.timeLeft});
      if (this.timeLeft <= 0) { this.clearTimer(); this.fold(cur.id, true); }
    }, 1000);
  }

  clearTimer() { if (this.timer) { clearInterval(this.timer); this.timer=null; } }

  bet(id, amt) {
    const s = this.seats.find(s=>s.id===id);
    if (!s||s.rs!=='wait') return;
    const a = Math.max(this.cfg.minBet, Math.min(amt, s.bal));
    this.clearTimer();
    s.bal -= a; s.bet = a; s.rs = 'bet'; this.pot += a;
    this.bcastAll({type:'did_bet', pid:id, amt:a, pot:this.pot, bal:s.bal});
    this.advance();
  }

  fold(id, auto=false) {
    const s = this.seats.find(s=>s.id===id);
    if (!s||s.rs!=='wait') return;
    this.clearTimer();
    s.rs = 'fold';
    this.bcastAll({type:'did_fold', pid:id, auto});
    this.advance();
  }

  resolve() {
    this.clearTimer();
    const bettors = this.seats.filter(s=>s.status==='in'&&s.rs==='bet');
    if (!bettors.length) { setTimeout(()=>this.newRound(),3000); return; }

    const evaled = bettors.map(s=>({...s, hand:evalHand(s.cards)}));
    evaled.sort((a,b)=>cmpHand(b.hand,a.hand));
    const top = evaled[0].hand;
    const winners = evaled.filter(s=>cmpHand(s.hand,top)===0);
    const share = Math.floor(this.pot/winners.length);
    winners.forEach(w=>{
      const s=this.seats.find(s=>s.id===w.id);
      if(s) s.bal+=share;
    });

    this.bcastAll({
      type:'round_end',
      winners: winners.map(w=>({id:w.id,name:w.name,hand:w.hand.name,cards:w.cards})),
      allHands: evaled.map(p=>({id:p.id,name:p.name,hand:p.hand.name,cards:p.cards})),
      pot:this.pot, share,
      balances: this.seats.map(s=>({id:s.id,bal:s.bal}))
    });

    // إفلاس
    this.seats.forEach(s=>{
      if(s.bal<=0&&s.status==='in'){
        s.status='out';
        this.bcastAll({type:'player_out',pid:s.id,name:s.name});
      }
    });

    // فوز
    const gWinner = this.seats.find(s=>s.bal>=this.cfg.winTarget);
    const remaining = this.seats.filter(s=>s.status==='in');
    if (gWinner || remaining.length<=1) {
      const w = gWinner||remaining[0];
      setTimeout(()=>this.bcastAll({
        type:'game_over', wid:w.id, wname:w.name, wbal:w.bal,
        isTournament:this.isTournament, prize:this.entryCost*this.seats.length
      }), 3500);
    } else {
      setTimeout(()=>this.newRound(), 4000);
    }
  }
}

// ─── WebSocket ───────────────────────────────────────
wss.on('connection', ws => {
  const pid = 'p'+Date.now()+Math.random().toString(36).slice(2,6);
  players.set(pid, {id:pid, ws, rid:null, name:'لاعب'});
  ws.send(JSON.stringify({type:'hello',pid}));

  ws.on('message', raw => {
    try { handle(pid, JSON.parse(raw)); }
    catch(e){ console.error(e); }
  });
  ws.on('close', () => disconnect(pid));
});

function handle(pid, msg) {
  const p = players.get(pid);
  if (!p) return;

  if (msg.type==='set_name') { p.name=msg.name.slice(0,16); return; }

  if (msg.type==='chat') {
    const room = rooms.get(p.rid);
    if (room) room.bcastAll({
      type: 'chat_msg',
      name: p.name,
      text: String(msg.text||'').slice(0, 80),
      av:   msg.av || '😊'
    });
    return;
  }

  if (msg.type==='create_room') {
    const rid='R'+Math.random().toString(36).slice(2,6).toUpperCase();
    const cfg={
      maxPlayers:+msg.maxPlayers||4,
      startBal:+msg.startBal||100000,
      winTarget:+msg.winTarget||1000000,
      minBet:+msg.minBet||1000,
      timer:+msg.timer||15,
      entryCost:+msg.entryCost||0
    };
    const room=new Room(rid,cfg,pid,!!msg.isTournament);
    rooms.set(rid,room);
    room.seat({id:pid,name:p.name,bal:cfg.startBal,cards:[],bet:0,
               rs:'wait',status:'in',ws:p.ws,avatar:msg.avatar||'😊'});
    p.rid=rid;
    p.ws.send(JSON.stringify({type:'room_created',rid,cfg,
      players:room.publicSeats(), isHost:true}));
    return;
  }

  if (msg.type==='join_room') {
    const room=rooms.get(msg.rid);
    if(!room){p.ws.send(JSON.stringify({type:'err',msg:'الغرفة غير موجودة'}));return;}
    if(room.status!=='waiting'){p.ws.send(JSON.stringify({type:'err',msg:'اللعبة بدأت'}));return;}
    if(room.seats.length>=room.cfg.maxPlayers){p.ws.send(JSON.stringify({type:'err',msg:'الغرفة ممتلئة'}));return;}
    room.seat({id:pid,name:p.name,bal:room.cfg.startBal,cards:[],bet:0,
               rs:'wait',status:'in',ws:p.ws,avatar:msg.avatar||'😊'});
    p.rid=msg.rid;
    room.bcast({type:'player_joined',pid,name:p.name,avatar:msg.avatar||'😊',
      players:room.publicSeats()},pid);
    p.ws.send(JSON.stringify({type:'joined',rid:msg.rid,cfg:room.cfg,
      players:room.publicSeats(),isHost:false}));
    if(room.seats.length>=room.cfg.maxPlayers){
      room.bcastAll({type:'starting',cd:3});
      setTimeout(()=>room.start(),3000);
    }
    return;
  }

  if (msg.type==='start') {
    const room=rooms.get(p.rid);
    if(!room||room.hostId!==pid)return;
    if(room.seats.length<4){p.ws.send(JSON.stringify({type:'err',msg:'تحتاج 4 لاعبين على الأقل'}));return;}
    room.bcastAll({type:'starting',cd:3});
    setTimeout(()=>room.start(),3000);
    return;
  }

  if (msg.type==='bet') {
    const room=rooms.get(p.rid);
    if(room) room.bet(pid,+msg.amt);
    return;
  }

  if (msg.type==='fold') {
    const room=rooms.get(p.rid);
    if(room) room.fold(pid);
    return;
  }

  if (msg.type==='rooms_list') {
    const list=[];
    rooms.forEach((r,id)=>{
      if(r.status==='waiting')
        list.push({id,count:r.seats.length,max:r.cfg.maxPlayers,
          minBet:r.cfg.minBet, isTournament:r.isTournament,
          entryCost:r.entryCost});
    });
    p.ws.send(JSON.stringify({type:'rooms',list}));
    return;
  }
}

function disconnect(pid) {
  const p=players.get(pid);
  if(p?.rid){
    const room=rooms.get(p.rid);
    if(room){
      room.unseat(pid);
      room.bcast({type:'player_left',pid,name:p.name});
      if(!room.seats.length) rooms.delete(p.rid);
    }
  }
  players.delete(pid);
}

const PORT = process.env.PORT||3001;
server.listen(PORT,()=>console.log(`✓ مليون سيرفر شغال على البورت ${PORT}`));
