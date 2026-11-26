// minute-server.js — لعبة «تحدّي الدقيقة» (واحد ضد واحد بالصوت)
// نفس نظام tonj-server.js: كل رسائلها تبدأ بـ minute_
// السيرفر هو اللي يحسب الوقت والدور والتخطيات، واللاعبين يرسلون بس "جاوبت صح" أو "تخطي"
module.exports = function (WebSocket) {
  const TIME = 60000, SKIPS = 3, MAX_DECK = 60;
  const cleanAv = a => { a = String(a || '😊'); return a.length > 300 ? '😊' : a; };

  class MinuteRoom {
    constructor(id, priv) {
      this.id = id; this.priv = priv; this.type = 'minute'; this.status = 'waiting';
      this.seats = []; this.deck = []; this.timer = null;
    }
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
    seatOf(id) { const i = this.seats.findIndex(s => s.id === id); return i === 0 ? 'a' : i === 1 ? 'b' : null; }
    other(id) { return this.seats.find(s => s.id !== id); }

    ready() {
      const players = this.seats.map((s, i) => ({ seat: i ? 'b' : 'a', name: s.name, avatar: s.avatar }));
      this.seats.forEach((s, i) => this.send(s.id, { type: 'minute_ready', rid: this.id, seat: i ? 'b' : 'a', players }));
    }

    start(deck) {
      this.status = 'playing'; this.deck = deck; this.idx = 0;
      this.turn = Math.random() < 0.5 ? 'a' : 'b';
      this.T = { a: TIME, b: TIME }; this.S = { a: SKIPS, b: SKIPS }; this.C = { a: 0, b: 0 };
      this.last = Date.now(); this.lastAns = 0;
      const [a, b] = this.seats;
      this.bcast({ type: 'minute_go', deck, turn: this.turn,
        names: { a: a.name, b: b.name }, avs: { a: a.avatar, b: b.avatar } });
      clearInterval(this.timer);
      this.timer = setInterval(() => { try { this.tick(); } catch (e) { console.error(e); } }, 200);
    }

    tick() {
      if (this.status !== 'playing') return;
      const n = Date.now();
      this.T[this.turn] -= n - this.last; this.last = n;
      if (this.T[this.turn] <= 0) { this.T[this.turn] = 0; this.finish(this.turn, 'time'); }
    }

    state(f) { return { type: 'minute_st', turn: this.turn, idx: this.idx, T: this.T, S: this.S, C: this.C, f }; }

    answer(id, ok) {
      if (this.status !== 'playing') return;
      const n = Date.now();
      if (this.seatOf(id) !== this.turn || n - this.lastAns < 300) { this.send(id, this.state('')); return; }
      this.lastAns = n;
      this.tick();
      if (this.status !== 'playing') return;
      const d = this.deck[this.idx % this.deck.length].d;
      if (ok) {
        this.C[this.turn]++; this.idx++; this.turn = this.turn === 'a' ? 'b' : 'a';
        this.bcast(this.state('✓ ' + d));
      } else if (this.S[this.turn] > 0) {
        this.S[this.turn]--; this.idx++;
        this.bcast(this.state('كانت: ' + d));
      } else {
        this.send(id, this.state(''));
      }
    }

    finish(loser, reason) {
      if (this.status !== 'playing') return;
      this.status = 'over'; clearInterval(this.timer);
      this.bcast({ type: 'minute_end', l: loser, reason, turn: this.turn, idx: this.idx, T: this.T, S: this.S, C: this.C });
    }
  }

  function handleMinuteMessage(pid, p, msg, rooms) {
    const cur = rooms.get(p.rid);
    const room = cur && cur.type === 'minute' ? cur : null;
    const err = m => p.ws.send(JSON.stringify({ type: 'err', msg: m }));
    const sit = r => { r.seats.push({ id: pid, name: p.name, avatar: cleanAv(msg.avatar), ws: p.ws }); p.rid = r.id; };

    switch (msg.type) {
      case 'minute_quick': case 'minute_create': case 'minute_join': {
        if (room) return;
        let r = null;
        if (msg.type === 'minute_quick') {
          rooms.forEach(x => { if (!r && x.type === 'minute' && x.status === 'waiting' && !x.priv && x.seats.length === 1) r = x; });
        } else if (msg.type === 'minute_join') {
          r = rooms.get(String(msg.rid || '').toUpperCase());
          if (!r || r.type !== 'minute') return err('الغرفة غير موجودة');
          if (r.status !== 'waiting' || r.seats.length >= 2) return err('الغرفة ممتلئة أو بدأت');
        }
        if (r) { sit(r); r.ready(); return; }
        let rid;
        do { rid = 'M' + Math.random().toString(36).slice(2, 6).toUpperCase(); } while (rooms.has(rid));
        r = new MinuteRoom(rid, msg.type === 'minute_create');
        rooms.set(rid, r); sit(r);
        p.ws.send(JSON.stringify({ type: 'minute_room', rid, seat: 'a', priv: r.priv }));
        return;
      }
      case 'minute_start': {
        if (!room || room.seatOf(pid) !== 'a' || room.seats.length < 2 || room.status === 'playing') return;
        const deck = (Array.isArray(msg.deck) ? msg.deck : []).slice(0, MAX_DECK).map(x => ({
          u: String((x && x.u) || '').slice(0, 300),
          a: (Array.isArray(x && x.a) ? x.a : []).slice(0, 40).map(s => String(s).slice(0, 60)),
          d: String((x && x.d) || '').slice(0, 40)
        })).filter(x => /^https:\/\//.test(x.u) && x.a.length && x.d);
        if (deck.length < 6) return err('عدد الأسئلة قليل');
        room.start(deck);
        return;
      }
      case 'minute_ok': if (room) room.answer(pid, true); return;
      case 'minute_skip': if (room) room.answer(pid, false); return;
      case 'minute_sig': {            // إشارات مكالمة الصوت (WebRTC) — نمررها للخصم فقط
        const o = room && room.other(pid);
        if (o && JSON.stringify(msg.data || '').length < 8000) room.send(o.id, { type: 'minute_sig', data: msg.data });
        return;
      }
      case 'minute_cap': {            // نص كلامك المباشر للخصم (احتياط لو المكالمة ما اشتغلت)
        const o = room && room.other(pid);
        if (o) room.send(o.id, { type: 'minute_cap', t: String(msg.t || '').slice(0, 80) });
        return;
      }
    }
  }

  function handleMinuteDisconnect(pid, p, room) {
    if (room.status === 'playing') room.finish(room.seatOf(pid) || 'a', 'left');
    clearInterval(room.timer);
  }

  return { handleMinuteMessage, handleMinuteDisconnect };
};
