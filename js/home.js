// ============================================================
//  js/home.js — قسم الشاشة الرئيسية لمنصة bee
// ============================================================

function renderHome() {
  const sec = document.getElementById('home');
  if (!sec) return;
  
  const userName = typeof currentUsername !== 'undefined' ? currentUsername : "زائر";
  const userLevel = typeof currentLevel !== 'undefined' ? currentLevel : 1;
  const userCoins = typeof currentCoins !== 'undefined' ? currentCoins : 0;
  const userColor = typeof getAvatarColor === 'function' ? getAvatarColor(userName) : '#fbbf24';

  const game = typeof activeGame !== 'undefined' && activeGame && typeof GAMES_LIST !== 'undefined' 
               ? GAMES_LIST.find(g => g.id === activeGame) 
               : null;

  // تجهيز روابط نصوص الأونكليك مسبقاً لمنع تداخل علامات الاقتباس والباكتيكس
  let playOnclick = "";
  if (game) {
    // كل الألعاب (حتى الخارجية زي مليون) تمر بنفس الدالة — هي اللي تتحقق من
    // وجود صورة حقيقية مرفوعة وتمررها، بدل بناء رابط مباشر يتجاوزها
    playOnclick = "typeof showFriendlyGamePopup === 'function' ? showFriendlyGamePopup('" + game.id + "') : null";
  } else {
    playOnclick = "typeof showSection === 'function' ? (showSection('games'), renderGames()) : null";
  }

  let tournamentsOnclick = game 
    ? "typeof showTournamentsPopup === 'function' ? showTournamentsPopup('" + game.id + "') : null"
    : "typeof showSection === 'function' ? (showSection('games'), renderGames()) : null";

  let friendlyOnclick = game
    ? "typeof showFriendlyGamePopup === 'function' ? showFriendlyGamePopup('" + game.id + "') : null"
    : "typeof showSection === 'function' ? (showSection('games'), renderGames()) : null";

  // حساب النسبة المئوية للـ XP
  let xpPercent = 0;
  if (typeof currentXP !== 'undefined' && typeof xpForLevel === 'function') {
    xpPercent = Math.min(100, Math.round((currentXP / xpForLevel(userLevel)) * 100));
  }
  let xpTotal = typeof xpForLevel === 'function' ? xpForLevel(userLevel) : 100;
  let currentXPVal = typeof currentXP !== 'undefined' ? currentXP : 0;

  let vipBadge = (typeof isVIP !== 'undefined' && isVIP) 
    ? '<span style="background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0e00;font-size:9px;padding:1px 6px;border-radius:8px;font-weight:900;margin-right:4px">VIP ★</span>' 
    : '';

  let userUid = "";
  if (typeof auth !== 'undefined' && auth.currentUser) {
    userUid = auth.currentUser.uid;
  }

  sec.innerHTML = `
    <style>
      @keyframes pulse-green {
        0% { box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.5); }
        70% { box-shadow: 0 0 0 25px rgba(46, 213, 115, 0); }
        100% { box-shadow: 0 0 0 0 rgba(46, 213, 115, 0); }
      }
      .play-btn-glow {
        animation: pulse-green 2.5s infinite cubic-bezier(0.66, 0, 0, 1);
      }
      .side-btn {
        background: linear-gradient(180deg, #1e1e2f, #11111e);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 20px;
        color: #94a3b8;
        font-family: 'Cairo', sans-serif;
        font-weight: 800;
        font-size: 13px;
        cursor: pointer;
        width: 85px;
        height: 105px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.4);
        transition: transform 0.1s ease, border-color 0.2s;
      }
      .side-btn:active { transform: scale(0.95); }
      .side-btn i { font-size: 26px; font-style: normal; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
      .side-btn:hover { border-color: rgba(255, 255, 255, 0.2); color: white; }
    </style>

    <div style="padding: 10px 5px 25px; display: flex; flex-direction: column; gap: 20px; font-family:'Cairo', sans-serif;">
      
      <div class="card-premium" style="background:rgba(14,11,4,0.82);border:1px solid rgba(200,169,64,0.22);border-radius:20px;padding:13px 14px;box-shadow:0 4px 20px rgba(0,0,0,0.4)">
        <div style="display:flex;align-items:center;gap:12px;direction:ltr">

          <div id="home-avatar-wrap" onclick="if(auth.currentUser && typeof viewProfile==='function') viewProfile(auth.currentUser.uid); else if(typeof showProfilePopup==='function') showProfilePopup()" style="cursor:pointer;flex-shrink:0;position:relative">
            <div id="home-avatar" style="width:54px;height:54px;border-radius:50%;background:${userColor};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:white;border:2px solid rgba(200,169,64,0.5);box-shadow:0 0 14px rgba(200,169,64,0.25);overflow:hidden">
              ${userName.charAt(0).toUpperCase()}
            </div>
            <div style="position:absolute;bottom:0;right:0;background:#c8a940;border-radius:50%;width:17px;height:17px;display:flex;align-items:center;justify-content:center;font-size:9px;border:2px solid #0c0a05">✏️</div>
          </div>

          <div style="flex:1;min-width:0;direction:rtl">
            <div style="font-size:15px;font-weight:900;color:#f0e8d0;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${userName} ${vipBadge}
            </div>
            <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:5px;overflow:hidden;margin-bottom:4px">
              <div style="height:100%;width:${xpPercent}%;background:linear-gradient(90deg,#c8a940,#f0c040);border-radius:10px;box-shadow:0 0 6px rgba(200,169,64,0.5);transition:width .6s"></div>
            </div>
            <div style="font-size:10px;color:#c8a940;font-weight:700">⭐ المستوى ${userLevel} · ${currentXPVal}/${xpTotal} XP</div>
          </div>

          <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <div onclick="if(typeof showSection==='function') showSection('store')" style="background:rgba(200,169,64,0.12);border:1px solid rgba(200,169,64,0.3);padding:6px 12px;border-radius:12px;cursor:pointer;display:flex;align-items:center;gap:5px">
              <span style="font-size:14px;font-weight:900;color:#f0c040" class="shimmer-gold">${userCoins.toLocaleString('ar')}</span>
              <span style="font-size:14px">🪙</span>
            </div>
            <div id="home-streak-badge" style="font-size:11px;color:#f0c040;font-weight:700;text-align:right">🔥 ...</div>
          </div>

        </div>
      </div>

      <div style="margin-top:10px">
        <button onclick="typeof showFriendsPanel === 'function' ? showFriendsPanel() : null" style="width:100%;padding:11px;background:rgba(14,11,4,0.7);border:1px solid rgba(200,169,64,0.18);border-radius:14px;color:#b09060;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:space-between">
          <span>👥 الأصدقاء</span>
          <span id="friends-count-badge" style="background:rgba(200,169,64,0.15);color:#f0c040;font-size:11px;padding:2px 8px;border-radius:10px">...</span>
        </button>
      </div>

      <div style="position:relative; margin: 15px 0; display:flex; align-items:center; justify-content:center; gap:18px;">
        <div class="side-btn" onclick="${tournamentsOnclick}">
          <i>📋</i>
          <span style="text-align:center; line-height:1.4;">قائمة<br>الجلسات</span>
        </div>

        <div onclick="${playOnclick}" class="play-btn-glow glow-pulse" style="width:155px; height:155px; border-radius:50%; background:radial-gradient(circle at 30% 30%, #4ade80, #16a34a 60%, #14532d); border:4px solid #064e3b; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; position:relative; z-index:5;">
          <div style="font-size:42px; margin-bottom:2px; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.4));">🎲</div>
          <div style="font-size:22px; font-weight:900; color:white; text-shadow:0 3px 6px rgba(0,0,0,0.6);">لعب الآن</div>
          <div style="font-size:12px; color:#d1fae5; margin-top:4px; font-weight:bold; background:rgba(0,0,0,0.2); padding:2px 8px; border-radius:10px;">
            ${game ? game.name : 'اختر لعبة 🕹️'}
          </div>
        </div>

        <div class="side-btn" onclick="${friendlyOnclick}">
          <i>🤝</i>
          <span style="text-align:center; line-height:1.4;">لعبة<br>ودية</span>
        </div>
      </div>

      <div style="margin-top:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 8px;">
          <div style="font-size:15px; font-weight:900; color:#fff; text-shadow:0 1px 3px rgba(0,0,0,0.5);">🏆 بطولات وجلسات نشطة</div>
          <div style="font-size:11px; color:#fbbf24; font-weight:bold; cursor:pointer;">عرض الكل ❯</div>
        </div>
        <div id="tourn-hex-container" style="display:flex; gap:12px; overflow-x:auto; padding-bottom:15px; scrollbar-width:none;">
          <div style="color:rgba(255,255,255,0.3); font-size:12px; padding:20px; text-align:center; width:100%;">⏳ جاري تحميل البطولات...</div>
        </div>
      </div>

      <div id="home-challenge-banner" onclick="typeof showChallengeDetails === 'function' ? showChallengeDetails() : null" style="background:linear-gradient(135deg, #1e293b, #0f172a); border:1px solid rgba(251,191,36,0.4); border-radius:20px; padding:18px 22px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; box-shadow:0 8px 25px rgba(0,0,0,0.4); position:relative; overflow:hidden;">
        <div style="position:absolute; top:-20px; right:-20px; width:80px; height:80px; background:radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%);"></div>
        <div style="position:relative; z-index:2;">
          <div style="font-size:17px; font-weight:900; color:#fbbf24; margin-bottom:6px; text-shadow:0 2px 5px rgba(0,0,0,0.5);" id="challenge-title">🎯 تحديات اليوم</div>
          <div style="font-size:12px; color:#cbd5e1;" id="challenge-sub">أكمل المهام واربح كوينز مجانية 🪙</div>
        </div>
        <div style="font-size:38px; filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4)); position:relative; z-index:2;">🎁</div>
      </div>

    </div>
  `;

  if (typeof listenToPrivateMessages === 'function') listenToPrivateMessages();
  if (typeof onHomeOpen === 'function') onHomeOpen();
  if (typeof loadHomeDynamic === 'function') loadHomeDynamic();
  if (typeof loadTournamentCards === 'function') loadTournamentCards();
  // تأثير دخول بطاقات الصفحة الرئيسية
  setTimeout(() => { if (typeof Effects !== 'undefined') Effects.animateCards(sec, 80); }, 50);

  if (typeof auth !== 'undefined' && auth.currentUser) {
    db.ref('users/' + auth.currentUser.uid).once('value', snap => {
      const u = snap.val() || {};
      if (u.photoURL) {
        const av = document.getElementById('home-avatar');
        if (av) {
          av.innerHTML = '';
          av.style.background = 'transparent';
          const img = document.createElement('img');
          img.src = u.photoURL;
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
          img.onerror = () => { av.textContent = userName.charAt(0).toUpperCase(); av.style.background = userColor; };
          av.appendChild(img);
        }
      }
      const streak = u.dailyStreak || 0;
      const badge = document.getElementById('home-streak-badge');
      if (badge) {
        badge.textContent = streak > 0 ? `🔥 ${streak} يوم` : '🔥 ابدأ سلسلتك';
      }
    });
  }
}

function loadHomeDynamic() {
  if (typeof db === 'undefined') return;
  db.ref('settings/banner').once('value', snap => {
    const b = snap.val();
    if (!b) return;
    const t = document.getElementById('banner-title');
    const s = document.getElementById('banner-sub');
    const i = document.getElementById('banner-icon');
    if (t && b.title) t.textContent = b.title;
    if (s && b.sub) s.textContent = b.sub;
    if (i && b.icon) i.textContent = b.icon;
  });

  db.ref('settings/challenge').once('value', snap => {
    const c = snap.val();
    const ct = document.getElementById('challenge-title');
    const cs = document.getElementById('challenge-sub');
    if (c && ct) {
      ct.textContent = c.title || '🏆 تحدي الأسبوع';
      if (cs) cs.textContent = c.sub || '';
    }
  });
}

function loadTournamentCards() {
  const container = document.getElementById('tourn-hex-container');
  if (!container || typeof db === 'undefined') return;
  const colors = ['#1e3a8a','#92400e','#7f1d1d','#4c1d95','#065f46','#7c2d12'];
  
  db.ref('tournaments').orderByChild('active').equalTo(true).limitToFirst(6).once('value', snap => {
    const tournaments = [];
    snap.forEach(child => tournaments.push({id: child.key, ...child.val()}));
    
    if (!tournaments.length) {
      container.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;padding:20px">لا توجد مسابقات نشطة</div>';
      return;
    }
    
    container.innerHTML = tournaments.map((t, i) => `
      <div onclick="typeof joinTournament === 'function' ? joinTournament('${t.id}') : null"
        style="flex-shrink:0;width:108px;cursor:pointer;position:relative;height:124px">
        <svg viewBox="0 0 108 124" style="position:absolute;top:0;left:0;width:100%;height:100%">
          <path d="M54 3 L105 29 L105 95 L54 121 L3 95 L3 29Z"
            fill="${colors[i % colors.length]}" stroke="rgba(200,169,64,0.4)" stroke-width="2"/>
        </svg>
        <div style="position:relative;z-index:1;padding:16px 8px 10px;text-align:center">
          <div style="font-size:22px;margin-bottom:3px">🃏</div>
          <div style="font-size:9px;font-weight:800;color:white;line-height:1.3">${(t.name||'مسابقة').substring(0,14)}</div>
          <div style="font-size:9px;color:#fbbf24;margin-top:3px;font-weight:700">🪙 ${(t.prize||0).toLocaleString('ar')}</div>
          <div style="width:16px;height:16px;border-radius:50%;background:rgba(200,169,64,0.2);
            border:1px solid rgba(200,169,64,0.4);margin:4px auto 0;
            display:flex;align-items:center;justify-content:center;font-size:9px">🪙</div>
        </div>
      </div>`).join('');
  });
}

function showChallengeDetails() {
  if (typeof db === 'undefined') return;
  db.ref('settings/challenge').once('value', snap => {
    const c = snap.val() || {title:'تحدي الأسبوع', desc:'العب 3 جولات وفوز بمكافأة خاصة', prize:'500'};
    if (typeof showToast === 'function') showToast('🏆 ' + (c.title||'تحدي الأسبوع'));
    Toast.show('🏆 ' + (c.title||'تحدي الأسبوع'), 'gold');
  });
}