// ============================================================
//  js/tournament.js — bee platform
//  نظام البطولات الكامل
// ============================================================

// ===== صفحة البطولات =====
function openTournaments() {
  document.getElementById('tourn-page')?.remove();

  const page = document.createElement('div');
  page.id    = 'tourn-page';
  page.style.cssText = `
    position:fixed;inset:0;z-index:8000;background:#08080f;
    display:flex;flex-direction:column;font-family:inherit;direction:rtl;overflow:hidden;
  `;

  page.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid rgba(200,169,64,0.15);
      background:linear-gradient(135deg,#0d0d1e,#141428);
      display:flex;align-items:center;gap:12px;flex-shrink:0">
      <button onclick="document.getElementById('tourn-page').remove()"
        style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:36px;height:36px;color:#aaa;cursor:pointer;font-size:16px;flex-shrink:0">←</button>
      <div style="flex:1">
        <h2 style="margin:0;font-size:17px;color:#f0c040">🏆 البطولات</h2>
        <div style="font-size:10px;color:#705030;margin-top:1px">تنافس وافوز بالجوائز</div>
      </div>
      ${isAdmin ? `<button onclick="openCreateTournament()"
        style="background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0e00;
          border:none;border-radius:10px;padding:8px 14px;font-size:12px;
          font-weight:900;cursor:pointer;font-family:inherit">+ إنشاء</button>` : ''}
    </div>

    <div style="display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">
      ${['active','upcoming','finished'].map((t,i) => `
        <button id="tab-${t}" onclick="switchTournTab('${t}')"
          style="flex:1;padding:10px;background:${i===0?'rgba(200,169,64,0.1)':'transparent'};
            color:${i===0?'#f0c040':'#555'};border:none;border-bottom:2px solid ${i===0?'#c8a940':'transparent'};
            font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:.2s">
          ${t==='active'?'🔴 نشطة':t==='upcoming'?'⏳ قادمة':'✅ منتهية'}
        </button>`).join('')}
    </div>

    <div id="tourn-list" style="flex:1;overflow-y:auto;padding:12px 14px">
      <div style="text-align:center;color:#555;padding:40px">جاري التحميل...</div>
    </div>`;

  document.body.appendChild(page);
  loadTournaments('active');
}

let currentTab = 'active';
function switchTournTab(tab) {
  currentTab = tab;
  ['active','upcoming','finished'].forEach(t => {
    const btn = document.getElementById('tab-' + t);
    if (!btn) return;
    btn.style.background    = t === tab ? 'rgba(200,169,64,0.1)' : 'transparent';
    btn.style.color         = t === tab ? '#f0c040' : '#555';
    btn.style.borderBottom  = t === tab ? '2px solid #c8a940' : '2px solid transparent';
  });
  loadTournaments(tab);
}

// ===== تحميل البطولات =====
function loadTournaments(status) {
  const list = document.getElementById('tourn-list'); if (!list) return;
  list.innerHTML = '<div style="text-align:center;color:#555;padding:40px;font-size:13px">جاري التحميل...</div>';

  db.ref('tournaments').orderByChild('status').equalTo(status).once('value', snap => {
    if (!snap.exists()) {
      const msgs = { active:'لا توجد بطولات نشطة', upcoming:'لا توجد بطولات قادمة', finished:'لا توجد بطولات منتهية' };
      list.innerHTML = `
        <div style="text-align:center;padding:60px 20px">
          <div style="font-size:48px;margin-bottom:12px">🏆</div>
          <div style="color:#555;font-size:13px">${msgs[status]}</div>
        </div>`;
      return;
    }

    const items = [];
    snap.forEach(s => items.push({ id: s.key, ...s.val() }));
    items.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
    list.innerHTML = items.map(t => buildTournamentCard(t)).join('');
  });
}

function buildTournamentCard(t) {
  const user       = auth.currentUser;
  const myUid      = user?.uid;
  const registered = t.players && myUid && t.players[myUid];
  const count      = t.players ? Object.keys(t.players).length : 0;
  const full       = count >= (t.maxPlayers || 8);
  const prize1     = t.prize || 0;
  const prize2     = Math.floor(prize1 * 0.5);
  const prize3     = Math.floor(prize1 * 0.25);
  const statusColors = { active:'#2ed573', upcoming:'#fbbf24', finished:'#888' };
  const statusLabels = { active:'🔴 جارية', upcoming:'⏳ قادمة', finished:'✅ منتهية' };

  return `
    <div style="background:linear-gradient(135deg,rgba(15,12,3,0.9),rgba(22,18,5,0.9));
      border:1px solid rgba(200,169,64,0.2);border-radius:18px;padding:16px;
      margin-bottom:12px;overflow:hidden;position:relative">

      <!-- خلفية زخرفية -->
      <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;
        border-radius:50%;background:radial-gradient(circle,rgba(200,169,64,0.08),transparent);
        pointer-events:none"></div>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-size:16px;font-weight:900;color:#f0e8d0;margin-bottom:3px">
            ${escapeHTML(t.name || 'بطولة')}
          </div>
          <div style="font-size:11px;color:${statusColors[t.status]};font-weight:700">
            ${statusLabels[t.status]}
          </div>
        </div>
        <div style="text-align:left">
          <div style="font-size:20px;font-weight:900;color:#f0c040">
            🪙 ${(prize1||0).toLocaleString('ar')}
          </div>
          <div style="font-size:9px;color:#705030">الجائزة الأولى</div>
        </div>
      </div>

      <!-- الجوائز -->
      <div style="display:flex;gap:6px;margin-bottom:12px">
        ${[['🥇','1',prize1],['🥈','2',prize2],['🥉','3',prize3]].map(([m,p,v]) => `
          <div style="flex:1;background:rgba(255,255,255,0.04);border-radius:8px;padding:6px;text-align:center">
            <div style="font-size:14px">${m}</div>
            <div style="font-size:11px;font-weight:700;color:#fbbf24">${v.toLocaleString('ar')} 🪙</div>
          </div>`).join('')}
      </div>

      <!-- معلومات -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;font-size:11px;color:#888">
        <span>👥 ${count}/${t.maxPlayers||8} لاعب</span>
        <span>🎮 ${escapeHTML(t.game || 'مليون')}</span>
        <span>💰 دخول: ${t.entryFee||0} 🪙</span>
        ${t.startDate ? `<span>📅 ${new Date(t.startDate).toLocaleDateString('ar')}</span>` : ''}
      </div>

      <!-- شريط التسجيل -->
      <div style="background:rgba(255,255,255,0.05);border-radius:6px;height:4px;overflow:hidden;margin-bottom:12px">
        <div style="height:100%;width:${Math.min(100, count/(t.maxPlayers||8)*100)}%;
          background:linear-gradient(90deg,#c8a940,#f0c040);border-radius:6px;transition:width .5s"></div>
      </div>

      ${t.status === 'upcoming' ? `
        ${registered
          ? `<div style="width:100%;padding:10px;background:rgba(46,213,115,0.1);color:#2ed573;
              border:1px solid rgba(46,213,115,0.3);border-radius:10px;text-align:center;
              font-size:12px;font-weight:700">✅ مسجّل بالفعل</div>`
          : full
          ? `<div style="width:100%;padding:10px;background:rgba(255,255,255,0.05);color:#555;
              border:1px solid rgba(255,255,255,0.1);border-radius:10px;text-align:center;
              font-size:12px">اكتمل العدد</div>`
          : `<button onclick="registerTournament('${t.id}','${t.entryFee||0}')"
              style="width:100%;padding:11px;background:linear-gradient(135deg,#c8a940,#f0c040);
                color:#1a0e00;border:none;border-radius:10px;font-weight:900;font-size:13px;
                cursor:pointer;font-family:inherit">
              ${t.entryFee > 0 ? `🪙 سجّل (${t.entryFee} كوينز)` : 'سجّل مجاناً'}
            </button>`}
      ` : t.status === 'active' ? `
        <button onclick="viewBracket('${t.id}')"
          style="width:100%;padding:11px;background:rgba(200,169,64,0.15);color:#f0c040;
            border:1px solid rgba(200,169,64,0.3);border-radius:10px;font-weight:900;
            font-size:13px;cursor:pointer;font-family:inherit">
          👁️ شاهد الـBracket
        </button>
      ` : `
        <button onclick="viewBracket('${t.id}')"
          style="width:100%;padding:10px;background:rgba(255,255,255,0.05);color:#888;
            border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-weight:700;
            font-size:12px;cursor:pointer;font-family:inherit">
          النتائج النهائية
        </button>
      `}
    </div>`;
}

// ===== التسجيل =====
function registerTournament(tournId, fee) {
  const user = auth.currentUser; if (!user) return;
  fee = parseInt(fee) || 0;

  if (fee > 0 && currentCoins < fee) {
    alert(`تحتاج ${fee} 🪙 للتسجيل!`); return;
  }
  if (!confirm(`التسجيل في البطولة${fee > 0 ? ` مقابل ${fee} 🪙` : ' مجاناً'}؟`)) return;

  db.ref('tournaments/' + tournId + '/players/' + user.uid).once('value', snap => {
    if (snap.exists()) { alert('أنت مسجّل بالفعل!'); return; }

    const doRegister = () => {
      db.ref('tournaments/' + tournId + '/players/' + user.uid).set({
        username: currentUsername, uid: user.uid,
        registeredAt: firebase.database.ServerValue.TIMESTAMP
      }, err => {
        if (!err) {
          if (typeof showToast === 'function') showToast('✅ تم التسجيل في البطولة!');
          if (typeof sendNotification === 'function')
            sendNotification(user.uid, 'system', '🏆 تم التسجيل', `سجّلت في بطولة بنجاح!`);
          loadTournaments(currentTab);

          // فحص اكتمال العدد
          db.ref('tournaments/' + tournId).once('value', snap => {
            const t = snap.val();
            if (t && t.players && Object.keys(t.players).length >= (t.maxPlayers || 8)) {
              if (isAdmin) generateBracket(tournId);
            }
          });
        }
      });
    };

    if (fee > 0) {
      db.ref('users/' + user.uid).transaction(u => {
        if (!u || u.coins < fee) return u;
        u.coins -= fee; return u;
      }, (err, committed) => { if (committed) doRegister(); else alert('فشل خصم الرسوم.'); });
    } else {
      doRegister();
    }
  });
}

// ===== توليد الـBracket =====
function generateBracket(tournId) {
  db.ref('tournaments/' + tournId + '/players').once('value', snap => {
    if (!snap.exists()) return;
    let players = [];
    snap.forEach(s => players.push({ uid: s.key, ...s.val() }));

    // خلط عشوائي
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    // بناء الـRound 1
    const matches = {};
    for (let i = 0; i < Math.floor(players.length / 2); i++) {
      const matchId = 'r1_m' + (i + 1);
      matches[matchId] = {
        round: 1, matchNum: i + 1,
        player1: { uid: players[i*2].uid, username: players[i*2].username, score: 0 },
        player2: { uid: players[i*2+1].uid, username: players[i*2+1].username, score: 0 },
        status: 'pending', winner: null
      };
    }

    // لو عدد فردي، اللاعب الأخير يعبر مباشرة
    if (players.length % 2 !== 0) {
      const last = players[players.length - 1];
      matches['r1_bye'] = {
        round: 1, matchNum: Math.ceil(players.length / 2),
        player1: { uid: last.uid, username: last.username, score: 0 },
        player2: null, status: 'bye', winner: last.uid
      };
    }

    db.ref('tournaments/' + tournId).update({
      bracket: matches,
      totalRounds: Math.ceil(Math.log2(players.length)),
      currentRound: 1,
      status: 'active'
    }, () => {
      if (typeof showToast === 'function') showToast('🏆 بدأت البطولة!');
      loadTournaments('active');
    });
  });
}

// ===== عرض الـBracket =====
function viewBracket(tournId) {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';
  content.innerHTML = '<div style="text-align:center;color:#888;padding:20px">جاري التحميل...</div>';

  db.ref('tournaments/' + tournId).once('value', snap => {
    const t = snap.val(); if (!t) return;
    const bracket = t.bracket || {};
    const rounds  = {};

    Object.entries(bracket).forEach(([id, m]) => {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push({ id, ...m });
    });

    const roundNames = ['', 'ربع النهائي', 'نصف النهائي', 'النهائي'];

    content.innerHTML = `
      <div style="text-align:right">
        <h3 style="margin:0 0 4px;color:#f0c040;font-size:15px">🏆 ${escapeHTML(t.name||'بطولة')}</h3>
        <div style="font-size:11px;color:#888;margin-bottom:14px">
          الجائزة الأولى: <strong style="color:#f0c040">${(t.prize||0).toLocaleString('ar')} 🪙</strong>
        </div>

        ${Object.entries(rounds).map(([round, matches]) => `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;color:#705030;font-weight:700;margin-bottom:8px">
              الجولة ${round} — ${roundNames[parseInt(round)] || ''}
            </div>
            ${matches.sort((a,b) => a.matchNum - b.matchNum).map(m => `
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                border-radius:12px;padding:10px;margin-bottom:8px">
                ${m.status === 'bye'
                  ? `<div style="font-size:12px;color:#2ed573">
                      ✅ ${escapeHTML(m.player1?.username||'')} — عبر مباشرة
                    </div>`
                  : `<div style="display:flex;align-items:center;gap:8px">
                      <div style="flex:1">
                        <div style="font-size:12px;font-weight:700;
                          color:${m.winner===m.player1?.uid?'#2ed573':m.winner?'#555':'#f0e8d0'}">
                          ${m.winner === m.player1?.uid ? '🏆 ' : ''}${escapeHTML(m.player1?.username||'—')}
                        </div>
                      </div>
                      <div style="font-size:11px;color:#555;font-weight:700">VS</div>
                      <div style="flex:1;text-align:left">
                        <div style="font-size:12px;font-weight:700;
                          color:${m.winner===m.player2?.uid?'#2ed573':m.winner?'#555':'#f0e8d0'}">
                          ${m.winner === m.player2?.uid ? '🏆 ' : ''}${escapeHTML(m.player2?.username||'—')}
                        </div>
                      </div>
                      ${isAdmin && !m.winner && m.status !== 'bye' ? `
                        <button onclick="declareWinner('${tournId}','${m.id}','${m.player1?.uid}','${escapeHTML(m.player1?.username||'')}','${m.player2?.uid}','${escapeHTML(m.player2?.username||'')}')"
                          style="background:#c8a940;color:#1a0e00;border:none;border-radius:6px;
                            font-size:10px;padding:5px 8px;cursor:pointer;font-family:inherit;flex-shrink:0">
                          نتيجة
                        </button>` : ''}
                    </div>`}
                <div style="font-size:10px;color:#444;margin-top:4px;text-align:center">
                  ${m.status==='pending'?'⏳ لم تُلعب':m.status==='bye'?'':'✅ انتهت'}
                </div>
              </div>`).join('')}
          </div>`).join('')}

        ${t.champion ? `
          <div style="background:linear-gradient(135deg,rgba(200,169,64,0.2),rgba(240,192,64,0.1));
            border:1px solid rgba(200,169,64,0.4);border-radius:14px;padding:14px;text-align:center">
            <div style="font-size:32px;margin-bottom:6px">🏆</div>
            <div style="font-size:11px;color:#705030;margin-bottom:4px">البطل</div>
            <div style="font-size:18px;font-weight:900;color:#f0c040">${escapeHTML(t.champion)}</div>
          </div>` : ''}
      </div>`;
  });
}

// ===== تحديد الفائز (أدمن) =====
function declareWinner(tournId, matchId, p1Uid, p1Name, p2Uid, p2Name) {
  const choice = confirm(`من الفائز؟\n\nحسناً = ${p1Name}\nإلغاء = ${p2Name}`);
  const winUid  = choice ? p1Uid  : p2Uid;
  const winName = choice ? p1Name : p2Name;
  const loseUid = choice ? p2Uid  : p1Uid;

  db.ref('tournaments/' + tournId + '/bracket/' + matchId).update({
    winner: winUid, status: 'done'
  }, () => {
    // تحقق هل انتهت كل مباريات الجولة
    db.ref('tournaments/' + tournId).once('value', snap => {
      const t       = snap.val(); if (!t) return;
      const bracket = t.bracket || {};
      const round   = bracket[matchId]?.round || 1;

      const roundMatches = Object.values(bracket).filter(m => m.round === round);
      const allDone      = roundMatches.every(m => m.winner || m.status === 'bye');

      if (allDone) {
        const winners = roundMatches.map(m => ({
          uid: m.winner, username: m.winner === m.player1?.uid ? m.player1.username : m.player2?.username
        })).filter(w => w.uid);

        if (winners.length === 1) {
          // البطل محدد — توزيع الجوائز
          const champion = winners[0];
          const prize1   = t.prize || 0;
          const prize2   = Math.floor(prize1 * 0.5);
          const prize3   = Math.floor(prize1 * 0.25);

          // الجوائز
          db.ref('users/' + champion.uid + '/coins').transaction(c => (c||0) + prize1);
          if (typeof sendNotification === 'function')
            sendNotification(champion.uid, 'system', '🏆 بطل البطولة!', `فزت بـ ${prize1.toLocaleString()} 🪙!`);

          // الثاني والثالث من الجولة الأخيرة
          const losers = roundMatches.map(m => ({
            uid: m.winner === m.player1?.uid ? m.player2?.uid : m.player1?.uid,
            username: m.winner === m.player1?.uid ? m.player2?.username : m.player1?.username
          })).filter(l => l.uid);

          if (losers[0]) {
            db.ref('users/' + losers[0].uid + '/coins').transaction(c => (c||0) + prize2);
            if (typeof sendNotification === 'function')
              sendNotification(losers[0].uid, 'system', '🥈 المركز الثاني', `حصلت على ${prize2.toLocaleString()} 🪙!`);
          }

          db.ref('tournaments/' + tournId).update({
            status: 'finished', champion: champion.username,
            championUid: champion.uid
          });
          if (typeof showToast === 'function') showToast(`🏆 ${champion.username} بطل البطولة!`);

        } else if (winners.length > 1) {
          // بناء الجولة التالية
          const newRound   = round + 1;
          const newMatches = {};
          for (let i = 0; i < Math.floor(winners.length / 2); i++) {
            const mid = `r${newRound}_m${i+1}`;
            newMatches[mid] = {
              round: newRound, matchNum: i+1,
              player1: { uid: winners[i*2].uid, username: winners[i*2].username, score: 0 },
              player2: { uid: winners[i*2+1].uid, username: winners[i*2+1].username, score: 0 },
              status: 'pending', winner: null
            };
          }
          if (winners.length % 2 !== 0) {
            const last = winners[winners.length-1];
            newMatches[`r${newRound}_bye`] = {
              round: newRound, matchNum: Math.ceil(winners.length/2),
              player1: { uid: last.uid, username: last.username, score: 0 },
              player2: null, status: 'bye', winner: last.uid
            };
          }
          const updates = {};
          Object.entries(newMatches).forEach(([k,v]) => { updates['bracket/' + k] = v; });
          updates.currentRound = newRound;
          db.ref('tournaments/' + tournId).update(updates,
            () => { if (typeof showToast === 'function') showToast(`الجولة ${newRound} بدأت!`); });
        }
      }
      viewBracket(tournId);
    });
  });
}

// ===== إنشاء بطولة (أدمن) =====
function openCreateTournament() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content || !isAdmin) return;
  modal.style.display = 'flex';

  const games    = ['مليون','قلب العملة','رمي النرد','خمّن الرقم'];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0,16);

  content.innerHTML = `
    <h3 style="margin:0 0 14px;color:#f0c040;font-size:15px">🏆 إنشاء بطولة جديدة</h3>
    <input type="text" id="t-name" placeholder="اسم البطولة..." class="input-field" style="margin-bottom:8px">
    <select id="t-game" class="input-field" style="margin-bottom:8px">
      ${games.map(g => `<option>${g}</option>`).join('')}
    </select>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <input type="number" id="t-prize"    placeholder="الجائزة 🪙" class="input-field" value="500">
      <input type="number" id="t-fee"      placeholder="رسوم الدخول" class="input-field" value="0">
      <input type="number" id="t-max"      placeholder="أقصى لاعبين" class="input-field" value="8">
      <input type="datetime-local" id="t-date" class="input-field" value="${tomorrow}">
    </div>
    <textarea id="t-desc" placeholder="وصف البطولة (اختياري)..." rows="2"
      class="input-field" style="margin-bottom:12px;resize:none"></textarea>
    <button onclick="createTournament()"
      style="width:100%;padding:12px;background:linear-gradient(135deg,#c8a940,#f0c040);
        color:#1a0e00;border:none;border-radius:12px;font-weight:900;font-size:14px;
        cursor:pointer;font-family:inherit">
      🏆 إنشاء البطولة
    </button>`;
}

function createTournament() {
  if (!isAdmin) return;
  const name  = document.getElementById('t-name')?.value.trim();
  const game  = document.getElementById('t-game')?.value;
  const prize = parseInt(document.getElementById('t-prize')?.value) || 0;
  const fee   = parseInt(document.getElementById('t-fee')?.value)   || 0;
  const max   = parseInt(document.getElementById('t-max')?.value)   || 8;
  const date  = document.getElementById('t-date')?.value;
  const desc  = document.getElementById('t-desc')?.value.trim();

  if (!name) { alert('أدخل اسم البطولة'); return; }
  if (prize <= 0) { alert('أدخل قيمة الجائزة'); return; }

  db.ref('tournaments').push({
    name, game, prize, entryFee: fee, maxPlayers: max,
    startDate: date ? new Date(date).getTime() : null,
    description: desc || '',
    status: 'upcoming',
    players: {}, bracket: {},
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    createdBy: currentUsername
  }, err => {
    if (!err) {
      if (typeof showToast === 'function') showToast('✅ تم إنشاء البطولة!');
      document.getElementById('profile-modal').style.display = 'none';
      loadTournaments('upcoming');
      switchTournTab('upcoming');
    }
  });
}
