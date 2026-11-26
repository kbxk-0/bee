// ============================================================
//  js/utils.js — bee platform
//  أدوات مساعدة مشتركة تستخدمها جميع الملفات الأخرى
//  يُحمَّل بعد config.js مباشرةً
// ============================================================

// ===== متغيرات إضافية للمستخدم =====
// (savedAvatarColor تُحدَّث من auth.js عند تسجيل الدخول)
let savedAvatarColor = '';
let activeGame       = localStorage.getItem('activeGame') || null;

// ===== لون ثابت لكل مستخدم بناءً على اسمه =====
function getAvatarColor(name) {
  if (name === currentUsername && savedAvatarColor) return savedAvatarColor;
  const cols = ['#6c63ff','#ff6584','#2ed573','#ffd700','#00d2d3',
                '#ff4757','#a78bfa','#ff9f43','#1dd1a1','#54a0ff'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return cols[Math.abs(h) % cols.length];
}

// ===== بناء HTML للأفاتار =====
function avatarHTML(name, size = 36) {
  const col    = getAvatarColor(name);
  const letter = (name || '؟').charAt(0).toUpperCase();
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col};
    display:flex;align-items:center;justify-content:center;
    font-size:${Math.round(size * 0.42)}px;font-weight:bold;color:white;flex-shrink:0">
    ${letter}
  </div>`;
}

// ===== نظام المستويات والـ XP =====
// كل مستوى يحتاج خبرة أكثر من السابق بنسبة 60%
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.6, level - 1));
}

// تحقق من الترقي بشكل متكرر حتى يستقر المستوى
function checkLevelUp(u) {
  while (u.xp >= xpForLevel(u.level || 1)) {
    u.xp   -= xpForLevel(u.level || 1);
    u.level = (u.level || 1) + 1;
  }
  return u;
}

// ===== حد أعلى يومي/أسبوعي للخبرة — حماية من الاستغلال (نفس فلسفة جواكر) =====
const XP_DAILY_CAP  = 300;
const XP_WEEKLY_CAP = 1500;

function _todayKey() { return new Date().toISOString().slice(0, 10); } // 'YYYY-MM-DD'
function _weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + week;
}

// يضيف خبرة لكائن المستخدم مع احترام الحد اليومي/الأسبوعي — يرجع الكمية الفعلية المضافة
function addCappedXP(u, amount) {
  const tKey = _todayKey(), wKey = _weekKey();
  if (u.xpDayKey  !== tKey) { u.xpDayKey  = tKey; u.xpToday    = 0; }
  if (u.xpWeekKey !== wKey) { u.xpWeekKey = wKey; u.xpThisWeek = 0; }

  const dayLeft  = Math.max(0, XP_DAILY_CAP  - (u.xpToday    || 0));
  const weekLeft = Math.max(0, XP_WEEKLY_CAP - (u.xpThisWeek || 0));
  const grant    = Math.max(0, Math.min(amount, dayLeft, weekLeft));

  u.xp          = (u.xp || 0) + grant;
  u.xpToday     = (u.xpToday    || 0) + grant;
  u.xpThisWeek  = (u.xpThisWeek || 0) + grant;
  return grant;
}

// ===== إشعار منبثق (Toast) — يستخدم النظام الجديد من polish.js =====
function showToast(message, duration = 3000) {
  if (typeof Toast !== 'undefined') {
    Toast.show(message, 'info', duration);
    return;
  }
  // fallback قديم (يُستخدم فقط لو polish.js لم يُحمَّل)
  const old = document.getElementById('app-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#2a2000;border:1px solid rgba(200,169,64,0.5);color:#fbbf24;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:bold;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:inherit;text-align:center;max-width:80vw';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ============================================================
//  سجل "رجوع" بسيط داخل profile-modal — يحل مشكلة إن الإنجازات/
//  الأصدقاء/الإحالة/التجهيز كلها تتقاسم نفس النافذة بدون أي رجوع،
//  وكان زر "إغلاق" الوحيد يقفل كل شي ويرجعك للرئيسية مباشرة
// ============================================================
let _modalBackStack = [];

// يُستدعى من أي صفحة تُفتح "من الصفر" (مش من داخل نافذة مفتوحة أصلاً)
function resetModalStack() {
  _modalBackStack = [];
  updateModalBackButton();
}

// يُستدعى قبل ما أي دالة تستبدل محتوى profile-content، عشان نقدر نرجع له
function saveModalSnapshot() {
  const content = document.getElementById('profile-content');
  if (content) _modalBackStack.push(content.innerHTML);
  updateModalBackButton();
}

function goBackModal() {
  const content = document.getElementById('profile-content');
  if (_modalBackStack.length && content) {
    content.innerHTML = _modalBackStack.pop();
    updateModalBackButton();
  } else {
    closeProfileModal();
  }
}

function closeProfileModal() {
  _modalBackStack = [];
  const modal = document.getElementById('profile-modal');
  if (modal) modal.style.display = 'none';
  updateModalBackButton();
}

function updateModalBackButton() {
  const btn = document.getElementById('modal-back-btn');
  if (btn) btn.style.display = _modalBackStack.length ? 'flex' : 'none';
}

// ============================================================
//  popup سلسلة تسجيل الدخول اليومي
// ============================================================

function showDailyLoginPopup(streak, reward) {
  document.getElementById('dailylogin-popup')?.remove();

  const ladder     = [20, 30, 40, 60, 80, 120, 200];
  const dayInCycle = ((streak - 1) % ladder.length) + 1; // 1..7

  const popup = document.createElement('div');
  popup.id    = 'dailylogin-popup';
  popup.style.cssText = `
    position:fixed;inset:0;z-index:99998;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);
    animation:fadeIn .3s ease;font-family:inherit;direction:rtl;
  `;

  const daysHTML = ladder.map((amt, i) => {
    const dayNum  = i + 1;
    const isPast  = dayNum < dayInCycle;
    const isToday = dayNum === dayInCycle;
    return `
      <div style="flex:1;text-align:center;opacity:${isPast || isToday ? '1' : '0.4'}">
        <div style="width:36px;height:36px;margin:0 auto 4px;border-radius:10px;
          display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;
          background:${isToday ? 'linear-gradient(135deg,#c8a940,#f0c040)' : isPast ? 'rgba(200,169,64,0.15)' : 'rgba(255,255,255,0.05)'};
          border:2px solid ${isToday ? '#f0c040' : isPast ? 'rgba(200,169,64,0.3)' : 'rgba(255,255,255,0.1)'};
          color:${isToday ? '#1a0e00' : '#c8a940'}">
          ${isPast ? '✓' : amt}
        </div>
        <div style="font-size:8px;color:#888">يوم ${dayNum}</div>
      </div>`;
  }).join('');

  popup.innerHTML = `
    <div style="background:linear-gradient(135deg,#0d0d20,#1a1030);
      border:2px solid rgba(200,169,64,0.6);border-radius:28px;padding:28px 22px;
      text-align:center;max-width:320px;width:90%;
      animation:popIn .4s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 0 60px rgba(200,169,64,0.3)">

      <div style="font-size:48px;margin-bottom:8px;filter:drop-shadow(0 0 16px rgba(200,169,64,0.7))">🔥</div>
      <div style="font-size:13px;color:#c8a940;font-weight:700;margin-bottom:4px;letter-spacing:1px">
        سلسلة تسجيل الدخول
      </div>
      <div style="font-size:30px;font-weight:900;color:#f0e8d0;margin-bottom:18px">يوم ${streak}</div>

      <div style="display:flex;gap:5px;margin-bottom:18px">${daysHTML}</div>

      <div style="background:rgba(200,169,64,0.1);border:1px solid rgba(200,169,64,0.3);
        border-radius:14px;padding:12px;margin-bottom:18px">
        <div style="font-size:11px;color:#888;margin-bottom:4px">مكافأة اليوم</div>
        <div style="font-size:20px;font-weight:900;color:#fbbf24">🪙 +${reward} كوينز</div>
      </div>

      <button onclick="document.getElementById('dailylogin-popup').remove()"
        style="width:100%;padding:13px;background:linear-gradient(135deg,#c8a940,#f0c040);
          color:#1a0e00;border:none;border-radius:14px;font-weight:900;font-size:14px;
          cursor:pointer;font-family:inherit">
        شكراً! 🎉
      </button>
    </div>`;

  document.body.appendChild(popup);
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  setTimeout(() => popup?.remove(), 8000);
}

function showLevelUpPopup(newLevel) {
  // أزل أي popup قديم
  document.getElementById('levelup-popup')?.remove();

  const rewards = [50,75,100,125,150,200,250,300,400,500];
  const bonus   = rewards[Math.min(newLevel - 2, rewards.length - 1)] || 50;

  const popup = document.createElement('div');
  popup.id    = 'levelup-popup';
  popup.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);
    animation:fadeIn .3s ease;
  `;

  popup.innerHTML = `
    <style>
      @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes popIn   { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-60px);opacity:0} }
      .confetti-piece {
        position:absolute;width:8px;height:8px;border-radius:2px;
        animation:floatUp 1.2s ease forwards;
      }
    </style>

    <div style="
      background:linear-gradient(135deg,#0d0d20,#1a1030);
      border:2px solid rgba(200,169,64,0.6);
      border-radius:28px;padding:32px 28px;text-align:center;
      max-width:300px;width:90%;position:relative;overflow:hidden;
      animation:popIn .4s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow:0 0 60px rgba(200,169,64,0.3);
    " id="levelup-box">

      <!-- كونفيتي -->
      <div id="confetti-container" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>

      <!-- النجمة -->
      <div style="font-size:64px;margin-bottom:8px;filter:drop-shadow(0 0 20px rgba(200,169,64,0.8))">⭐</div>

      <!-- ترقيت للمستوى -->
      <div style="font-size:13px;color:#c8a940;font-weight:700;margin-bottom:6px;letter-spacing:2px">
        تهانيّ! ترقيت إلى
      </div>
      <div style="font-size:52px;font-weight:900;
        background:linear-gradient(135deg,#c8a940,#f0c040,#fff,#f0c040);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;
        background-clip:text;line-height:1;margin-bottom:4px">
        ${newLevel}
      </div>
      <div style="font-size:16px;color:#f0e8d0;font-weight:900;margin-bottom:20px">
        المستوى ${newLevel}
      </div>

      <!-- المكافأة -->
      <div style="background:rgba(200,169,64,0.1);border:1px solid rgba(200,169,64,0.3);
        border-radius:14px;padding:12px;margin-bottom:20px">
        <div style="font-size:11px;color:#888;margin-bottom:4px">مكافأة الترقي</div>
        <div style="font-size:20px;font-weight:900;color:#fbbf24">🪙 +${bonus} كوينز</div>
      </div>

      <button onclick="document.getElementById('levelup-popup').remove()"
        style="width:100%;padding:13px;background:linear-gradient(135deg,#c8a940,#f0c040);
          color:#1a0e00;border:none;border-radius:14px;font-weight:900;font-size:14px;
          cursor:pointer;font-family:inherit">
        رائع! 🎉
      </button>
    </div>`;

  document.body.appendChild(popup);

  // إغلاق بالضغط خارج الصندوق
  popup.addEventListener('click', e => {
    if (e.target === popup) popup.remove();
  });

  // كونفيتي
  const colors = ['#c8a940','#f0c040','#ff6584','#6c63ff','#2ed573','#ff9f43'];
  const container = document.getElementById('confetti-container');
  if (container) {
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left:${Math.random() * 100}%;
        top:${80 + Math.random() * 20}%;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        animation-delay:${Math.random() * 0.6}s;
        animation-duration:${0.8 + Math.random() * 0.8}s;
        transform:rotate(${Math.random() * 360}deg);
      `;
      container.appendChild(piece);
    }
  }

  // إغلاق تلقائي بعد 5 ثواني
  setTimeout(() => popup?.remove(), 5000);
}
