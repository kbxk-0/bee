// ============================================================
//  js/games.js — bee platform
//  قائمة الألعاب + منطق كل لعبة
// ============================================================

const GAMES_LIST = [
  { id: 'million',  name: 'مليون',   icon: '🃏', desc: 'لعبة الورق متعدد اللاعبين', external: true },
  { id: 'warzone',  name: 'وورزون',  icon: '⚔️', desc: 'لعبة الحرب والرتب العسكرية', external: true },
  { id: 'silent',   name: 'المواجهة الصامتة', icon: '🤫', desc: 'لعبة التوقع والذكاء النفسي', external: true },
];

// ===== رسم صفحة الألعاب =====
function renderGames() {
  const sec = document.getElementById('games');
  if (!sec) return;

  sec.innerHTML = `
    <div style="color:white;padding:5px 4px 20px">
      <div style="background:rgba(14,11,4,0.82);border:1px solid rgba(200,169,64,0.2);
        border-radius:16px;padding:14px 16px;margin-bottom:14px">
        <h2 style="margin:0 0 4px;font-size:15px;font-weight:900;color:#f0c040">🎮 صالة الألعاب</h2>
        <p style="margin:0;font-size:11px;color:#705030">اختر لعبتك وابدأ</p>
      </div>

      <div onclick="openGame('million')"
        style="background:linear-gradient(135deg,rgba(20,16,5,0.9),rgba(30,22,5,0.9));
          border:1px solid rgba(200,169,64,0.35);border-radius:20px;overflow:hidden;
          cursor:pointer;position:relative;height:180px;margin-bottom:12px;
          box-shadow:0 8px 30px rgba(0,0,0,0.5)"
        onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform=''">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          display:flex;justify-content:center;align-items:center;font-size:80px;opacity:0.25">🃏</div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 18px;
          background:linear-gradient(to top,rgba(0,0,0,0.9),transparent)">
          <div style="font-size:20px;font-weight:900;color:#f0c040;margin-bottom:4px">🃏 مليون</div>
          <div style="font-size:12px;color:#b09060">لعبة الورق متعدد اللاعبين — راهن وافوز</div>
          <div style="margin-top:10px;display:inline-block;
            background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0e00;
            padding:6px 20px;border-radius:10px;font-size:12px;font-weight:900">العب الآن ←</div>
        </div>
      </div>

      <div onclick="window.location.href='games/warzone-game.html'"
        style="background:linear-gradient(135deg,rgba(5,8,20,0.95),rgba(10,5,20,0.95));
          border:1px solid rgba(150,80,220,0.4);border-radius:20px;overflow:hidden;
          cursor:pointer;position:relative;height:180px;margin-bottom:12px;
          box-shadow:0 8px 30px rgba(120,0,200,0.2)"
        onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform=''">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          display:flex;justify-content:center;align-items:center;font-size:80px;opacity:0.18">⚔️</div>
        <div style="position:absolute;top:12px;right:14px;
          background:linear-gradient(135deg,#8b0000,#cc2200);color:white;
          font-size:10px;font-weight:900;padding:3px 10px;border-radius:8px;letter-spacing:1px">جديد</div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 18px;
          background:linear-gradient(to top,rgba(0,0,0,0.92),transparent)">
          <div style="font-size:20px;font-weight:900;color:#c060ff;margin-bottom:4px">⚔️ وورزون</div>
          <div style="font-size:12px;color:#9070b0">لعبة الحرب والرتب العسكرية — 4 لاعبين</div>
          <div style="margin-top:10px;display:inline-block;
            background:linear-gradient(135deg,#8020c0,#c060ff);color:white;
            padding:6px 20px;border-radius:10px;font-size:12px;font-weight:900">العب الآن ←</div>
        </div>
      </div>

      <div onclick="window.location.href='games/silent-showdown.html'"
        style="background:linear-gradient(135deg,rgba(5,20,15,0.95),rgba(5,15,20,0.95));
          border:1px solid rgba(46,213,115,0.4);border-radius:20px;overflow:hidden;
          cursor:pointer;position:relative;height:180px;margin-bottom:12px;
          box-shadow:0 8px 30px rgba(46,213,115,0.15)"
        onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform=''">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          display:flex;justify-content:center;align-items:center;font-size:80px;opacity:0.18">🤫</div>
        <div style="position:absolute;top:12px;right:14px;
          background:linear-gradient(135deg,#2ed573,#1abc9c);color:black;
          font-size:10px;font-weight:900;padding:3px 10px;border-radius:8px;letter-spacing:1px">جديد</div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 18px;
          background:linear-gradient(to top,rgba(0,0,0,0.92),transparent)">
          <div style="font-size:20px;font-weight:900;color:#2ed573;margin-bottom:4px">🤫 المواجهة الصامتة</div>
          <div style="font-size:12px;color:#90b0a0">لعبة التوقع والذكاء النفسي — شخصين أو أكثر</div>
          <div style="margin-top:10px;display:inline-block;
            background:linear-gradient(135deg,#2ed573,#20bf6b);color:black;
            padding:6px 20px;border-radius:10px;font-size:12px;font-weight:900">العب الآن ←</div>
        </div>
      </div>

      <div style="background:rgba(14,11,4,0.6);border:1px solid rgba(200,169,64,0.1);
        border-radius:14px;padding:16px;text-align:center">
        <div style="font-size:28px;margin-bottom:8px">🎯</div>
        <div style="font-size:13px;font-weight:700;color:#b09060;margin-bottom:4px">ألعاب جديدة قريباً</div>
        <div style="font-size:11px;color:#705030">نعمل على إضافة المزيد من الألعاب</div>
      </div>

      <div id="game-area"></div>
    </div>`;
}

// ===== فتح لعبة كلعبة نشطة في الرئيسية =====
function openGame(id) {
  activeGame = id;
  localStorage.setItem('activeGame', id);
  showSection('home');
}

// ===== تشغيل لعبة في منطقة game-area =====
function playGame(id) {
  const area = document.getElementById('game-area');
  if (!area) return;
  localStorage.setItem('lastGame', id);

  const betInput = (min = 1) => `
    <input type="number" id="bet-amount" placeholder="الرهان..." min="${min}" max="${currentCoins}"
      class="input-field" style="text-align:center;font-size:16px;margin:10px auto;width:60%;display:block">
    <div style="font-size:11px;color:#aaa;margin-bottom:12px">
      رصيدك: <strong style="color:#ffd700">${currentCoins} 🪙</strong>
    </div>`;

  const games = {
    coinflip: `
      <div style="background:#1a1a28;border-radius:14px;border:1px solid #6c63ff;padding:18px;text-align:center;color:white">
        <h3 style="color:#6c63ff;margin-top:0">🪙 قلب العملة</h3>
        <p style="font-size:12px;color:#aaa">راهن واختر — تفوز بضعف رهانك</p>
        ${betInput()}
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="playCoinFlip('heads')" style="flex:1;max-width:110px;padding:10px;background:#6c63ff;color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">طُرّة</button>
          <button onclick="playCoinFlip('tails')" style="flex:1;max-width:110px;padding:10px;background:#ff4757;color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">نقش</button>
        </div>
        <div id="game-result" style="margin-top:14px;font-weight:bold;font-size:15px;min-height:24px"></div>
      </div>`,

    dice: `
      <div style="background:#1a1a28;border-radius:14px;border:1px solid #ff6584;padding:18px;text-align:center;color:white">
        <h3 style="color:#ff6584;margin-top:0">🎲 رمي النرد</h3>
        <p style="font-size:12px;color:#aaa">عالي (٤-٦) أو منخفض (١-٣) — تفوز بضعف رهانك</p>
        ${betInput()}
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="playDice('high')" style="flex:1;max-width:110px;padding:10px;background:#ff6584;color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">⬆️ عالي</button>
          <button onclick="playDice('low')"  style="flex:1;max-width:110px;padding:10px;background:#6c63ff;color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">⬇️ منخفض</button>
        </div>
        <div id="game-result" style="margin-top:14px;font-weight:bold;font-size:15px;min-height:24px"></div>
      </div>`,

    guess: `
      <div style="background:#1a1a28;border-radius:14px;border:1px solid #2ed573;padding:18px;text-align:center;color:white">
        <h3 style="color:#2ed573;margin-top:0">🔢 خمّن الرقم</h3>
        <p style="font-size:12px;color:#aaa">خمّن الرقم من ١ إلى ١٠ — تفوز بـ ٨ أضعاف رهانك!</p>
        ${betInput()}
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:8px">
          ${Array.from({length:10}, (_,i) => `
            <button onclick="playGuess(${i+1})"
              style="width:44px;height:44px;background:#2a2a4f;color:white;
                border:1px solid #2ed573;border-radius:8px;font-size:15px;font-weight:bold;cursor:pointer"
              onmousedown="this.style.background='#2ed573';this.style.color='black'"
              onmouseup="this.style.background='#2a2a4f';this.style.color='white'">
              ${i+1}
            </button>`).join('')}
        </div>
        <div id="game-result" style="margin-top:10px;font-weight:bold;font-size:15px;min-height:24px"></div>
      </div>`,

    redblack: `
      <div style="background:#1a1a28;border-radius:14px;border:1px solid #ff4757;padding:18px;text-align:center;color:white">
        <h3 style="color:#ff4757;margin-top:0">🃏 أحمر أو أسود</h3>
        <p style="font-size:12px;color:#aaa">سحبنا ورقة عشوائية — ما لونها؟ تفوز بضعف رهانك</p>
        ${betInput()}
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="playRedBlack('red')"   style="flex:1;max-width:110px;padding:10px;background:#ff4757;color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">❤️ أحمر</button>
          <button onclick="playRedBlack('black')" style="flex:1;max-width:110px;padding:10px;background:#333;color:white;border:2px solid #666;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">🖤 أسود</button>
        </div>
        <div id="game-result" style="margin-top:14px;font-weight:bold;font-size:15px;min-height:24px"></div>
      </div>`
  };

  area.innerHTML = games[id] || '';
  area.scrollIntoView({ behavior: 'smooth' });
}

function showFriendlyGame(id) {
  playGame(id);
  setTimeout(() => {
    const area = document.getElementById('game-area');
    if (area) area.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

function showFriendlyGamePopup(gameId) {
  const game = GAMES_LIST.find(g => g.id === gameId);
  if (!game) { showSection('games'); return; }
  if (game.external) {
    if (gameId === 'warzone') {
      window.location.href = `games/warzone-game.html`;
      return;
    }
    if (gameId === 'silent') {
      window.location.href = `games/silent-showdown.html`;
      return;
    }
    window.location.href = `games/million-game.html?name=${encodeURIComponent(currentUsername)}&avatar=${encodeURIComponent(savedAvatarColor || '😎')}`;
    return;
  }
  showSection('games');
  if (typeof renderGames === 'function') renderGames();
  setTimeout(() => playGame(gameId), 300);
}

function showTournamentsPopup(gameId) {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';
  content.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:40px;margin-bottom:8px">🏆</div>
      <h3 style="margin:0 0 8px;color:#fbbf24">البطولات</h3>
      <p style="font-size:12px;color:#888;margin-bottom:16px">البطولات الرسمية قريباً!</p>
      <div style="background:rgba(200,169,64,0.08);border:1px solid rgba(200,169,64,0.3);
        border-radius:12px;padding:14px;margin-bottom:10px;text-align:right">
        <div style="font-size:13px;font-weight:800;color:#fbbf24">🥇 بطولة التاج الذهبي</div>
        <div style="font-size:11px;color:#888;margin-top:3px">الاثنين 08:30 مساء</div>
        <div style="font-size:12px;color:#2ed573;margin-top:6px;font-weight:700">الجائزة: 10,000 🪙</div>
      </div>
      <button onclick="showSection('games');renderGames();document.getElementById('profile-modal').style.display='none'"
        style="width:100%;padding:10px;background:linear-gradient(135deg,#c8a940,#f0c040);
          color:#1a0800;border:none;border-radius:10px;font-weight:900;font-size:13px;
          cursor:pointer;font-family:inherit">
        اذهب للألعاب ↗
      </button>
    </div>`;
}

// ===== منطق الألعاب =====
function getBet() {
  const b = parseInt(document.getElementById('bet-amount')?.value);
  const r = document.getElementById('game-result');
  if (isNaN(b) || b <= 0 || b > currentCoins) {
    if (r) r.innerHTML = '<span style="color:#ff4757">رهان غير صحيح!</span>';
    return null;
  }
  return b;
}

function applyGameResult(bet, isWin, multiplier = 2, xpWin = 15, xpLose = 5, isFlip = false, gameId = 'unknown') {
  const user = auth.currentUser;
  if (!user) return;

  db.ref('users/' + user.uid).transaction(u => {
    if (!u || u.coins < bet) return u;
    u.coins = isWin ? u.coins + Math.floor(bet * (multiplier - 1)) : u.coins - bet;
    u.xp    = (u.xp || 0) + (isWin ? xpWin : xpLose);
    if (u.xp >= xpForLevel(u.level || 1)) u = checkLevelUp(u);

    // تحديث إحصائيات الألعاب
    if (!u.gameStats) u.gameStats = {};
    if (!u.gameStats[gameId]) u.gameStats[gameId] = { wins: 0, losses: 0, totalBet: 0, totalWon: 0 };
    if (isWin) {
      u.gameStats[gameId].wins      = (u.gameStats[gameId].wins || 0) + 1;
      u.gameStats[gameId].totalWon  = (u.gameStats[gameId].totalWon || 0) + Math.floor(bet * (multiplier - 1));
    } else {
      u.gameStats[gameId].losses    = (u.gameStats[gameId].losses || 0) + 1;
    }
    u.gameStats[gameId].totalBet = (u.gameStats[gameId].totalBet || 0) + bet;

    if (isFlip) {
      if (!u.quests) u.quests = {};
      if (!u.quests.flipClaimed) u.quests.flipProgress = (u.quests.flipProgress || 0) + 1;
    }
    return u;
  });

  // حفظ سجل المباريات الأخيرة (آخر 20 فقط)
  db.ref('game_history/' + user.uid).push({
    game: gameId, bet, isWin,
    profit: isWin ? Math.floor(bet * (multiplier - 1)) : -bet,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
}

function playCoinFlip(choice) {
  const bet = getBet(); if (bet === null) return;
  const r = document.getElementById('game-result');
  r.innerHTML = '<span style="color:#ffd700">جاري القلب... 🪙</span>';
  setTimeout(() => {
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin   = choice === outcome;
    const name    = outcome === 'heads' ? 'طُرّة 🪙' : 'نقش 🪙';
    applyGameResult(bet, isWin, 2, 15, 5, true, 'coinflip');
    r.innerHTML = isWin
      ? `<span style="color:#2ed573">🎉 ظهرت ${name}! ربحت +${bet} 🪙</span>`
      : `<span style="color:#ff4757">❌ ظهرت ${name}. خسرت ${bet} 🪙</span>`;
  }, 800);
}

function playDice(choice) {
  const bet = getBet(); if (bet === null) return;
  const r = document.getElementById('game-result');
  r.innerHTML = '<span style="color:#ff6584">جاري الرمي... 🎲</span>';
  setTimeout(() => {
    const dice  = Math.ceil(Math.random() * 6);
    const high  = dice >= 4;
    const isWin = (choice === 'high' && high) || (choice === 'low' && !high);
    applyGameResult(bet, isWin, 2, 15, 5, false, 'dice');
    r.innerHTML = isWin
      ? `<span style="color:#2ed573">🎉 ظهر ${dice} — ربحت +${bet} 🪙</span>`
      : `<span style="color:#ff4757">❌ ظهر ${dice} — خسرت ${bet} 🪙</span>`;
  }, 800);
}

function playGuess(pick) {
  const bet = getBet(); if (bet === null) return;
  const r = document.getElementById('game-result');
  r.innerHTML = '<span style="color:#2ed573">جاري الكشف... 🔢</span>';
  setTimeout(() => {
    const num   = Math.ceil(Math.random() * 10);
    const isWin = pick === num;
    applyGameResult(bet, isWin, isWin ? 8 : 1, 30, 5, false, 'guess');
    r.innerHTML = isWin
      ? `<span style="color:#2ed573">🎉🎉 الرقم كان ${num}! ربحت ${bet * 7} 🪙!</span>`
      : `<span style="color:#ff4757">الرقم كان ${num} — اخترت ${pick}. خسرت ${bet} 🪙</span>`;
  }, 900);
}

function playRedBlack(choice) {
  const bet = getBet(); if (bet === null) return;
  const r = document.getElementById('game-result');
  r.innerHTML = '<span style="color:#ff4757">جاري السحب... 🃏</span>';
  setTimeout(() => {
    const reds  = ['♥','♦'];
    const suits = ['♥','♦','♣','♠'];
    const suit  = suits[Math.floor(Math.random() * 4)];
    const isRed = reds.includes(suit);
    const isWin = (choice === 'red' && isRed) || (choice === 'black' && !isRed);
    applyGameResult(bet, isWin, 2, 15, 5, false, 'redblack');
    r.innerHTML = isWin
      ? `<span style="color:#2ed573">🎉 ظهرت ${suit} — ربحت +${bet} 🪙</span>`
      : `<span style="color:#ff4757">ظهرت ${suit} — خسرت ${bet} 🪙</span>`;
  }, 800);
}