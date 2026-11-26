// ============================================================
//  js/games.js — bee platform
//  قائمة الألعاب + منطق كل لعبة
//  (نُظّف الملف: ما تبقى إلا لعبة مليون — الباقي محذوف بطلب المطوّر)
// ============================================================

const GAMES_LIST = [
  { id: 'million', name: 'مليون', icon: '🃏', desc: 'لعبة الورق متعدد اللاعبين', external: true },
  { id: 'tonj',    name: 'طنج',   icon: '♠️', desc: 'لعبة ورق ثنائية للاثنين بس',   external: true },
  { id: 'minute',  name: 'تحدّي الدقيقة', icon: '🎙️', desc: 'تحدّي صوتي واحد ضد واحد', external: true },
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

      <div onclick="openGame('tonj')"
        style="background:linear-gradient(135deg,rgba(5,20,16,0.9),rgba(5,30,22,0.9));
          border:1px solid rgba(64,200,169,0.35);border-radius:20px;overflow:hidden;
          cursor:pointer;position:relative;height:180px;margin-bottom:12px;
          box-shadow:0 8px 30px rgba(0,0,0,0.5)"
        onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform=''">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          display:flex;justify-content:center;align-items:center;font-size:80px;opacity:0.25">♠️</div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 18px;
          background:linear-gradient(to top,rgba(0,0,0,0.9),transparent)">
          <div style="font-size:20px;font-weight:900;color:#40c8a9;margin-bottom:4px">♠️ طنج</div>
          <div style="font-size:12px;color:#60b0a0">لعبة ورق ثنائية — أنت وخصم واحد بس</div>
          <div style="margin-top:10px;display:inline-block;
            background:linear-gradient(135deg,#2a9d7f,#40c8a9);color:#04140f;
            padding:6px 20px;border-radius:10px;font-size:12px;font-weight:900">العب الآن ←</div>
        </div>
      </div>

      <div onclick="openGame('minute')"
        style="background:linear-gradient(135deg,rgba(24,10,5,0.9),rgba(34,14,6,0.9));
          border:1px solid rgba(255,122,102,0.35);border-radius:20px;overflow:hidden;
          cursor:pointer;position:relative;height:180px;margin-bottom:12px;
          box-shadow:0 8px 30px rgba(0,0,0,0.5)"
        onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform=''">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          display:flex;justify-content:center;align-items:center;font-size:80px;opacity:0.25">🎙️</div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 18px;
          background:linear-gradient(to top,rgba(0,0,0,0.9),transparent)">
          <div style="font-size:20px;font-weight:900;color:#ff9a76;margin-bottom:4px">🎙️ تحدّي الدقيقة</div>
          <div style="font-size:12px;color:#c08070">دقيقة لكل لاعب — جاوب بصوتك وسابق خصمك</div>
          <div style="margin-top:10px;display:inline-block;
            background:linear-gradient(135deg,#e5603f,#ff9a76);color:#1a0800;
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

// ===== الانتقال الفعلي للعبة الصحيحة (يمرّر الاسم + الصورة الحقيقية لو موجودة) =====
const GAME_FILES = {
  million: 'games/million-game.html',
  tonj:    'games/tonj-game.html',
  minute:  'games/minute-game.html',
};

function showFriendlyGamePopup(gameId) {
  const game = GAMES_LIST.find(g => g.id === gameId);
  const gameFile = GAME_FILES[gameId];
  if (!game || !gameFile) { showSection('games'); return; }

  const fallbackAvatar = savedAvatarColor || '😎';
  const goToGame = (avatarParam) => {
    window.location.href = `${gameFile}?name=${encodeURIComponent(currentUsername)}&avatar=${encodeURIComponent(avatarParam)}`;
  };
  const user = auth.currentUser;
  if (user) {
    db.ref('users/' + user.uid + '/photoURL').once('value', snap => {
      goToGame(snap.val() || fallbackAvatar);
    }).catch(() => goToGame(fallbackAvatar));
  } else {
    goToGame(fallbackAvatar);
  }
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

// ============================================================
//  applyGameResult — دالة عامة لمنح كوينز + خبرة + تحديث الإحصائيات
//  بعد نتيجة أي لعبة. باقية هنا جاهزة لربط لعبة مليون بنظام
//  الخبرة/اللفل بالتطبيق الرئيسي (الخطوة الجاية).
// ============================================================
function applyGameResult(bet, isWin, multiplier = 2, xpWin = 15, xpLose = 5, isFlip = false, gameId = 'unknown') {
  const user = auth.currentUser;
  if (!user) return;

  db.ref('users/' + user.uid).transaction(u => {
    if (!u || u.coins < bet) return u;
    u.coins = isWin ? u.coins + Math.floor(bet * (multiplier - 1)) : u.coins - bet;
    addCappedXP(u, isWin ? xpWin : xpLose);
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

  // حفظ سجل المباريات الأخيرة
  db.ref('game_history/' + user.uid).push({
    game: gameId, bet, isWin,
    profit: isWin ? Math.floor(bet * (multiplier - 1)) : -bet,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });

  // أصوات + اهتزاز النتيجة
  if (isWin) { Sounds.play('win');  Haptic.success(); }
  else        { Sounds.play('lose'); Haptic.error();   }
}
