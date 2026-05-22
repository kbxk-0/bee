// ============================================================
//  js/app.js — bee platform
// ============================================================

// ===== أداة: لون ثابت لكل مستخدم بناءً على اسمه =====
let savedAvatarColor = ''; // يُحدَّث من auth.js عند التحميل
let activeGame = localStorage.getItem('activeGame') || null;

function getAvatarColor(name) {
  // لو اللاعب الحالي وعنده لون محفوظ، استخدمه
  if (name === currentUsername && savedAvatarColor) return savedAvatarColor;
  const cols = ['#6c63ff','#ff6584','#2ed573','#ffd700','#00d2d3','#ff4757','#a78bfa','#ff9f43','#1dd1a1','#54a0ff'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return cols[Math.abs(h) % cols.length];
}

function avatarHTML(name, size = 36) {
  const col = getAvatarColor(name);
  const letter = (name || '؟').charAt(0).toUpperCase();
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.42)}px;font-weight:bold;color:white;flex-shrink:0">${letter}</div>`;
}

// ===== الرئيسية =====
function renderHome() {
  const sec = document.getElementById('home');
  if (!sec) return;

  const xpCurrent = typeof currentXP !== 'undefined' ? currentXP : 0;
  const xpNeeded  = currentLevel * 100;
  const xpPct     = Math.min(100, Math.round(xpCurrent / xpNeeded * 100));

  const user = auth.currentUser;
  if (!user) return;

  // جلب بيانات السلسلة والمكافآت المتوقعة للعرض مباشرة بدلاً من "جاري التحميل"
  const currentStreak = typeof currentDailyStreak !== 'undefined' ? currentDailyStreak : 0;
  const rewards = [50, 75, 100, 125, 150, 175, 200, 250, 300, 500];
  const nextReward = rewards[Math.min(currentStreak, rewards.length - 1)];

  const questChatBtn = claimedChatQuest
    ? '<span style="color:#2ed573;font-size:11px">✓ تم</span>'
    : `<button onclick="claimQuest('chat')" ${questChat >= 5 ? '' : 'disabled'} style="background:#ffd700;color:black;border:none;border-radius:4px;font-size:10px;padding:3px 8px;cursor:pointer;font-weight:bold">+20🪙</button>`;
  const questFlipBtn = claimedFlipQuest
    ? '<span style="color:#2ed573;font-size:11px">✓ تم</span>'
    : `<button onclick="claimQuest('flip')" ${questFlip >= 3 ? '' : 'disabled'} style="background:#ffd700;color:black;border:none;border-radius:4px;font-size:10px;padding:3px 8px;cursor:pointer;font-weight:bold">+30🪙</button>`;

  sec.innerHTML = `

    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:20px;font-weight:900;background:linear-gradient(135deg,#a855f7,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px">BEE 🐝</div>
      <div style="background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(251,191,36,0.05));border:1px solid rgba(251,191,36,0.3);color:#fbbf24;font-size:13px;padding:5px 14px;border-radius:20px;font-weight:800">
        🪙 ${currentCoins.toLocaleString('ar')}
      </div>
    </div>

    <!-- بطاقة الملف الشخصي -->
    <div style="background:linear-gradient(135deg,#1a1a38,#20204a);border:1px solid rgba(168,85,247,0.25);border-radius:20px;padding:16px;margin-bottom:14px;position:relative;overflow:hidden">
      <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:radial-gradient(circle,rgba(124,58,237,0.25),transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(251,191,36,0.1),transparent 70%);pointer-events:none"></div>

      <div style="display:flex;align-items:center;gap:14px;position:relative">
        <div onclick="showEditProfile()" style="cursor:pointer;position:relative;flex-shrink:0">
          <div style="width:62px;height:62px;border-radius:50%;background:${getAvatarColor(currentUsername)};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:white;border:2px solid rgba(168,85,247,0.6);box-shadow:0 0 20px rgba(124,58,237,0.4)">
            ${currentUsername.charAt(0).toUpperCase()}
          </div>
          <div style="position:absolute;bottom:0;right:0;background:#7c3aed;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;border:2px solid #08081a;box-shadow:0 0 8px rgba(124,58,237,0.5)">✏️</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px">
            <span style="font-size:17px;font-weight:900">${escapeHTML(currentUsername)}</span>
            ${isVIP ? '<span style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0a00;font-size:9px;padding:2px 8px;border-radius:10px;font-weight:900">★ VIP</span>' : ''}
            ${isAdmin ? '<span style="background:linear-gradient(135deg,#dc2626,#ef4444);color:white;font-size:9px;padding:2px 8px;border-radius:10px;font-weight:900">Admin</span>' : ''}
          </div>
          ${currentTitle ? `<div style="font-size:12px;color:${currentTitleColor||'#a855f7'};font-weight:700;margin-bottom:3px">‹${escapeHTML(currentTitle)}›</div>` : ''}
          <div style="font-size:11px;color:#9999cc;display:flex;align-items:center;gap:6px">
            <span>⭐ Lv.${currentLevel}</span>
            ${currentClan ? `<span style="color:#555577">·</span><span style="color:#10b981">[${escapeHTML(currentClan)}]</span>` : ''}
          </div>
        </div>
      </div>

      <!-- XP Bar -->
      <div style="margin-top:14px;position:relative">
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#555577;margin-bottom:5px">
          <span>XP</span><span>${xpCurrent} / ${xpNeeded}</span>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:7px;overflow:hidden">
          <div style="height:100%;width:${xpPct}%;background:linear-gradient(90deg,#7c3aed,#a855f7,#fbbf24);border-radius:10px;box-shadow:0 0 10px rgba(124,58,237,0.6);transition:width .6s ease"></div>
        </div>
      </div>

      <!-- أزرار سريعة -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
        <button onclick="claimDaily()" style="padding:11px;background:linear-gradient(135deg,#059669,#10b981);color:white;border:none;border-radius:12px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(16,185,129,0.3)">🎁 مكافأة يومية</button>
        <button onclick="showSection('inventory');renderInventory()" style="padding:11px;background:linear-gradient(135deg,#4c1d95,#6d28d9);color:white;border:1px solid rgba(168,85,247,0.3);border-radius:12px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(124,58,237,0.2)">🎒 حقيبتي</button>
      </div>
    </div>

    <!-- المهام اليومية -->
    <div style="background:linear-gradient(135deg,#16163a,#1e1e44);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:16px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:900;color:#fbbf24;margin-bottom:14px">🎯 المهام اليومية</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="flex:1">
          <div style="font-size:12px;font-weight:700;margin-bottom:6px">💬 رسائل الشات <span style="color:#555577;font-weight:400;font-size:10px">${questChat}/5</span></div>
          <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:6px;overflow:hidden;width:85%">
            <div style="height:100%;width:${Math.min(100,questChat/5*100)}%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:10px;box-shadow:0 0 8px rgba(124,58,237,0.4)"></div>
          </div>
        </div>
        ${claimedChatQuest
          ? '<span style="color:#10b981;font-size:13px;font-weight:800">✓</span>'
          : `<button onclick="claimQuest('chat')" ${questChat>=5?'':'disabled'} style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0a00;border:none;border-radius:8px;font-size:11px;padding:6px 12px;cursor:pointer;font-weight:900;font-family:inherit;${questChat>=5?'box-shadow:0 4px 12px rgba(251,191,36,0.3)':'opacity:0.35'}">+20🪙</button>`}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="flex:1">
          <div style="font-size:12px;font-weight:700;margin-bottom:6px">🎲 قلب العملة <span style="color:#555577;font-weight:400;font-size:10px">${questFlip}/3</span></div>
          <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:6px;overflow:hidden;width:85%">
            <div style="height:100%;width:${Math.min(100,questFlip/3*100)}%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:10px;box-shadow:0 0 8px rgba(251,191,36,0.4)"></div>
          </div>
        </div>
        ${claimedFlipQuest
          ? '<span style="color:#10b981;font-size:13px;font-weight:800">✓</span>'
          : `<button onclick="claimQuest('flip')" ${questFlip>=3?'':'disabled'} style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0a00;border:none;border-radius:8px;font-size:11px;padding:6px 12px;cursor:pointer;font-weight:900;font-family:inherit;${questFlip>=3?'box-shadow:0 4px 12px rgba(251,191,36,0.3)':'opacity:0.35'}">+30🪙</button>`}
      </div>
    </div>

    <!-- السلسلة اليومية -->
    <div style="background:linear-gradient(135deg,#1c1500,#251d00);border:1px solid rgba(251,191,36,0.2);border-radius:18px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:13px;font-weight:900;color:#fbbf24;margin-bottom:4px">🔥 السلسلة اليومية</div>
          <div id="streak-info" style="font-size:11px;color:#9999cc">${currentStreak > 0 ? `${currentStreak} يوم متتالي 🔥` : 'ابدأ سلسلتك اليوم!'}</div>
        </div>
        <div style="text-align:left">
          <div style="font-size:10px;color:#555577;margin-bottom:2px">مكافأة الغد</div>
          <div style="font-size:15px;font-weight:900;color:#fbbf24">🪙 ${nextReward}</div>
        </div>
      </div>
    </div>

    <!-- الرسائل الخاصة -->
    <div style="background:linear-gradient(135deg,#001a14,#001f18);border:1px solid rgba(16,185,129,0.2);border-radius:18px;margin-bottom:12px;overflow:hidden">
      <div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;font-weight:900;color:#10b981">🔒 الرسائل الخاصة</span>
        <button onclick="togglePMForm()" style="background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.25);border-radius:10px;padding:5px 12px;font-size:11px;cursor:pointer;font-weight:800;font-family:inherit">إرسال +</button>
      </div>
      <div id="private-messages-box" style="max-height:140px;overflow-y:auto;padding:0 8px 8px"></div>
      <div id="pm-send-form" style="display:none;padding:10px;border-top:1px solid rgba(16,185,129,0.1)">
        <input type="text" id="pm-target" placeholder="اسم المستلم..." class="input-field" style="margin-bottom:7px;font-size:12px">
        <div style="display:flex;gap:6px">
          <input type="text" id="pm-input" placeholder="الرسالة..." class="input-field" style="flex:1;font-size:12px" onkeydown="if(event.key==='Enter') sendPrivateMessage()">
          <button onclick="sendPrivateMessage()" style="padding:0 14px;background:#10b981;color:white;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:16px">➤</button>
        </div>
      </div>
    </div>

    <!-- تحويل كوينز -->
    <div style="background:linear-gradient(135deg,#16163a,#1e1e44);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:16px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:900;color:#a855f7;margin-bottom:12px">💸 تحويل كوينز</div>
      <input type="text"   id="tr-user"   placeholder="اسم المستخدم..." class="input-field" style="margin-bottom:8px">
      <input type="number" id="tr-amount" placeholder="الكمية..." class="input-field" style="margin-bottom:10px">
      <button onclick="transferCoins()" style="width:100%;padding:11px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;border:none;border-radius:12px;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(124,58,237,0.35)">إرسال الآن</button>
    </div>

    ${isAdmin ? `<button onclick="showSection('admin-panel')" style="width:100%;padding:13px;background:linear-gradient(135deg,#dc2626,#ef4444);color:white;border:none;border-radius:14px;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(239,68,68,0.35);margin-bottom:12px">⚙️ لوحة الإدارة</button>` : ''}

  `;

  // عرض اللعبة المختارة في أعلى الصفحة
  if (activeGame) {
    const game = GAMES_LIST.find(g => g.id === activeGame);
    if (game) {
      sec.insertAdjacentHTML('afterbegin', `<div id="active-game-section" style="margin-bottom:14px">${buildGameCard(game)}</div>`);
      if (!game.external) {
        setTimeout(() => playGame(activeGame), 50);
      }
    }
  }

  if (typeof listenToPrivateMessages === 'function') listenToPrivateMessages();
  if (typeof onHomeOpen === 'function') onHomeOpen();
}

// ===== بطاقة اللعبة بأسلوب جواكر =====
function buildGameCard(game) {
  const tournaments = [
    { prize: '50,000', entry: '5,000', stars: 1, active: false },
    { prize: '344,000', entry: '49,990', stars: 1, active: true },
    { prize: '350,000', entry: '99,990', stars: 1, active: false },
  ];

  const toCards = tournaments.map((t,i) => `
    <div style="background:${t.active?'linear-gradient(135deg,#1a4a1a,#1f5c1f)':'#1a1a28'};
      border:${t.active?'2px solid #2ed573':'1px solid #2a2a3f'};
      border-radius:14px;padding:14px 10px;text-align:center;min-width:110px;flex-shrink:0;
      ${t.active?'transform:scale(1.05);box-shadow:0 4px 20px rgba(46,213,115,0.3)':''}">
      <div style="font-size:1.3rem;margin-bottom:4px">🏆</div>
      <div style="font-size:13px;font-weight:900;color:${t.active?'#2ed573':'#fbbf24'}">🪙 ${t.prize}</div>
      <div style="font-size:9px;color:#888;margin-top:2px">+${t.stars},000 ⭐</div>
      <div style="font-size:9px;color:#666;margin-top:6px">رسوم الدخول</div>
      <div style="font-size:11px;font-weight:700;color:${t.active?'#2ed573':'#aaa'}">🪙 ${t.entry}</div>
    </div>`).join('');

  return `
    <div style="background:linear-gradient(135deg,#0d0d20,#141428);border:1px solid rgba(255,255,255,0.08);border-radius:22px;overflow:hidden;margin-bottom:2px">
      
      <!-- اسم اللعبة -->
      <div style="padding:20px 16px 14px;text-align:center;position:relative">

        <div style="font-size:3rem;margin-bottom:8px">${game.icon}</div>
        <div style="font-size:22px;font-weight:900;color:white;margin-bottom:4px">${game.name}</div>
        <div style="font-size:11px;color:#666">${game.desc}</div>
      </div>

      <!-- زرا المسابقات ولعبة ودية -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px 16px">
        <button onclick="showGameTournaments('${game.id}')"
          style="background:linear-gradient(135deg,#1a4a1a,#22622a);color:white;border:1px solid #2ed573;
          border-radius:14px;padding:14px;font-weight:900;font-size:14px;cursor:pointer;
          font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:0 4px 16px rgba(46,213,115,0.25)">
          🏆 المسابقات
        </button>
        <button onclick="${game.external ? 
          `window.location.href='games/million-game.html?name='+encodeURIComponent(currentUsername)+'&avatar='+encodeURIComponent(savedAvatarColor||'😎')` : 
          `showFriendlyGame('${game.id}')`}"
          style="background:linear-gradient(135deg,#1a1a2e,#252540);color:white;border:1px solid rgba(255,255,255,0.12);
          border-radius:14px;padding:14px;font-weight:900;font-size:14px;cursor:pointer;
          font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px">
          ▶ لعبة ودية
        </button>
      </div>

      <!-- بطاقات المسابقات -->
      <div id="game-tournaments-${game.id}" style="padding:0 16px 16px">
        <div style="font-size:11px;color:#555;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
          <span>المسابقات المتاحة</span>
          <div style="display:flex;gap:6px">
            <span style="font-size:14px;cursor:pointer;color:#aaa">‹</span>
            <span style="font-size:14px;cursor:pointer;color:#aaa">›</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">
          ${toCards}
        </div>
      </div>

      <!-- أزرار أسفل -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid rgba(255,255,255,0.06)">
        <button style="padding:12px 6px;background:transparent;color:#aaa;border:none;border-left:1px solid rgba(255,255,255,0.06);font-size:11px;cursor:pointer;font-family:inherit">
          📊 المتصدرون
        </button>
        <button style="padding:12px 6px;background:transparent;color:#aaa;border:none;font-size:11px;cursor:pointer;font-family:inherit">
          📋 القوانين
        </button>
        <button style="padding:12px 6px;background:transparent;color:#aaa;border:none;border-right:1px solid rgba(255,255,255,0.06);font-size:11px;cursor:pointer;font-family:inherit">
          🎮 الألعاب الجارية
        </button>
      </div>

    </div>

    <!-- منطقة اللعبة الودية -->
    <div id="game-area" style="margin-bottom:14px"></div>
  `;
}

function showFriendlyGame(id) {
  playGame(id);
  // scroll لمنطقة اللعبة
  setTimeout(() => {
    const area = document.getElementById('game-area');
    if (area) area.scrollIntoView({ behavior:'smooth', block:'center' });
  }, 200);
}

function showGameTournaments(id) {
  showSection('games');
  const lastGame = localStorage.getItem('lastGame');
}

// ===== لوحة المتصدرين =====
function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;color:#555577;padding:24px;font-size:13px">جاري التحميل...</div>';

  db.ref('users').orderByChild('coins').limitToLast(20).once('value', snap => {
    let players = [];
    snap.forEach(child => { const u = child.val(); u.uid = child.key; if (!u.isAdmin) players.push(u); });
    players.reverse();

    const medals = ['🥇','🥈','🥉'];
    const bgTop = ['rgba(251,191,36,0.08)','rgba(168,85,247,0.06)','rgba(16,185,129,0.06)'];

    list.innerHTML = players.map((p, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);background:${i < 3 ? bgTop[i] : 'transparent'}">
        <div style="font-size:${i<3?22:13}px;width:28px;text-align:center;flex-shrink:0">${medals[i] || `<span style="color:#555577">${i+1}</span>`}</div>
        <div style="width:38px;height:38px;border-radius:50%;background:${getAvatarColor(p.username||'؟')};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:white;flex-shrink:0;${i===0?'box-shadow:0 0 12px rgba(251,191,36,0.4)':''}">
          ${(p.username||'؟').charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(p.username||'لاعب')}</div>
          <div style="font-size:10px;color:#555577;margin-top:1px">${p.clan?`<span style="color:#10b981">[${p.clan}]</span> · `:''}<span>Lv.${p.level||1}</span></div>
        </div>
        <div style="color:#fbbf24;font-weight:900;font-size:13px;flex-shrink:0">🪙 ${(p.coins||0).toLocaleString('ar')}</div>
        ${isAdmin ? `<button data-uid="${p.uid}" data-username="${escapeHTML(p.username||'')}" onclick="adminGiveCoinsToUser(this.dataset.uid,this.dataset.username)" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;font-size:9px;padding:3px 7px;cursor:pointer;font-family:inherit">منح</button>` : ''}
      </div>
    `).join('') || '<div style="text-align:center;color:#555577;padding:24px">لا يوجد لاعبون</div>';
  });
}

// ===== المتجر =====
function renderStore() {
  const sec = document.getElementById('store');
  if (!sec) return;
  sec.innerHTML = `
    <div style="padding:14px;color:white">
      <h2 style="color:var(--accent);margin-top:0">🛒 المتجر</h2>
      <p style="color:#aaa;margin-top:0;margin-bottom:16px">رصيدك: <span style="color:#ffd700;font-weight:bold">🪙 ${currentCoins}</span></p>

      <!-- فلترة الأقسام -->
      <div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px">
        ${['الكل','العضوية','الألقاب','الإطارات','التأثيرات'].map((t,i) =>
          `<button onclick="filterStore(${i})" id="store-tab-${i}"
                   style="white-space:nowrap;padding:6px 14px;border-radius:20px;border:1px solid ${i===0?'var(--accent)':'#2a2a3f'};background:${i===0?'var(--accent)':'#1a1a28'};color:${i===0?'white':'#888'};font-size:12px;cursor:pointer;font-weight:bold;font-family:inherit">
            ${t}
          </button>`).join('')}
      </div>

      <div id="store-items">

        <!-- العضوية -->
        <div class="store-section" data-cat="1">
          <h4 style="font-size:12px;color:#aaa;margin-bottom:8px">👑 العضوية</h4>
          ${storeCard('VIP ذهبي','إطار ذهبي + شارة VIP في الشات','#ffd700','👑',50,'buyVIP()')}
        </div>

        <!-- الألقاب -->
        <div class="store-section" data-cat="2">
          <h4 style="font-size:12px;color:#aaa;margin-bottom:8px">🏷️ الألقاب — تظهر في الشات · ٣٠ يوم</h4>
          <div style="display:flex;flex-direction:column;gap:8px;max-width:480px">
            ${buildTitleCard('الملك',    '#ff4757', 30)}
            ${buildTitleCard('الأسطورة','#2ed573',  25)}
            ${buildTitleCard('المحارب', '#00d2d3',  20)}
            ${buildTitleCard('الأمير',  '#a78bfa',  15)}
            ${buildTitleCard('النجم',   '#ffd700',  35)}
            ${buildTitleCard('الغيث',   '#54a0ff',  18)}
          </div>
        </div>

        <!-- الإطارات -->
        <div class="store-section" data-cat="3">
          <h4 style="font-size:12px;color:#aaa;margin-bottom:8px">🖼️ إطارات الأفاتار · ٣٠ يوم</h4>
          <div style="display:flex;flex-direction:column;gap:8px;max-width:480px">
            ${frameCard('إطار ناري',   'linear-gradient(135deg,#ff4757,#ff9f43)', 20)}
            ${frameCard('إطار مائي',   'linear-gradient(135deg,#00d2d3,#54a0ff)', 20)}
            ${frameCard('إطار ملكي',   'linear-gradient(135deg,#6c63ff,#a78bfa)', 20)}
            ${frameCard('إطار ذهبي',   'linear-gradient(135deg,#ffd700,#ff9f43)', 35)}
            ${frameCard('إطار نجمي',   'linear-gradient(135deg,#fff,#aaa)',        25)}
          </div>
        </div>

        <!-- التأثيرات -->
        <div class="store-section" data-cat="4">
          <h4 style="font-size:12px;color:#aaa;margin-bottom:8px">✨ تأثيرات الشات · ٧ أيام</h4>
          <div style="display:flex;flex-direction:column;gap:8px;max-width:480px">
            ${effectCard('رسائل متوهجة','💫','تتوهج رسائلك في الشات', 15)}
            ${effectCard('تأثير قوس قزح','🌈','ألوان متعددة لاسمك',    20)}
            ${effectCard('تأثير النار',  '🔥','اسمك يتوهج باللون الناري', 25)}
          </div>
        </div>

      </div>
    </div>`;
}

function storeCard(name, desc, color, icon, cost, action) {
  return `<div style="background:#1a1a28;border-radius:10px;border:1px solid ${color};padding:12px;display:flex;justify-content:space-between;align-items:center;max-width:480px;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:24px">${icon}</span>
      <div><div style="color:${color};font-weight:bold">${name}</div><div style="font-size:11px;color:#aaa;margin-top:2px">${desc}</div></div>
    </div>
    <button onclick="${action}" style="padding:7px 14px;background:${color};color:${color==='#ffd700'?'black':'white'};border:none;border-radius:6px;font-weight:bold;cursor:pointer;white-space:nowrap">${cost} 🪙</button>
  </div>`;
}

function frameCard(name, gradient, cost) {
  return `<div style="background:#1a1a28;border-radius:10px;border:1px solid #2a2a3f;padding:12px;display:flex;justify-content:space-between;align-items:center">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;border-radius:50%;background:${gradient};padding:2px">
        <div style="width:100%;height:100%;border-radius:50%;background:#1a1a28;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:white">
          ${currentUsername.charAt(0).toUpperCase()}
        </div>
      </div>
      <div><div style="font-weight:bold">${name}</div><div style="font-size:11px;color:#aaa">٣٠ يوم</div></div>
    </div>
    <button onclick="buyFrame('${name}','${gradient}',${cost})" style="padding:7px 14px;background:#6c63ff;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer">${cost} 🪙</button>
  </div>`;
}

function effectCard(name, icon, desc, cost) {
  return `<div style="background:#1a1a28;border-radius:10px;border:1px solid #2a2a3f;padding:12px;display:flex;justify-content:space-between;align-items:center">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:22px">${icon}</span>
      <div><div style="font-weight:bold">${name}</div><div style="font-size:11px;color:#aaa">${desc} · ٧ أيام</div></div>
    </div>
    <button onclick="buyEffect('${name}','${icon}',${cost})" style="padding:7px 14px;background:#a78bfa;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer">${cost} 🪙</button>
  </div>`;
}

function filterStore(cat) {
  // تحديث أزرار الفلترة
  for (let i=0;i<5;i++) {
    const btn = document.getElementById('store-tab-'+i);
    if (!btn) continue;
    const active = i===cat;
    btn.style.background = active ? 'var(--accent)' : '#1a1a28';
    btn.style.color      = active ? 'white' : '#888';
    btn.style.borderColor= active ? 'var(--accent)' : '#2a2a3f';
  }
  // إظهار / إخفاء الأقسام
  document.querySelectorAll('.store-section').forEach(el => {
    el.style.display = (cat===0 || el.dataset.cat==cat) ? 'block' : 'none';
  });
}

function buyFrame(name, gradient, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { alert("لا تملك كوينز كافية!"); return; }
  db.ref('users/'+user.uid).transaction(u => {
    if (u && u.coins >= cost) {
      u.coins -= cost;
      if (!u.inventory) u.inventory = {};
      u.inventory['frame_'+name] = { type:'frame', name, gradient, acquired:Date.now(), expires:Date.now()+30*24*60*60*1000 };
    }
    return u;
  }, (e,ok) => { if(ok) { alert(`🎉 حصلت على ${name}!`); renderStore(); } });
}

function buyEffect(name, icon, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { alert("لا تملك كوينز كافية!"); return; }
  db.ref('users/'+user.uid).transaction(u => {
    if (u && u.coins >= cost) {
      u.coins -= cost;
      if (!u.inventory) u.inventory = {};
      u.inventory['effect_'+name] = { type:'effect', name, icon, acquired:Date.now(), expires:Date.now()+7*24*60*60*1000 };
    }
    return u;
  }, (e,ok) => { if(ok) { alert(`🎉 حصلت على تأثير ${name}!`); renderStore(); } });
}

function buildTitleCard(name, color, cost) {
  return `
    <div style="background:#1a1a28;border-radius:10px;border:1px solid ${color};padding:12px;display:flex;justify-content:space-between;align-items:center">
      <div><span style="color:${color};font-weight:bold">‹${name}›</span> <span style="font-size:11px;color:#aaa">· 30 يوم</span></div>
      <button onclick="buyTitle('${name}','${color}',${cost})" style="padding:6px 12px;background:${color};color:${['#2ed573','#00d2d3','#ffd700'].includes(color)?'black':'white'};border:none;border-radius:6px;cursor:pointer;font-weight:bold">${cost} 🪙</button>
    </div>`;
}

function buyVIP() {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < 50) { alert("لا تملك كوينز كافية!"); return; }
  db.ref('users/'+user.uid).transaction(u => { if (u && u.coins >= 50) { u.coins -= 50; u.isVIP = true; } return u; },
    (e,ok) => { if (ok) { alert("مبروك! تم تفعيل VIP 🎉"); renderStore(); } });
}

function buyTitle(name, color, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { alert("لا تملك كوينز كافية!"); return; }
  db.ref('users/'+user.uid).transaction(u => {
    if (u && u.coins >= cost) {
      u.coins -= cost; u.title = name; u.titleColor = color;
      if (!u.inventory) u.inventory = {};
      u.inventory[name] = { acquired: Date.now(), expires: Date.now() + 30*24*60*60*1000, color };
    }
    return u;
  }, (e,ok) => { if (ok) { alert(`مبروك! حصلت على لقب ‹${name}› 🎉`); renderStore(); } });
}

// ===== الألعاب =====
const GAMES_LIST = [
  { id:'million', name:'مليون', icon:'🃏', desc:'لعبة الورق متعدد اللاعبين', color:'#c8a940', external:true },
  { id:'coinflip', name:'قلب العملة', icon:'🪙', desc:'راهن واختر الوجه الصحيح', color:'#6c63ff' },
  { id:'dice',     name:'رمي النرد',   icon:'🎲', desc:'عالي أو منخفض', color:'#ff6584' },
  { id:'guess',    name:'خمّن الرقم',  icon:'🔢', desc:'اربح ٨ أضعاف رهانك', color:'#2ed573' },
  { id:'redblack', name:'أحمر أو أسود',icon:'🃏', desc:'ورقة واحدة — لونها؟', color:'#ff4757' },
];

function renderGames() {
  const sec = document.getElementById('games');
  if (!sec) return;

  // عدد المتصلين أونلاين
  db.ref('online').once('value', snap => {
    const onlineEl = document.getElementById('online-count');
    if (onlineEl) onlineEl.textContent = snap.numChildren() + ' متصل الآن';
  });

  sec.innerHTML = `
    <div style="color:white">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h2 style="margin:0;font-size:17px">🎮 صالة الألعاب</h2>
        <span id="online-count" style="font-size:11px;color:#2ed573;background:#0a2a0a;padding:3px 10px;border-radius:20px;border:1px solid #2ed573">...</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        ${GAMES_LIST.map(g => `
          <div onclick="openGame('${g.id}')"
               style="background:#1a1a28;border-radius:12px;border:1px solid ${g.color};padding:16px;text-align:center;cursor:pointer;transition:transform .15s"
               onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform=''">
            <div style="font-size:32px;margin-bottom:6px">${g.icon}</div>
            <div style="font-weight:bold;font-size:13px;color:${g.color}">${g.name}</div>
            <div style="font-size:10px;color:#666;margin-top:3px">${g.desc}</div>
          </div>`).join('')}
      </div>
      <div id="game-area"></div>
    </div>`;

  // تحديث عداد الأونلاين
  db.ref('online').once('value', snap => {
    const el = document.getElementById('online-count');
    if (el) el.textContent = snap.numChildren() + ' متصل الآن';
  });

  // استعادة آخر لعبة
  const lastGame = localStorage.getItem('lastGame');
  if (lastGame && lastGame !== 'million') {
    setTimeout(() => playGame(lastGame), 100);
  }
}

function openGame(id) {
  activeGame = id;
  localStorage.setItem('activeGame', id);
  showSection('home');
}

function playGame(id) {
  const area = document.getElementById('game-area');
  if (!area) return;
  localStorage.setItem('lastGame', id); // تذكر آخر لعبة

  const betInput = (min=1) => `
    <input type="number" id="bet-amount" placeholder="الرهان..." min="${min}" max="${currentCoins}"
           class="input-field" style="text-align:center;font-size:16px;margin:10px auto;width:60%;display:block">
    <div style="font-size:11px;color:#aaa;margin-bottom:12px">رصيدك: <strong style="color:#ffd700">${currentCoins} 🪙</strong></div>`;

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
        <p style="font-size:12px;color:#aaa">عالي (٤-٦-٧) أو منخفض (١-٢-٣) — تفوز بضعف رهانك</p>
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
        <p style="font-size:12px;color:#aaa">خمّن الرقم الصحيح من ١ إلى ١٠ — تفوز بـ ٨ أضعاف رهانك!</p>
        ${betInput()}
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:8px">
          ${Array.from({length:10},(_,i)=>`
            <button onclick="playGuess(${i+1})"
                    style="width:44px;height:44px;background:#2a2a4f;color:white;border:1px solid #2ed573;border-radius:8px;font-size:15px;font-weight:bold;cursor:pointer"
                    onmousedown="this.style.background='#2ed573';this.style.color='black'" onmouseup="this.style.background='#2a2a4f';this.style.color='white'">
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
  area.scrollIntoView({ behavior:'smooth' });
}


// ===== منطق الألعاب =====
function getBet() {
  const b = parseInt(document.getElementById('bet-amount')?.value);
  const r = document.getElementById('game-result');
  if (isNaN(b) || b <= 0 || b > currentCoins) { if(r) r.innerHTML='<span style="color:#ff4757">رهان غير صحيح!</span>'; return null; }
  return b;
}

function applyGameResult(bet, isWin, multiplier = 2, xpWin = 15, xpLose = 5, isFlip = false) {
  const user = auth.currentUser; if (!user) return;
  db.ref('users/'+user.uid).transaction(u => {
    if (!u || u.coins < bet) return u;
    u.coins = isWin ? u.coins + Math.floor(bet * (multiplier-1)) : u.coins - bet;
    u.xp = (u.xp||0) + (isWin ? xpWin : xpLose);
    if (u.xp >= u.level * 100) u.level = (u.level||1) + 1;
    if (isFlip) {
      if (!u.quests) u.quests = {};
      if (!u.quests.flipClaimed) u.quests.flipProgress = (u.quests.flipProgress||0) + 1;
    }
    return u;
  });
}

function playCoinFlip(choice) {
  const bet = getBet(); if (bet === null) return;
  const r = document.getElementById('game-result');
  r.innerHTML = '<span style="color:#ffd700;animation:pulse 0.5s infinite">جاري القلب... 🪙</span>';
  setTimeout(() => {
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin   = choice === outcome;
    const name    = outcome === 'heads' ? 'طُرّة 🪙' : 'نقش 🪙';
    applyGameResult(bet, isWin, 2, 15, 5, true);
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
    applyGameResult(bet, isWin);
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
    applyGameResult(bet, isWin, isWin ? 8 : 1, 30, 5);
    r.innerHTML = isWin
      ? `<span style="color:#2ed573">🎉🎉 الرقم كان ${num}! ربحت ${bet*7} 🪙!</span>`
      : `<span style="color:#ff4757">الرقم كان ${num} — اخترت ${pick}. خسرت ${bet} 🪙</span>`;
  }, 900);
}

function playRedBlack(choice) {
  const bet = getBet(); if (bet === null) return;
  const r = document.getElementById('game-result');
  r.innerHTML = '<span style="color:#ff4757">جاري السحب... 🃏</span>';
  setTimeout(() => {
    const reds  = ['♥','♦'];
    const blacks= ['♣','♠'];
    const suits = [...reds,...blacks];
    const suit  = suits[Math.floor(Math.random()*4)];
    const isRed = reds.includes(suit);
    const isWin = (choice==='red' && isRed) || (choice==='black' && !isRed);
    applyGameResult(bet, isWin);
    r.innerHTML = isWin
      ? `<span style="color:#2ed573">🎉 ظهرت ${suit} — ربحت +${bet} 🪙</span>`
      : `<span style="color:#ff4757">ظهرت ${suit} — خسرت ${bet} 🪙</span>`;
  }, 800);
}

// ===== الكلانات =====
let currentClanId = '';

function renderClan() {
  const sec = document.getElementById('clan'); if (!sec) return;
  if (currentClan) {
    sec.innerHTML = `
      <div style="padding:12px;color:white;display:flex;flex-direction:column;gap:10px;height:calc(100vh - 70px);overflow:hidden">
        <div style="background:#1a1a28;border-radius:10px;border:1px solid #2ed573;padding:12px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
          <div>
            <div style="font-size:11px;color:#2ed573">كلانك الحالي</div>
            <div style="font-size:18px;font-weight:bold">[ ${escapeHTML(currentClan)} ]</div>
          </div>
          <div style="display:flex;gap:6px;flex-direction:column;align-items:flex-end">
            <button onclick="showClanSettings()" style="background:#2a2a4f;color:#a78bfa;border:1px solid #6c63ff;border-radius:6px;font-size:11px;padding:5px 10px;cursor:pointer">⚙️ إعدادات</button>
            <button onclick="leaveClan()" style="background:#ff4757;color:white;border:none;border-radius:6px;font-size:11px;padding:5px 10px;cursor:pointer">مغادرة</button>
          </div>
        </div>
        <div id="clan-settings-panel" style="display:none;background:#1a1a28;border-radius:10px;border:1px solid #6c63ff;padding:12px;flex-shrink:0">
          <div id="clan-settings-content">جاري التحميل...</div>
        </div>
        <div style="flex:1;background:#1a1a28;border-radius:10px;border:1px solid var(--accent);display:flex;flex-direction:column;min-height:0">
          <div style="background:var(--accent);padding:9px 12px;font-weight:bold;font-size:13px;border-radius:10px 10px 0 0;flex-shrink:0">💬 شات الكلان</div>
          <div id="clan-chat-messages" style="flex:1;padding:10px;overflow-y:auto;display:flex;flex-direction:column;gap:5px"></div>
          <div style="padding:8px;border-top:1px solid #2a2a3f;display:flex;gap:6px;flex-shrink:0">
            <input type="text" id="clan-chat-input" placeholder="رسالة للكلان..." class="input-field" style="flex:1" onkeydown="if(event.key==='Enter') sendClanMessage()">
            <button onclick="sendClanMessage()" style="padding:0 14px;background:#2ed573;color:black;border:none;border-radius:8px;font-size:16px;cursor:pointer">➤</button>
          </div>
        </div>
      </div>`;
    listenToClanChat();
  } else {
    sec.innerHTML = `
      <div style="padding:14px;color:white;height:calc(100vh - 70px);overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h2 style="margin:0;font-size:18px">⚔️ الكلانات</h2>
          <button onclick="toggleCreateForm()" style="background:#6c63ff;color:white;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:bold;cursor:pointer">+ إنشاء كلان</button>
        </div>
        <div id="create-clan-form" style="display:none;background:#1a1a28;border-radius:12px;border:1px solid var(--accent);padding:14px;margin-bottom:14px">
          <h4 style="margin:0 0 10px;color:var(--accent);font-size:14px">إنشاء كلان جديد</h4>
          <input type="text" id="new-clan-name" placeholder="اسم الكلان (3-10 أحرف)..." class="input-field" style="margin-bottom:10px">
          <div style="font-size:12px;color:#aaa;margin-bottom:8px">نوع القبول:</div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:white"><input type="radio" name="clan-type" value="open" checked> 🔓 مفتوح — يدخل أي شخص فوراً</label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:white"><input type="radio" name="clan-type" value="request"> 📋 بطلب — أنت تقبل أو ترفض</label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:white"><input type="radio" name="clan-type" value="closed"> 🔒 مغلق — بالدعوة فقط</label>
          </div>
          <button onclick="createClan()" style="width:100%;padding:10px;background:#6c63ff;color:white;border:none;border-radius:8px;font-weight:bold;font-size:13px;cursor:pointer">تأسيس الكلان ⚔️</button>
        </div>
        <div style="font-size:12px;color:#666;margin-bottom:8px">الكلانات الموجودة</div>
        <div id="clans-list"><div style="text-align:center;color:#666;padding:30px">جاري التحميل...</div></div>
      </div>`;
    loadClansList();
  }
}

function toggleCreateForm() {
  const f = document.getElementById('create-clan-form');
  if (f) { const o = f.style.display !== 'none'; f.style.display = o ? 'none' : 'block'; if (!o) document.getElementById('new-clan-name')?.focus(); }
}

function loadClansList() {
  const d = document.getElementById('clans-list'); if (!d) return;
  db.ref('clans').once('value', snap => {
    const clans = snap.val();
    if (!clans) { d.innerHTML = '<div style="text-align:center;color:#666;padding:40px">⚔️<br>لا يوجد كلانات بعد</div>'; return; }
    const ti = { open:'🔓', request:'📋', closed:'🔒' };
    const tn = { open:'مفتوح', request:'بطلب', closed:'مغلق' };
    d.innerHTML = Object.entries(clans).map(([id,c]) => `
      <div style="background:#1a1a28;border-radius:10px;border:1px solid #2a2a3f;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:14px;font-weight:bold">[ ${escapeHTML(c.name)} ]</div>
          <div style="font-size:11px;color:#888;margin-top:2px">👥 ${c.memberCount||1} · ${ti[c.type]||'🔓'} ${tn[c.type]||'مفتوح'}</div>
        </div>
        ${c.type==='open' ? `<button onclick="joinClan('${id}','${escapeHTML(c.name)}')" style="background:#2ed573;color:black;border:none;border-radius:6px;padding:7px 12px;font-size:12px;font-weight:bold;cursor:pointer">انضمام</button>`
          : c.type==='request' ? `<button onclick="requestJoinClan('${id}','${escapeHTML(c.name)}')" style="background:#6c63ff;color:white;border:none;border-radius:6px;padding:7px 12px;font-size:12px;font-weight:bold;cursor:pointer">طلب انضمام</button>`
          : '<span style="font-size:11px;color:#ff4757">🔒 مغلق</span>'}
      </div>`).join('');
  });
}

function createClan() {
  const user = auth.currentUser; if (!user) return;
  const name = (document.getElementById('new-clan-name')?.value||'').trim();
  const typeEl = document.querySelector('input[name="clan-type"]:checked');
  const type = typeEl ? typeEl.value : 'open';
  if (name.length < 3 || name.length > 10) { alert("الاسم بين 3 و10 أحرف"); return; }
  db.ref('clans').orderByChild('name').equalTo(name).once('value', snap => {
    if (snap.exists()) { alert("هذا الاسم مأخوذ"); return; }
    const clanId = db.ref('clans').push().key;
    db.ref('clans/'+clanId).set({ name, type, leader:user.uid, leaderName:currentUsername, memberCount:1, createdAt:Date.now() });
    db.ref('clans/'+clanId+'/members/'+user.uid).set({ username:currentUsername, role:'leader', joinedAt:Date.now() });
    db.ref('users/'+user.uid).update({ clan:name, clanId }, () => { alert(`🎉 تم تأسيس كلان [ ${name} ]!`); renderClan(); });
  });
}

function joinClan(clanId, clanName) {
  const user = auth.currentUser; if (!user) return;
  db.ref('clans/'+clanId+'/members/'+user.uid).set({ username:currentUsername, role:'member', joinedAt:Date.now() });
  db.ref('clans/'+clanId+'/memberCount').transaction(n => (n||0)+1);
  db.ref('users/'+user.uid).update({ clan:clanName, clanId }, () => { alert(`انضممت لـ [ ${clanName} ]!`); renderClan(); });
}

function requestJoinClan(clanId, clanName) {
  const user = auth.currentUser; if (!user) return;
  db.ref('clans/'+clanId+'/requests/'+user.uid).once('value', snap => {
    if (snap.exists()) { alert("أرسلت طلباً بالفعل!"); return; }
    db.ref('clans/'+clanId+'/requests/'+user.uid).set({ username:currentUsername, uid:user.uid, time:Date.now() },
      () => alert(`تم إرسال طلب الانضمام لـ [ ${clanName} ]`));
  });
}

function leaveClan() {
  const user = auth.currentUser; if (!user || !currentClan) return;
  if (!confirm(`هل أنت متأكد من مغادرة [ ${currentClan} ]؟`)) return;
  db.ref('users/'+user.uid+'/clanId').once('value', snap => {
    const clanId = snap.val();
    if (clanId) { db.ref('clans/'+clanId+'/members/'+user.uid).remove(); db.ref('clans/'+clanId+'/memberCount').transaction(n => Math.max(0,(n||1)-1)); }
    if (clanChatListener) { clanChatListener.off(); clanChatListener = null; }
    db.ref('users/'+user.uid).update({ clan:'', clanId:'' }, () => { alert("غادرت الكلان."); renderClan(); });
  });
}

function showClanSettings() {
  const panel = document.getElementById('clan-settings-panel'); if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (isOpen) return;
  const content = document.getElementById('clan-settings-content');
  content.innerHTML = '<div style="color:#aaa;font-size:12px">جاري التحميل...</div>';
  db.ref('users/'+auth.currentUser.uid+'/clanId').once('value', snap => {
    const clanId = snap.val(); if (!clanId) return;
    db.ref('clans/'+clanId).once('value', cSnap => {
      const clan = cSnap.val(); if (!clan) return;
      const isLeader = clan.leader === auth.currentUser.uid;
      const tl = { open:'🔓 مفتوح', request:'📋 بطلب', closed:'🔒 مغلق' };
      const reqs = clan.requests ? Object.entries(clan.requests) : [];
      content.innerHTML = `
        ${isLeader ? `
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:#aaa;margin-bottom:6px">نوع القبول: <strong style="color:white">${tl[clan.type]||'🔓 مفتوح'}</strong></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${['open','request','closed'].map(t => `<button onclick="changeClanType('${clanId}','${t}')" style="font-size:11px;padding:5px 10px;border-radius:6px;cursor:pointer;border:1px solid #3a3a5f;${clan.type===t?'background:#6c63ff;color:white':'background:#1a1a28;color:#aaa'}">${tl[t]}</button>`).join('')}
            </div>
          </div><hr style="border:none;border-top:1px solid #2a2a3f;margin:8px 0">` : ''}
        <div style="font-size:12px;color:#aaa;margin-bottom:6px">📋 طلبات الانضمام ${reqs.length ? `(${reqs.length})` : ''}</div>
        ${reqs.length ? reqs.map(([uid,r]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #2a2a3f">
            <span style="font-size:12px">👤 ${escapeHTML(r.username)}</span>
            ${isLeader ? `<div style="display:flex;gap:5px">
              <button onclick="acceptRequest('${clanId}','${uid}','${escapeHTML(r.username)}')" style="background:#2ed573;color:black;border:none;border-radius:4px;font-size:11px;padding:3px 8px;cursor:pointer">قبول</button>
              <button onclick="rejectRequest('${clanId}','${uid}')" style="background:#ff4757;color:white;border:none;border-radius:4px;font-size:11px;padding:3px 8px;cursor:pointer">رفض</button>
            </div>` : ''}</div>`).join('')
          : '<div style="font-size:12px;color:#555">لا يوجد طلبات</div>'}`;
    });
  });
}

function acceptRequest(clanId, uid, username) {
  db.ref('clans/'+clanId+'/requests/'+uid).remove();
  db.ref('clans/'+clanId+'/members/'+uid).set({ username, role:'member', joinedAt:Date.now() });
  db.ref('clans/'+clanId+'/memberCount').transaction(n => (n||0)+1);
  db.ref('clans/'+clanId+'/name').once('value', snap => {
    db.ref('users/'+uid).update({ clan:snap.val(), clanId }, () => { alert(`تم قبول ${username}!`); showClanSettings(); });
  });
}

function rejectRequest(clanId, uid) {
  db.ref('clans/'+clanId+'/requests/'+uid).remove(() => { alert("تم رفض الطلب."); showClanSettings(); });
}

function changeClanType(clanId, newType) {
  const labels = { open:'مفتوح', request:'بطلب', closed:'مغلق' };
  db.ref('clans/'+clanId+'/type').set(newType, () => { alert(`تم التغيير إلى: ${labels[newType]}`); showClanSettings(); });
}

// ===== الحقيبة =====
function renderInventory() {
  const list = document.getElementById('inventory-list');
  if (!list || !auth.currentUser) return;
  list.innerHTML = '<div style="text-align:center;color:#888;padding:20px">جاري التحميل...</div>';
  db.ref('users/'+auth.currentUser.uid+'/inventory').once('value', snap => {
    const items = snap.val();
    if (!items) { list.innerHTML = '<div style="text-align:center;color:#888;padding:40px">🎒 حقيبتك فارغة<br><small>اذهب للمتجر</small></div>'; return; }
    const now = Date.now();
    list.innerHTML = Object.entries(items).map(([key, item]) => {
      const left = item.expires ? item.expires - now : null;
      const exp = left !== null && left <= 0;
      const days = left ? Math.ceil(left/(1000*60*60*24)) : null;
      const txt = item.expires ? (exp ? '⚠️ منتهي' : `⏳ ${days} يوم`) : '♾️ دائم';
      return `<div class="inventory-item" style="${exp?'opacity:0.5;border-color:#ff4757':''}">
        <div class="item-icon">${item.color?'🏷️':'📦'}</div>
        <div class="item-name" style="${item.color?'color:'+item.color:''}">${key}</div>
        <div class="item-expires ${exp?'expired':''}">${txt}</div>
      </div>`;
    }).join('');
  });
}

// ===== المهام والمكافآت =====
function claimQuest(type) {
  const user = auth.currentUser; 
  if (!user) return;

  // جلب الزر الذي تم ضغطه مؤقتاً لمنع الـ Spam
  const btn = document.querySelector(`button[onclick="claimQuest('${type}')"]`);
  if (btn) btn.disabled = true;

  db.ref('users/' + user.uid).transaction(u => {
    if (!u) return u;
    if (!u.quests) u.quests = {};

    // 1. التحقق من مهمة الشات داخل السيرفر
    if (type === 'chat') {
      const progress = u.quests.chatProgress || 0;
      const claimed  = u.quests.chatClaimed || false;

      if (progress >= 5 && !claimed) {
        u.coins = (u.coins || 0) + 20;
        u.quests.chatClaimed = true;
        u.tempSuccess = true; // علامة لنجاح العملية
      } else {
        u.tempSuccess = false;
      }
    }

    // 2. التحقق من مهمة قلب العملة داخل السيرفر
    if (type === 'flip') {
      const progress = u.quests.flipProgress || 0;
      const claimed  = u.quests.flipClaimed || false;

      if (progress >= 3 && !claimed) {
        u.coins = (u.coins || 0) + 30;
        u.quests.flipClaimed = true;
        u.tempSuccess = true; // علامة لنجاح العملية
      } else {
        u.tempSuccess = false;
      }
    }

    return u;
  }, (error, committed, snap) => {
    // إعادة تفعيل الزر في حال حدوث خطأ شبكة غير متوقع
    if (btn && (!committed || error)) btn.disabled = false;

    if (committed && snap.exists()) {
      const userData = snap.val();
      
      if (userData.tempSuccess) {
        // تحديث المتغيرات العامة محلياً فوراً لتتوافق مع السيرفر
        if (type === 'chat') {
          claimedChatQuest = true;
          alert("تم استلام 20 🪙 بنجاح!");
        } else if (type === 'flip') {
          claimedFlipQuest = true;
          alert("تم استلام 30 🪙 بنجاح!");
        }
        
        // إعادة رسم الصفحة لتحديث شكل الأزرار وتحويلها إلى (✓ تم)
        renderHome();
      } else {
        alert("لم تكمل المهمة بعد، أو قمت بالاستلام مسبقاً!");
        renderHome(); // لتحديث الواجهة في حال كان هناك تعارض
      }
    } else {
      alert("فشلت العملية، يرجى التحقق من الاتصال.");
    }
  });
}

function claimDaily() {
  const user = auth.currentUser; 
  if (!user) return;

  // جلب زر الاستلام لتعطيله مؤقتاً ومنع السبام
  const claimBtn = document.querySelector("button[onclick='claimDaily()']");
  if (claimBtn) claimBtn.disabled = true;

  // الدخول مباشرة في الترانزكشن لقراءة وتعديل البيانات في نفس اللحظة بأمان
  db.ref('users/' + user.uid).transaction(d => {
    if (!d) return d;

    // 1. استخدام وقت السيرفر الحالي الموثق (أو وقت الجهاز كبديل احتياطي داخل السيرفر)
    const now = Date.now(); 
    const last = d.lastDaily || 0;
    const diff = now - last;
    const oneDay = 24 * 60 * 60 * 1000;

    // 2. الفحص الأمني للوقت (إذا لم يمر يوم كامل، نلغي العملية فوراً)
    if (diff < oneDay) {
      // نضع علامة مؤقتة داخل الكائن لكي نعرف في النتيجة (callback) كم الوقت المتبقي
      d.tempTimeLeft = oneDay - diff;
      return; // إلغاء الترانزكشن دون تغيير أي بيانات
    }

    // 3. حساب السلسلة بأمان بناءً على بيانات السيرفر الحقيقية
    const streak = (diff < oneDay * 2) ? (d.dailyStreak || 0) + 1 : 1;

    // 4. تحديد المكافأة داخل السيرفر
    const rewards = [50, 75, 100, 125, 150, 175, 200, 250, 300, 500];
    const reward  = rewards[Math.min(streak - 1, rewards.length - 1)];

    // 5. تحديث البيانات لحفظها
    d.coins       = (d.coins || 0) + reward;
    d.lastDaily   = now;
    d.dailyStreak = streak;
    
    // حفظ المكافأة المستلمة مؤقتاً لإظهارها في رسالة النجاح بالأسفل
    d.tempReward  = reward; 

    return d;
  }, (error, committed, snap) => {
    // تفعيل الزر مجدداً بعد انتهاء العملية بالكامل
    if (claimBtn) claimBtn.disabled = false;

    if (committed && snap.exists()) {
      const userData = snap.val();
      
      // إذا نجحت العملية وتم الحفظ
      if (userData.tempReward) {
        const streakMsg = userData.dailyStreak > 1 ? `\n🔥 سلسلة ${userData.dailyStreak} أيام متتالية!` : '';
        alert(`🎁 استلمت ${userData.tempReward} 🪙 مكافأة يومية!${streakMsg}`);
        renderHome();
      } 
      // إذا لم تلتزم العملية لأن الوقت لم يحن بعد (تم الإلغاء من داخل الترانزكشن)
      else if (userData.tempTimeLeft) {
        const r = userData.tempTimeLeft;
        alert(`استلمت بالفعل!\nانتظر ${Math.floor(r/3600000)} ساعة و${Math.floor((r%3600000)/60000)} دقيقة`);
      }
    } else {
      alert("حدث خطأ أثناء استلام المكافأة، يرجى المحاولة مجدداً.");
    }
  });
}

function transferCoins() {
  const user = auth.currentUser;
  const targetInput = document.getElementById('tr-user');
  const amountInput = document.getElementById('tr-amount');
  // جلب الزر لتعطيله مؤقتاً ومنع السبام
  const transferBtn = document.querySelector("button[onclick^='transferCoins']");

  if (!targetInput || !amountInput) return;

  const target = targetInput.value.trim();
  const amount = parseInt(amountInput.value);

  // 1. الفحوصات الأساسية المدخلة
  if (!user || !target || isNaN(amount) || amount <= 0) { 
    alert("بيانات غير صحيحة"); 
    return; 
  }
  if (amount > currentCoins) { 
    alert("لا تملك هذا القدر من الكوينز!"); 
    return; 
  }
  if (target === currentUsername) { 
    alert("لا يمكنك التحويل لنفسك!"); 
    return; 
  }

  // 2. تعطيل الزر فوراً لمنع الضغط المتكرر
  if (transferBtn) transferBtn.disabled = true;

  // 3. التحقق من وجود المستلم
  db.ref('users').orderByChild('username').equalTo(target).once('value', snap => {
    if (!snap.exists()) { 
      alert("المستخدم المستلم غير موجود!"); 
      if (transferBtn) transferBtn.disabled = false;
      return; 
    }
    
    const tid = Object.keys(snap.val())[0];

    // 4. الخطوة الأولى: خصم الكوينز من الراسل بأمان
    db.ref('users/' + user.uid).transaction(u => {
      if (u) {
        if (u.coins >= amount) {
          u.coins -= amount;
          return u; // تأكيد الخصم
        } else {
          return; // إلغاء الترانزكشن فوراً (الرصيد غير كافٍ في السيرفر)
        }
      }
      return u;
    }, (error, committed) => {
      if (committed) {
        
        // 5. الخطوة الثانية: إضافة الكوينز للمستلم فوراً وبشكل ذري (Atomic)
        // استخدام ServerValue.increment أسرع وأضمن من ترانزكشن كامل هنا
        db.ref('users/' + tid + '/coins').set(firebase.database.ServerValue.increment(amount))
          .then(() => {
            alert(`تم تحويل 🪙 ${amount} إلى ${target} بنجاح!`);
            // تنظيف الحقول بعد النجاح
            targetInput.value = '';
            amountInput.value = '';
          })
          .catch(err => {
            console.error("خطأ في إيداع الكوينز للمستلم:", err);
            alert("تم خصم الكوينز لكن فشل إيداعها للمستلم، يرجى تصوير الشاشة ومراسلة الإدارة.");
          })
          .finally(() => {
            // إعادة تفعيل الزر في كل الأحوال بعد انتهاء العملية بالكامل
            if (transferBtn) transferBtn.disabled = false;
          });

      } else {
        alert("فشل التحويل. تأكد من رصيدك الحالي.");
        if (transferBtn) transferBtn.disabled = false;
      }
    });
  });
}

// ===== الملف الشخصي =====
function viewProfile(uid) {
  const modal = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal||!content) return;
  modal.style.display = 'flex';
  content.innerHTML = '<div style="color:#888">جاري التحميل...</div>';
  db.ref('users/'+uid).once('value', snap => {
    const u = snap.val();
    if (!u) { content.innerHTML = 'غير موجود'; return; }
    content.innerHTML = `
      <div style="text-align:center;margin-bottom:12px">${avatarHTML(u.username||'؟', 60)}</div>
      <div style="font-size:16px;font-weight:bold;margin-bottom:10px;text-align:center">${escapeHTML(u.username||'لاعب')}</div>
      <div style="font-size:13px;line-height:2.2;color:#ccc">
        <div>⭐ المستوى: ${u.level||1}</div>
        <div>🛡️ الكلان: <span style="color:#2ed573">${u.clan||'لا يوجد'}</span></div>
        ${u.title ? `<div>🏷️ <span style="color:${u.titleColor||'#fff'}">${u.title}</span></div>` : ''}
        <div>💎 ${u.isVIP ? '<span style="color:#ffd700">VIP ★</span>' : 'عادي'}</div>
      </div>
      ${isAdmin ? `<button onclick="adminGiveCoinsToUser('${uid}','${escapeHTML(u.username||'')}')" style="width:100%;margin-top:12px;padding:8px;background:#ff4757;color:white;border:none;border-radius:8px;font-size:12px;cursor:pointer;font-weight:bold">🪙 منح كوينز (إدارة)</button>` : ''}`;
  });
}

// ===== لوحة الإدارة =====
function renderAdminPanelPage() {
  const sec = document.getElementById('admin-panel');
  if (!sec || !isAdmin) return;
  sec.innerHTML = `
    <div style="padding:14px;color:white;max-height:calc(100vh - 70px);overflow-y:auto">
      <h2 style="color:#ff4757;margin-top:0">⚙️ لوحة التحكم</h2>

      <!-- منح كوينز -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid #ffd700;padding:14px;margin-bottom:12px">
        <h4 style="margin:0 0 10px;color:#ffd700;font-size:13px">🪙 منح كوينز</h4>
        <input type="text" id="admin-coins-user" placeholder="اسم المستخدم (أو اتركه فارغاً لمنحك أنت)..." class="input-field" style="margin-bottom:8px">
        <input type="number" id="admin-coins-amount" placeholder="الكمية..." class="input-field" style="margin-bottom:8px">
        <button onclick="adminGiveCoins()" style="width:100%;padding:9px;background:#ffd700;color:black;border:none;border-radius:8px;font-weight:bold;cursor:pointer">منح الكوينز</button>
      </div>

      <!-- ترقية / سحب إدارة -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid #ff4757;padding:14px;margin-bottom:12px">
        <h4 style="margin:0 0 10px;color:#ff4757;font-size:13px">👑 صلاحيات الإدارة</h4>
        <input type="text" id="admin-target-username" placeholder="اسم المستخدم..." class="input-field" style="margin-bottom:8px">
        <div style="display:flex;gap:8px">
          <button onclick="assignAdminStatus(true)" style="flex:1;padding:8px;background:#2ed573;color:black;border:none;border-radius:8px;font-weight:bold;cursor:pointer">ترقية لمشرف</button>
          <button onclick="assignAdminStatus(false)" style="flex:1;padding:8px;background:#ff4757;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer">سحب الصلاحية</button>
        </div>
      </div>

      <!-- تعديل كلان -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid var(--accent);padding:14px">
        <h4 style="margin:0 0 10px;color:var(--accent);font-size:13px">⚔️ تعديل اسم كلان</h4>
        <input type="text" id="admin-clan-target" placeholder="اسم الكلان الحالي..." class="input-field" style="margin-bottom:8px">
        <input type="text" id="admin-clan-new-name" placeholder="الاسم الجديد..." class="input-field" style="margin-bottom:8px">
        <button onclick="adminModifyClanName()" style="width:100%;padding:9px;background:#6c63ff;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer">تطبيق التغيير</button>
      </div>
    </div>`;
}

// منح كوينز من لوحة الإدارة
function adminGiveCoins() {
  const username = document.getElementById('admin-coins-user')?.value.trim();
  const amount   = parseInt(document.getElementById('admin-coins-amount')?.value);
  if (isNaN(amount) || amount <= 0) { alert("أدخل كمية صحيحة"); return; }

  if (!username) {
    // منح لنفسه
    const user = auth.currentUser; if (!user) return;
    db.ref('users/'+user.uid+'/coins').transaction(c => (c||0)+amount,
      (e,ok) => { if(ok) alert(`تم منح ${amount} 🪙 لنفسك!`); });
  } else {
    db.ref('users').orderByChild('username').equalTo(username).once('value', snap => {
      if (!snap.exists()) { alert("المستخدم غير موجود!"); return; }
      const uid = Object.keys(snap.val())[0];
      db.ref('users/'+uid+'/coins').transaction(c => (c||0)+amount,
        (e,ok) => { if(ok) alert(`تم منح ${amount} 🪙 لـ ${username}!`); });
    });
  }
}

// منح كوينز بالضغط على لاعب في المتصدرين
function adminGiveCoinsToUser(uid, username) {
  if (!isAdmin) return;
  const amount = parseInt(prompt(`كم كوينز تريد منح ${username}؟`));
  if (isNaN(amount) || amount <= 0) return;
  db.ref('users/'+uid+'/coins').transaction(c => (c||0)+amount,
    (e,ok) => { if(ok) { alert(`تم منح ${amount} 🪙 لـ ${username}!`); renderLeaderboard(); } });
}

function assignAdminStatus(status) {
  const name = document.getElementById('admin-target-username')?.value.trim();
  if (!name) return;
  db.ref('users').orderByChild('username').equalTo(name).once('value', snap => {
    if (!snap.exists()) { alert("المستخدم غير موجود!"); return; }
    const uid = Object.keys(snap.val())[0];
    db.ref('users/'+uid+'/isAdmin').set(status, e => { if(!e) alert(status?"تمت الترقية!":"تم سحب الصلاحية!"); });
  });
}

function adminModifyClanName() {
  const old = document.getElementById('admin-clan-target')?.value.trim();
  const nw  = document.getElementById('admin-clan-new-name')?.value.trim();
  if (!old||!nw) return;
  if (nw.length<3||nw.length>10) { alert("الاسم بين 3 و10 أحرف"); return; }
  db.ref('users').once('value', snap => {
    snap.forEach(child => { if(child.val().clan===old) db.ref('users/'+child.key+'/clan').set(nw); });
    alert("تم تعديل الكلان لكل الأعضاء!");
  });
}
