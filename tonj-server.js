// tonj-server.js — موديول لعبة طنج (مستقل تماماً عن كود مليون)
// يتطلب جوا server.js: const Tonj = require('./tonj-server.js')(WebSocket);
//
// كل كود طنج بهالملف وحده — تقدر تعدل عليه بدون ما تلمس server.js أو لعبة مليون إطلاقاً.

module.exports = function (WebSocket) {

  const TONJ_SUITS = ['♠', '♥', '♦', '♣'];
  const TONJ_COLOR = { '♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red' };
  const TONJ_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const TONJ_RVAL = {};
  TONJ_RANKS.forEach((r, i) => (TONJ_RVAL[r] = i + 1));

  function tonjShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildTonjDeck(deckIdx) {
    const d = [];
    for (const s of TONJ_SUITS)
      for (const r of TONJ_RANKS)
        d.push({ id: `d${deckIdx}_${s}${r}`, suit: s, rank: r, val: TONJ_RVAL[r], color: TONJ_COLOR[s] });
    return tonjShuffle(d);
  }

  function tonjTop(pile) {
    return pile.length ? pile[pile.length - 1] : null;
  }

  function tonjCanFoundation(card, f) {
    if (!f) return false;
    return f.suit === card.suit && tonjTop(f.cards).val === card.val - 1;
  }
  function tonjCanMenazel(card, top) {
    if (!top) return true; // خانة منازل فاضية تقبل أي ورقة
    return top.color !== card.color && top.val === card.val + 1;
  }

  // بناء فوق "كف" الخصم (الورقة المكشوفة اللي فشلت تنمشي) — نفس النوع ورقم أقل بواحد.
  // فاضية = ما يصير تبنى عليها من الصفر (بعكس المنازل)، لأنها مِلك الخصم مو مكان عام.
  function tonjCanWaste(card, top) {
    if (!top) return false;
    return top.suit === card.suit && top.val === card.val + 1;
  }

  // كل الأوراق اللي ممكن تتحرك حالياً (أعلى الـ١٣ + أعلى كل خانة منازل)
  function tonjMovableSources(seat) {
    const list = [];
    if (seat.reserve.length) list.push({ srcType: 'reserve', srcIdx: -1, card: tonjTop(seat.reserve) });
    seat.menazel.forEach((p, i) => {
      if (p.length) list.push({ srcType: 'menazel', srcIdx: i, card: tonjTop(p) });
    });
    return list;
  }

  // كل الوجهات الشرعية لورقة معينة
  function tonjLegalDests(room, seat, opp, card) {
    const dests = [];
    room.foundations.forEach((f, fi) => {
      if (tonjCanFoundation(card, f)) dests.push({ destType: 'foundation', destIdx: fi });
    });
    if (card.rank === 'A' && room.foundations.length < 8) dests.push({ destType: 'newFoundation' });
    seat.menazel.forEach((p, mi) => {
      if (tonjCanMenazel(card, tonjTop(p))) dests.push({ destType: 'ownMenazel', destIdx: mi });
    });
    opp.menazel.forEach((p, mi) => {
      if (tonjCanMenazel(card, tonjTop(p))) dests.push({ destType: 'oppMenazel', destIdx: mi });
    });
    if (tonjCanWaste(card, tonjTop(opp.waste))) dests.push({ destType: 'oppWaste' });
    return dests;
  }

  // هل عند اللاعب حركة "فايتة" تحديداً: ورقة بالمنازل تقدر تروح فوق A موجودة، وما لعبها؟
  function tonjHasSkippedFoundationMove(room, seat) {
    return seat.menazel.some(p => {
      const top = tonjTop(p);
      return top && room.foundations.some(f => tonjCanFoundation(top, f));
    });
  }

  function tonjCardsLeft(seat) {
    return seat.reserve.length + seat.hand.length + seat.waste.length;
  }

  class TonjRoom {
    constructor(id, hostId) {
      this.id = id;
      this.hostId = hostId;
      this.type = 'tonj';
      this.seats = []; // {id,name,avatar,ws,menazel[4],reserve[],hand[],fire[],handDrawn}
      this.status = 'waiting';
      this.foundations = [];
      this.turn = null;
      this.tonjFlag = null; // {offenderId}
      this.winnerId = null;
      this.bestMinCardsLeft = 13 + 35; // أقل عدد أوراق وصله أي طرف طوال اللعبة — يُحدَّث كل حركة
      this.noImprove = 0; // عدد الحركات المتتالية بدون أي تحسّن حقيقي بأقل عدد أوراق
    }

    seat(p) { this.seats.push(p); }
    unseat(id) { this.seats = this.seats.filter(s => s.id !== id); }

    send(id, msg) {
      const s = this.seats.find(s => s.id === id);
      if (s && s.ws.readyState === WebSocket.OPEN) s.ws.send(JSON.stringify(msg));
    }
    bcast(msg, skip = null) {
      this.seats.forEach(s => {
        if (s.id !== skip && s.ws.readyState === WebSocket.OPEN) s.ws.send(JSON.stringify(msg));
      });
    }
    bcastAll(msg) { this.bcast(msg); }

    publicSeats() {
      return this.seats.map(s => ({ id: s.id, name: s.name, avatar: s.avatar }));
    }

    opponentOf(pid) { return this.seats.find(s => s.id !== pid); }
    seatOf(pid) { return this.seats.find(s => s.id === pid); }

    start() {
      this.status = 'playing';
      this.seats.forEach((s, i) => {
        const deck = buildTonjDeck(i);
        s.menazel = [[deck.pop()], [deck.pop()], [deck.pop()], [deck.pop()]];
        s.reserve = deck.splice(0, 13);
        s.hand = deck; // الباقي 35
        s.waste = []; // "كف" الورق المكشوف الفاشل — الخصم بس يقدر يبني عليه
        s.handDrawn = null;
      });
      this.foundations = [];
      this.tonjFlag = null;
      this.turn = this.seats[0].id;
      this.bestMinCardsLeft = Math.min(...this.seats.map(s => tonjCardsLeft(s)));
      this.noImprove = 0;
      this.bcastAll({ type: 'tonj_game_start', players: this.publicSeats() });
      this.syncState();
    }

    syncState() {
      this.bcastAll({
        type: 'tonj_state',
        status: this.status,
        turn: this.turn,
        tonjAvailable: !!this.tonjFlag,
        tonjAgainst: this.tonjFlag ? this.tonjFlag.offenderId : null,
        winnerId: this.winnerId,
        foundations: this.foundations.map(f => ({ suit: f.suit, cards: f.cards })),
        seats: this.seats.map(s => ({
          id: s.id, name: s.name, avatar: s.avatar,
          menazel: s.menazel,
          reserveTop: tonjTop(s.reserve), reserveCount: s.reserve.length,
          handCount: s.hand.length,
          waste: s.waste,
          handDrawn: s.handDrawn,
          cardsLeft: tonjCardsLeft(s)
        }))
      });
    }

    checkWin(seat) {
      if (tonjCardsLeft(seat) === 0) {
        this.status = 'over';
        this.winnerId = seat.id;
        this.bcastAll({ type: 'tonj_game_over', wid: seat.id, wname: seat.name });
        return true;
      }
      return false;
    }

    // يُستدعى بعد أي حركة أو محاولة سحب — يتتبع هل صار تقدم حقيقي (أقل عدد أوراق
    // وصله أي طرف) ولا لأ. هذا أدق من "هل نجحت حركة" لأن بناء ورقة فوق كف الخصم
    // حركة ناجحة تقنياً بس تزيد أوراقه — ممكن الطرفين يتبادلونها بدون أي تقدم فعلي.
    checkImprovement() {
      const m = Math.min(...this.seats.map(s => tonjCardsLeft(s)));
      if (m < this.bestMinCardsLeft) { this.bestMinCardsLeft = m; this.noImprove = 0; }
      else this.noImprove++;
    }

    // لو ما فيه أي تقدم حقيقي نحو الفوز لفترة طويلة (حتى لو فيه حركات ناجحة)، ننهي
    // اللعبة بدل ما تدور بحلقة بلا نهاية — الفايز صاحب أقل أوراق متبقية، أو تعادل حقيقي
    checkStalemate() {
      if (this.noImprove < 300) return false;
      const [s1, s2] = this.seats;
      const c1 = tonjCardsLeft(s1), c2 = tonjCardsLeft(s2);
      this.status = 'over';
      if (c1 === c2) {
        this.bcastAll({ type: 'tonj_game_over', wid: null, wname: null, reason: 'stalemate_draw' });
      } else {
        const winner = c1 < c2 ? s1 : s2;
        this.winnerId = winner.id;
        this.bcastAll({ type: 'tonj_game_over', wid: winner.id, wname: winner.name, reason: 'stalemate' });
      }
      return true;
    }

    // سحب ورقة جديدة من ورق اليمين (الـ35)
    draw(pid) {
      if (this.status !== 'playing' || this.turn !== pid) return;
      const seat = this.seatOf(pid), opp = this.opponentOf(pid);
      if (!seat || !opp || seat.handDrawn) return;

      // فرصة طنج: عنده حركة منازل-فوق-A فايتة وراح يسحب بدالها
      if (tonjHasSkippedFoundationMove(this, seat)) {
        this.tonjFlag = { offenderId: pid };
      } else {
        this.tonjFlag = null;
      }

      if (!seat.hand.length) {
        if (!seat.waste.length) { this.syncState(); return; } // ما فيه شي يسحب
        seat.hand = seat.waste.reverse(); // افتراض: الكف يرجع يد جديدة لو خلص ورق اليد
        seat.waste = [];
      }
      const card = seat.hand.pop();
      const dests = tonjLegalDests(this, seat, opp, card);
      if (dests.length) {
        seat.handDrawn = card; // بانتظار اللاعب يحدد وجهتها
      } else {
        seat.waste.push(card); // فشلت بكل مكان → تنحط مكشوفة فوق كفّه، وينتقل الدور
        this.turn = opp.id;
        this.checkImprovement();
        if (this.checkStalemate()) return;
        // ملاحظة: ما نمسح tonjFlag هنا — تضل متاحة للخصم حتى لو انتقل الدور تلقائياً
      }
      this.syncState();
    }

    move(pid, { srcType, srcIdx, destType, destIdx }) {
      if (this.status !== 'playing' || this.turn !== pid) return;
      const seat = this.seatOf(pid), opp = this.opponentOf(pid);
      if (!seat || !opp) return;

      let card = null, removeFromSource = null;
      if (srcType === 'reserve') {
        card = tonjTop(seat.reserve);
        removeFromSource = () => seat.reserve.pop();
      } else if (srcType === 'menazel') {
        const pile = seat.menazel[srcIdx];
        card = pile ? tonjTop(pile) : null;
        removeFromSource = () => pile.pop();
      } else if (srcType === 'handDrawn') {
        card = seat.handDrawn;
        removeFromSource = () => { seat.handDrawn = null; };
      }
      if (!card) return;

      const legal = tonjLegalDests(this, seat, opp, card);
      const match = legal.find(d =>
        d.destType === destType &&
        (destType !== 'foundation' || d.destIdx === destIdx) &&
        ((destType !== 'ownMenazel' && destType !== 'oppMenazel') || d.destIdx === destIdx)
      );
      if (!match) return; // حركة غير شرعية

      removeFromSource();
      if (destType === 'newFoundation') this.foundations.push({ suit: card.suit, cards: [card] });
      else if (destType === 'foundation') this.foundations[destIdx].cards.push(card);
      else if (destType === 'ownMenazel') seat.menazel[destIdx].push(card);
      else if (destType === 'oppMenazel') opp.menazel[destIdx].push(card);
      else if (destType === 'oppWaste') opp.waste.push(card);

      this.tonjFlag = null; // حركة شرعية تلغي أي فرصة طنج معلقة
      this.checkImprovement();
      if (this.checkWin(seat)) return;
      if (this.checkStalemate()) return;
      this.syncState();
    }

    // الخصم ينادي "طنج" على فرصة معلقة
    callTonj(pid) {
      if (this.status !== 'playing' || !this.tonjFlag) return;
      const caller = this.seatOf(pid);
      const offender = this.seatOf(this.tonjFlag.offenderId);
      if (!caller || !offender || caller.id === offender.id) return;

      // نفّذ الحركة الفايتة تلقائياً: أول ورقة منازل تقدر تروح فوق A موجودة
      outer: for (const pile of offender.menazel) {
        const top = tonjTop(pile);
        if (!top) continue;
        for (let fi = 0; fi < this.foundations.length; fi++) {
          if (tonjCanFoundation(top, this.foundations[fi])) {
            pile.pop();
            this.foundations[fi].cards.push(top);
            break outer;
          }
        }
      }
      if (offender.handDrawn) { offender.waste.push(offender.handDrawn); offender.handDrawn = null; }

      this.tonjFlag = null;
      this.turn = caller.id;
      this.checkImprovement();
      this.bcastAll({ type: 'tonj_called', byId: caller.id, byName: caller.name, againstId: offender.id, againstName: offender.name });
      if (this.checkWin(offender)) return;
      if (this.checkStalemate()) return;
      this.syncState();
    }
  }

  // ── معالج الرسائل (يُستدعى من handle() بملف server.js ) ──
  // يرجع true لو تعرّف على نوع الرسالة وتعامل معها
  function handleTonjMessage(pid, p, msg, rooms) {
    if (msg.type === 'tonj_create_room') {
      const rid = 'TJ' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const room = new TonjRoom(rid, pid);
      rooms.set(rid, room);
      room.seat({ id: pid, name: p.name, ws: p.ws, avatar: msg.avatar || '😊' });
      p.rid = rid;
      p.ws.send(JSON.stringify({ type: 'tonj_room_created', rid, players: room.publicSeats(), isHost: true }));
      return true;
    }

    if (msg.type === 'tonj_join_room') {
      const room = rooms.get(msg.rid);
      if (!room || room.type !== 'tonj') { p.ws.send(JSON.stringify({ type: 'err', msg: 'الغرفة غير موجودة' })); return true; }
      if (room.status !== 'waiting') { p.ws.send(JSON.stringify({ type: 'err', msg: 'اللعبة بدأت' })); return true; }
      if (room.seats.length >= 2) { p.ws.send(JSON.stringify({ type: 'err', msg: 'الغرفة ممتلئة' })); return true; }
      room.seat({ id: pid, name: p.name, ws: p.ws, avatar: msg.avatar || '😊' });
      p.rid = msg.rid;
      room.bcast({ type: 'player_joined', pid, name: p.name, avatar: msg.avatar || '😊', players: room.publicSeats() }, pid);
      p.ws.send(JSON.stringify({ type: 'tonj_joined', rid: msg.rid, players: room.publicSeats(), isHost: false }));
      room.bcastAll({ type: 'starting', cd: 3 });
      setTimeout(() => room.start(), 3000);
      return true;
    }

    if (msg.type === 'tonj_rooms_list') {
      const list = [];
      rooms.forEach((r, id) => {
        if (r.type === 'tonj' && r.status === 'waiting') list.push({ id, count: r.seats.length, max: 2 });
      });
      p.ws.send(JSON.stringify({ type: 'tonj_rooms', list }));
      return true;
    }

    if (msg.type === 'tonj_draw') {
      const room = rooms.get(p.rid);
      if (room && room.type === 'tonj') room.draw(pid);
      return true;
    }

    if (msg.type === 'tonj_move') {
      const room = rooms.get(p.rid);
      if (room && room.type === 'tonj') room.move(pid, msg);
      return true;
    }

    if (msg.type === 'tonj_call') {
      const room = rooms.get(p.rid);
      if (room && room.type === 'tonj') room.callTonj(pid);
      return true;
    }

    return false; // مو رسالة طنج
  }

  // ── يُستدعى من disconnect() بملف server.js لما يطلع لاعب من غرفة طنج ──
  function handleTonjDisconnect(pid, p, room) {
    if (room.type !== 'tonj') return;
    if (room.status === 'playing') {
      const opp = room.opponentOf(pid);
      room.status = 'over';
      if (opp) {
        room.winnerId = opp.id;
        room.bcastAll({ type: 'tonj_game_over', wid: opp.id, wname: opp.name, reason: 'opponent_left' });
      }
    }
  }

  return { TonjRoom, handleTonjMessage, handleTonjDisconnect };
};
