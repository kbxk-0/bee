// ═══════════════════════════════════════════════
//  quick-chat.js — لوحة الرسائل الجاهزة
//  تظهر فوق صورة اللاعب (مو بالشات) — قابلة لإعادة الاستخدام
//  بكل الألعاب وبشات التحالف لاحقاً
// ═══════════════════════════════════════════════

const QUICK_MESSAGES = [
  'السلام عليكم 👋',
  'هلا والله 😄',
  'شكراً 🙏',
  'تسلم 💪',
  'يلا نلعب 🔥',
  'حظ سعيد للجميع 🍀',
  'لعب جميل 👏',
  'ما شاء الله عليك 👌',
  'هههههه 😂',
  'يا حظي 😭',
  'اممم 🤔',
  'صبروني دقيقة',
  'الله يعطيكم العافية 🌹',
  'مع السلامة 👋',
];

(function injectQuickChatStyles() {
  if (document.getElementById('qc-style')) return;
  const style = document.createElement('style');
  style.id = 'qc-style';
  style.textContent = `
    .qc-fab {
      position: fixed; z-index: 60;
      width: 46px; height: 46px; border-radius: 50%;
      background: linear-gradient(135deg,#1a3888,#0d2060);
      border: 1px solid rgba(200,169,64,.4);
      box-shadow: 0 4px 16px rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; cursor: pointer; user-select: none;
    }
    .qc-fab:active { transform: scale(0.92); }

    .qc-overlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0); pointer-events: none;
      display: flex; align-items: flex-end; justify-content: center;
      transition: background .2s;
    }
    .qc-overlay.show { background: rgba(0,0,0,.55); pointer-events: auto; }

    .qc-panel {
      width: min(420px, 94vw);
      margin-bottom: 14px;
      background: linear-gradient(135deg,#0d0d20,#12122e);
      border: 1px solid rgba(200,169,64,.35);
      border-radius: 20px 20px 8px 8px;
      padding: 14px 12px 16px;
      transform: translateY(30px); opacity: 0;
      transition: transform .25s, opacity .25s;
      direction: rtl; font-family: inherit;
      max-height: 60vh; overflow-y: auto;
    }
    .qc-overlay.show .qc-panel { transform: translateY(0); opacity: 1; }

    .qc-panel-title {
      color: #c8a940; font-weight: 900; font-size: .95rem;
      margin-bottom: 10px; text-align: center;
    }
    .qc-grid {
      display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
    }
    .qc-chip {
      background: rgba(200,169,64,.1);
      border: 1px solid rgba(200,169,64,.3);
      color: #fff; border-radius: 14px;
      padding: 9px 14px; font-size: .85rem;
      font-family: inherit; cursor: pointer;
      transition: background .15s, transform .1s;
    }
    .qc-chip:active { transform: scale(0.95); background: rgba(200,169,64,.25); }

    .qc-bubble {
      position: fixed; z-index: 9500;
      max-width: 160px;
      background: #fff; color: #1a0e00;
      border-radius: 14px; padding: 7px 12px;
      font-size: .78rem; font-weight: 700;
      text-align: center; direction: rtl;
      box-shadow: 0 6px 18px rgba(0,0,0,.35);
      opacity: 0; transform: translateY(8px) scale(0.85);
      transition: opacity .22s, transform .22s;
      pointer-events: none;
    }
    .qc-bubble::after {
      content: ''; position: absolute; left: 50%; bottom: -7px;
      transform: translateX(-50%);
      border: 7px solid transparent; border-top-color: #fff;
    }
    .qc-bubble.show { opacity: 1; transform: translateY(0) scale(1); }
  `;
  document.head.appendChild(style);
})();

// ── فتح/قفل لوحة الرسائل ──
function closeQuickChatPanel() {
  const ex = document.querySelector('.qc-overlay');
  if (ex) ex.remove();
}

function openQuickChatPanel(onPick) {
  closeQuickChatPanel();
  const overlay = document.createElement('div');
  overlay.className = 'qc-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeQuickChatPanel(); };

  const panel = document.createElement('div');
  panel.className = 'qc-panel';
  panel.innerHTML = `<div class="qc-panel-title">💬 رسائل جاهزة</div><div class="qc-grid"></div>`;
  const grid = panel.querySelector('.qc-grid');

  QUICK_MESSAGES.forEach(msg => {
    const chip = document.createElement('button');
    chip.className = 'qc-chip';
    chip.textContent = msg;
    chip.onclick = () => {
      closeQuickChatPanel();
      if (onPick) onPick(msg);
    };
    grid.appendChild(chip);
  });

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

// ── إظهار فقاعة كلام فوق عنصر معيّن (صورة لاعب/بوت) ──
function showQuickChatBubble(targetEl, text, duration = 2600) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const bubble = document.createElement('div');
  bubble.className = 'qc-bubble';
  bubble.textContent = text;
  document.body.appendChild(bubble);

  const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
  let left = rect.left + rect.width / 2 - bw / 2;
  left = Math.max(6, Math.min(left, window.innerWidth - bw - 6));
  let top = rect.top - bh - 12;
  if (top < 6) top = rect.bottom + 6; // لو ما فيه مكان فوق، اعرضها تحت

  bubble.style.left = left + 'px';
  bubble.style.top = top + 'px';

  requestAnimationFrame(() => bubble.classList.add('show'));
  setTimeout(() => {
    bubble.classList.remove('show');
    setTimeout(() => bubble.remove(), 220);
  }, duration);
}

// ── إنشاء زر عائم (FAB) يفتح اللوحة — استدعها مرة وحطها بأي مكان بالشاشة ──
function createQuickChatFab(style, onPick) {
  const btn = document.createElement('div');
  btn.className = 'qc-fab';
  btn.textContent = '💬';
  if (style) Object.assign(btn.style, style);
  btn.onclick = () => openQuickChatPanel(onPick);
  return btn;
}
