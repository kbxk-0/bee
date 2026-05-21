// ============================================================
//  js/app.js — bee platform
// ============================================================

// ===== أداة: لون ثابت لكل مستخدم بناءً على اسمه =====
let savedAvatarColor = ''; // يُحدَّث من auth.js عند التحميل

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

// ===== الرئيسية =====renderHome

// ===== لوحة المتصدرين =====
function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;color:#888;padding:20px">جاري التحميل...</div>';

  db.ref('users').orderByChild('coins').limitToLast(20).once('value', snap => {
    let players = [];
    snap.forEach(child => { const u = child.val(); u.uid = child.key; if (!u.isAdmin) players.push(u); });
    players.reverse();

    const medals = ['🥇','🥈','🥉'];
    list.innerHTML = players.map((p, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid #2a2a3f;${i < 3 ? 'background:#1a1a28' : ''}">
        <span style="font-size:${i < 3 ? 20 : 14}px;width:24px;text-align:center">${medals[i] || (i+1)+'.'}</span>
        ${avatarHTML(p.username || '؟', 34)}
        <div style="flex:1">
          <div style="font-size:13px;font-weight:bold">${escapeHTML(p.username||'لاعب')}</div>
          <div style="font-size:10px;color:#2ed573">${p.clan ? '['+p.clan+'] · ' : ''}Lv.${p.level||1}</div>
        </div>
        <div style="color:#ffd700;font-weight:bold;font-size:13px">🪙 ${p.coins||0}</div>
        ${isAdmin ? `<button data-uid="${p.uid}" data-username="${escapeHTML(p.username||'')}" onclick="adminGiveCoinsToUser(this.dataset.uid, this.dataset.username)" style="background:#ff4757;color:white;border:none;border-radius:4px;font-size:10px;padding:3px 6px;cursor:pointer">منح</button>` : ''}
      </div>
    `).join('') || '<div style="text-align:center;color:#888;padding:20px">لا يوجد لاعبون</div>';
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
  { id:'coinflip', name:'قلب العملة',   icon:'🪙', desc:'طُرّة أو نقش — راهن واختر', color:'#6c63ff' },
  { id:'dice',     name:'رمي النرد',     icon:'🎲', desc:'عالي أو منخفض — راهن على النرد', color:'#ff6584' },
  { id:'guess',    name:'خمّن الرقم',    icon:'🔢', desc:'اختر رقم ١-١٠ واربح ٨ أضعاف', color:'#2ed573' },
  { id:'redblack', name:'أحمر أو أسود', icon:'🃏', desc:'ورقة واحدة — لونها؟', color:'#ff4757' },
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
          <div onclick="playGame('${g.id}')"
               style="background:#1a1a28;border-radius:12px;border:1px solid ${g.color};padding:16px;text-align:center;cursor:pointer;transition:transform .15s;active:scale(0.95)"
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
}

function playGame(id) {
  const area = document.getElementById('game-area');
  if (!area) return;

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

// --- [ 1. دالة تحويل الكوينز مع الضريبة 5% ] ---
function transferCoinsFromMenu(targetUid, targetName) {
  const user = auth.currentUser;
  if (!user) return;

  if (targetName === currentUsername) { 
    alert("لا يمكنك التحويل لنفسك!"); 
    return; 
  }

  // طلب الكمية من اللاعب عبر صندوق إدخال
  const amountInput = prompt(`أدخل كمية الكوينز المراد تحويلها إلى ${targetName}:`);
  const amount = parseInt(amountInput);

  if (isNaN(amount) || amount <= 0) { 
    alert("برجاء إدخال كمية صحيحة!"); 
    return; 
  }
  if (amount > currentCoins) { 
    alert("لا تملك هذا القدر من الكوينز!"); 
    return; 
  }

  // حساب الضريبة (مثال: 5%) والكمية الصافية للمستلم
  const taxPercentage = 0.05; // 5% ضريبة
  const tax = Math.floor(amount * taxPercentage);
  const netAmount = amount - tax;

  // تأكيد العملية من اللاعب
  const confirmTransfer = confirm(`سيتم خصم ${amount} 🪙 من رصيدك.\n(الضريبة 5%: ${tax} 🪙)\nسيستلم ${targetName} صافي: ${netAmount} 🪙.\n\nهل تريد الاستمرار؟`);
  if (!confirmTransfer) return;

  // الخطوة الأولى: خصم المبلغ كاملاً من الراسل
  db.ref('users/' + user.uid).transaction(u => {
    if (u) {
      if (u.coins >= amount) {
        u.coins -= amount;
        return u;
      } else {
        return; // إلغاء الترانزكشن إذا قل الرصيد فجأة
      }
    }
    return u;
  }, (error, committed) => {
    if (committed) {
      // الخطوة الثانية: إيداع المبلغ الصافي (بعد خصم الضريبة) للمستلم
      db.ref('users/' + targetUid + '/coins').set(firebase.database.ServerValue.increment(netAmount))
        .then(() => {
          alert(`تم تحويل 🪙 ${netAmount} إلى ${targetName} بنجاح بعد خصم الضريبة!`);
          closePlayerMenu(); // إغلاق المنيو تلقائياً
        })
        .catch(err => {
          console.error("خطأ في الإيداع:", err);
          alert("تم خصم الكوينز لكن فشل إيداعها، يرجى مراسلة الإدارة.");
        });
    } else {
      alert("فشل التحويل. تأكد من رصيدك الحالي.");
    }
  });
}

// --- [ 2. دالة إرسال الرسائل الخاصة من المنيو ] ---
function sendPrivateMessageFromMenu(targetUid, targetName) {
  const user = auth.currentUser;
  if (!user) return;
  if (isMuted) { alert("أنت مكتوم!"); return; }

  const text = prompt(`أرسل رسالة خاصة إلى ${targetName}:`);
  if (!text || !text.trim()) { return; }

  const pmData = {
    senderUid: user.uid, 
    senderName: currentUsername,
    receiverUid: targetUid, 
    receiverName: targetName,
    text: text.trim(),
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  const updates = {};
  const newPmKey = db.ref().child('user_pms').push().key;
  updates['/user_pms/' + user.uid + '/' + newPmKey] = pmData;
  updates['/user_pms/' + targetUid + '/' + newPmKey] = pmData;
  updates['/users/' + targetUid + '/unreadPMs'] = firebase.database.ServerValue.increment(1);

  db.ref().update(updates)
    .then(() => {
      if (typeof showBrowserNotif === 'function') {
        showBrowserNotif(`رسالة من ${currentUsername}`, text);
      }
      alert("تم إرسال الرسالة الخاصة بنجاح ✓");
      closePlayerMenu();
    })
    .catch(err => {
      console.error("خطأ في الخاص:", err);
      alert("فشل إرسال الرسالة.");
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
