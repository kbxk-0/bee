// ═══════════════════════════════════════════════
//  stickers.js — مكتبة الستيكرات المتحركة
//  رسوم متجهة + إيموجي أصلية بحركة وصوت — بدون أي شخصيات
//  حقيقية أو محتوى محمي. قابلة لإعادة الاستخدام بكل الألعاب
//  وشات التحالف.
// ═══════════════════════════════════════════════

const STICKER_TYPES = [
  { id: 'goal',  icon: '⚽', label: 'قووول' },
  { id: 'fire',  icon: '🔥', label: 'نار' },
  { id: 'laugh', icon: '😂', label: 'ضحك' },
  { id: 'angry', icon: '😡', label: 'غضب' },
  { id: 'money', icon: '💰', label: 'فلوس' },
  { id: 'crown', icon: '👑', label: 'فايز' },
  { id: 'cry',   icon: '😭', label: 'بكاء' },
  { id: 'sleep', icon: '💤', label: 'ملل' },
];

const STICKER_DURATION = {
  goal: 2200, fire: 2000, laugh: 1900, angry: 1900,
  money: 2200, crown: 2200, cry: 2000, sleep: 2400,
};

(function injectStickerStyles() {
  if (document.getElementById('stk-style')) return;
  const style = document.createElement('style');
  style.id = 'stk-style';
  style.textContent = `
    .stk-fab {
      position: fixed; z-index: 60;
      width: 46px; height: 46px; border-radius: 50%;
      background: linear-gradient(135deg,#7a1a1a,#3a0d0d);
      border: 1px solid rgba(200,169,64,.4);
      box-shadow: 0 4px 16px rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; cursor: pointer; user-select: none;
    }
    .stk-fab:active { transform: scale(0.92); }

    .stk-overlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0); pointer-events: none;
      display: flex; align-items: flex-end; justify-content: center;
      transition: background .2s;
    }
    .stk-overlay.show { background: rgba(0,0,0,.55); pointer-events: auto; }

    .stk-panel {
      width: min(420px, 94vw); margin-bottom: 14px;
      background: linear-gradient(135deg,#0d0d20,#12122e);
      border: 1px solid rgba(200,169,64,.35);
      border-radius: 20px 20px 8px 8px;
      padding: 14px 12px 16px;
      transform: translateY(30px); opacity: 0;
      transition: transform .25s, opacity .25s;
      direction: rtl; font-family: inherit;
    }
    .stk-overlay.show .stk-panel { transform: translateY(0); opacity: 1; }
    .stk-panel-title { color:#c8a940; font-weight:900; font-size:.95rem; margin-bottom:12px; text-align:center; }
    .stk-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    .stk-pick {
      background: rgba(200,169,64,.1);
      border: 1px solid rgba(200,169,64,.3);
      border-radius: 14px; padding: 12px 4px;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      cursor: pointer; transition: background .15s, transform .1s;
    }
    .stk-pick:active { transform: scale(0.93); background: rgba(200,169,64,.25); }
    .stk-pick .ic { font-size: 28px; }
    .stk-pick .lb { font-size: .68rem; color: #fff; }

    /* ── حاوية ظهور الستيكر فوق صورة اللاعب ── */
    .stk-anchor {
      position: fixed; z-index: 9500; pointer-events: none;
      opacity: 0; transition: opacity .2s;
    }
    .stk-anchor.show { opacity: 1; }

    .stk-cap {
      margin-top: 2px; font-weight: 900; font-size: .8rem; color: #fff;
      text-shadow: 0 2px 6px rgba(0,0,0,.75); opacity: 0; text-align: center;
      animation: stk-capIn .3s .3s ease-out forwards;
    }
    @keyframes stk-capIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes stk-pop   { 0%{opacity:0;transform:translateX(-50%) scale(.3)} 60%{opacity:1;transform:translateX(-50%) scale(1.2)} 100%{opacity:1;transform:translateX(-50%) scale(1)} }
    @keyframes stk-shake { 0%,100%{transform:translateX(-50%) rotate(0)} 25%{transform:translateX(-50%) rotate(-4deg)} 75%{transform:translateX(-50%) rotate(4deg)} }

    /* قووول */
    .stk-goal { position:relative; width:128px; height:120px; }
    .stk-goal-net { position:absolute; top:0; right:8px; font-size:32px; }
    .stk-goal-ball { position:absolute; font-size:26px; left:6px; bottom:6px; animation: stk-ball-fly .6s ease-in forwards; }
    @keyframes stk-ball-fly { 0%{left:6px;bottom:6px;transform:rotate(0)} 70%{left:58px;bottom:62px;transform:rotate(420deg)} 100%{left:66px;bottom:68px;transform:rotate(480deg) scale(.85);opacity:0} }
    .stk-goal-cap { position:absolute; bottom:-4px; left:50%; transform:translateX(-50%); font-size:1.05rem; color:#f0c040;
      animation: stk-pop .4s .55s ease-out forwards, stk-shake .35s .95s ease-in-out 2; opacity:0; }

    /* نار */
    .stk-fire { position:relative; width:110px; height:110px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .stk-fire-flame { font-size:54px; animation: stk-flicker .35s ease-in-out infinite alternate; }
    @keyframes stk-flicker { 0%{transform:scale(1) rotate(-3deg)} 100%{transform:scale(1.14) rotate(3deg)} }
    .stk-spark { position:absolute; font-size:14px; opacity:0; animation: stk-spark-rise 1.3s ease-out infinite; }
    @keyframes stk-spark-rise { 0%{opacity:0;transform:translateY(0) scale(.6)} 30%{opacity:1} 100%{opacity:0;transform:translateY(-46px) scale(1.1)} }

    /* ضحك */
    .stk-laugh { display:flex; flex-direction:column; align-items:center; width:110px; }
    .stk-laugh-face { font-size:54px; animation: stk-rock .3s ease-in-out infinite; }
    @keyframes stk-rock { 0%,100%{transform:rotate(-13deg) translateY(0)} 50%{transform:rotate(13deg) translateY(-6px)} }

    /* غضب */
    .stk-angry { position:relative; width:110px; height:110px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .stk-angry-face { font-size:54px; animation: stk-jitter .12s linear infinite; }
    @keyframes stk-jitter { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px) rotate(-2deg)} 75%{transform:translateX(3px) rotate(2deg)} }
    .stk-smoke { position:absolute; font-size:16px; opacity:0; animation: stk-smoke-rise 1.3s ease-out infinite; }
    @keyframes stk-smoke-rise { 0%{opacity:0;transform:translateY(0) scale(.7)} 30%{opacity:.9} 100%{opacity:0;transform:translateY(-38px) scale(1.3)} }

    /* فلوس */
    .stk-money { position:relative; width:120px; height:120px; }
    .stk-bill { position:absolute; font-size:24px; top:-10px; opacity:0; animation: stk-fall 1.3s ease-in forwards; }
    @keyframes stk-fall { 0%{opacity:0;transform:translateY(0) rotate(0)} 15%{opacity:1} 100%{opacity:1;transform:translateY(95px) rotate(210deg)} }

    /* تاج */
    .stk-crown { position:relative; width:110px; height:110px; display:flex; align-items:center; justify-content:center; }
    .stk-crown-icon { font-size:56px; opacity:0; animation: stk-crownpop .5s ease-out forwards; }
    @keyframes stk-crownpop { 0%{opacity:0;transform:scale(.3) rotate(-15deg)} 65%{opacity:1;transform:scale(1.2) rotate(5deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }

    /* بكاء */
    .stk-cry { position:relative; width:110px; height:110px; display:flex; align-items:center; justify-content:center; }
    .stk-cry-face { font-size:54px; animation: stk-sob .5s ease-in-out infinite; }
    @keyframes stk-sob { 0%,100%{transform:rotate(-4deg) translateY(0)} 50%{transform:rotate(4deg) translateY(3px)} }
    .stk-drop { position:absolute; font-size:16px; opacity:0; animation: stk-drop-fall 1.1s ease-in infinite; }
    @keyframes stk-drop-fall { 0%{opacity:0;transform:translateY(0)} 20%{opacity:1} 100%{opacity:0;transform:translateY(40px)} }

    /* نوم/ملل */
    .stk-sleep { position:relative; width:110px; height:110px; display:flex; align-items:center; justify-content:center; }
    .stk-sleep-face { font-size:54px; animation: stk-bob 1.6s ease-in-out infinite; }
    @keyframes stk-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    .stk-z { position:absolute; color:#9fc8ff; font-weight:900; opacity:0; animation: stk-z-float 1.8s ease-out infinite; }
    @keyframes stk-z-float { 0%{opacity:0;transform:translate(0,0)} 25%{opacity:1} 100%{opacity:0;transform:translate(18px,-24px)} }
  `;
  document.head.appendChild(style);
})();

// ── محتوى كل ستيكر ──
function stickerMarkup(id) {
  switch (id) {
    case 'goal': return `
      <div class="stk-goal">
        <div class="stk-goal-net">🥅</div>
        <div class="stk-goal-ball">⚽</div>
        <div class="stk-goal-cap">GOOOAL! 🎉</div>
      </div>`;
    case 'fire': return `
      <div class="stk-fire">
        <div class="stk-fire-flame">🔥</div>
        <div class="stk-spark" style="left:18px;bottom:26px;animation-delay:.1s">✨</div>
        <div class="stk-spark" style="right:16px;bottom:36px;animation-delay:.5s">✨</div>
        <div class="stk-cap">تسلم! 🔥</div>
      </div>`;
    case 'laugh': return `
      <div class="stk-laugh">
        <div class="stk-laugh-face">😂</div>
        <div class="stk-cap">ههههههه</div>
      </div>`;
    case 'angry': return `
      <div class="stk-angry">
        <div class="stk-angry-face">😡</div>
        <div class="stk-smoke" style="left:14px;top:4px;animation-delay:0s">💨</div>
        <div class="stk-smoke" style="right:14px;top:0;animation-delay:.45s">💨</div>
      </div>`;
    case 'money': return `
      <div class="stk-money">
        <div class="stk-bill" style="left:6px;animation-delay:0s">💵</div>
        <div class="stk-bill" style="left:46px;animation-delay:.25s">💵</div>
        <div class="stk-bill" style="left:84px;font-size:28px;animation-delay:.5s">💰</div>
        <div class="stk-cap" style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%)">فلوووس! 💰</div>
      </div>`;
    case 'crown': return `
      <div class="stk-crown">
        <div class="stk-crown-icon">👑</div>
        <div class="stk-spark" style="left:6px;top:14px;animation-delay:.5s">✨</div>
        <div class="stk-spark" style="right:6px;top:18px;animation-delay:.8s">✨</div>
        <div class="stk-cap" style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%)">الفايز! 👑</div>
      </div>`;
    case 'cry': return `
      <div class="stk-cry">
        <div class="stk-cry-face">😭</div>
        <div class="stk-drop" style="left:28px;top:48px;animation-delay:0s">💧</div>
        <div class="stk-drop" style="right:24px;top:44px;animation-delay:.4s">💧</div>
      </div>`;
    case 'sleep': return `
      <div class="stk-sleep">
        <div class="stk-sleep-face">😴</div>
        <div class="stk-z" style="font-size:13px;right:30px;top:28px;animation-delay:0s">z</div>
        <div class="stk-z" style="font-size:19px;right:18px;top:16px;animation-delay:.5s">Z</div>
        <div class="stk-z" style="font-size:25px;right:2px;top:0;animation-delay:1s">z</div>
      </div>`;
    default: return '';
  }
}

// ── صوت كل ستيكر (سينث Web Audio خفيف ومستقل) ──
function playStickerSound(id) {
  try {
    if (!playStickerSound._ctx) {
      playStickerSound._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = playStickerSound._ctx;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const tone = (freq, wave, vol, start, dur, endFreq) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = wave; osc.frequency.setValueAtTime(freq, start);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.start(start); osc.stop(start + dur + 0.02);
    };

    if (id === 'goal') {
      tone(120, 'sawtooth', 0.4, t, 0.12);
      [[523, .15], [659, .25], [784, .35], [1047, .46]].forEach(([f, d]) => tone(f, 'sine', 0.4, t + d, 0.2));
    } else if (id === 'fire') {
      tone(900, 'sawtooth', 0.25, t, 0.3, 200);
    } else if (id === 'laugh') {
      [[500, 0], [650, .12], [500, .24]].forEach(([f, d]) => tone(f, 'square', 0.25, t + d, 0.1));
    } else if (id === 'angry') {
      tone(140, 'sawtooth', 0.3, t, 0.35, 90);
    } else if (id === 'money') {
      for (let i = 0; i < 5; i++) tone(900 + i * 120, 'sine', 0.25, t + i * .08, 0.09);
    } else if (id === 'crown') {
      tone(1200, 'triangle', 0.3, t, 0.2);
      tone(1600, 'triangle', 0.25, t + .15, 0.25);
    } else if (id === 'cry') {
      [[400, 0], [340, .18], [280, .36], [220, .55]].forEach(([f, d]) => tone(f, 'sawtooth', 0.25, t + d, 0.25));
    } else if (id === 'sleep') {
      tone(300, 'sine', 0.15, t, 0.5);
      tone(220, 'sine', 0.12, t + .4, 0.6);
    }
  } catch (e) {}
}

// ── تشغيل الستيكر فوق عنصر معيّن (صورة لاعب/بوت) ──
function playSticker(id, targetEl) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const wrap = document.createElement('div');
  wrap.className = 'stk-anchor';
  wrap.innerHTML = stickerMarkup(id);
  document.body.appendChild(wrap);

  const ww = wrap.offsetWidth, wh = wrap.offsetHeight;
  let left = rect.left + rect.width / 2 - ww / 2;
  left = Math.max(4, Math.min(left, window.innerWidth - ww - 4));
  let top = rect.top - wh - 6;
  if (top < 4) top = rect.bottom + 6;
  wrap.style.left = left + 'px';
  wrap.style.top = top + 'px';

  requestAnimationFrame(() => wrap.classList.add('show'));
  playStickerSound(id);

  const dur = STICKER_DURATION[id] || 2000;
  setTimeout(() => {
    wrap.classList.remove('show');
    setTimeout(() => wrap.remove(), 250);
  }, dur);
}

// ── لوحة اختيار الستيكر ──
function closeStickerPanel() {
  const ex = document.querySelector('.stk-overlay');
  if (ex) ex.remove();
}

function openStickerPanel(onPick) {
  closeStickerPanel();
  const overlay = document.createElement('div');
  overlay.className = 'stk-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeStickerPanel(); };

  const panel = document.createElement('div');
  panel.className = 'stk-panel';
  panel.innerHTML = `<div class="stk-panel-title">🎉 ستيكرات</div><div class="stk-grid"></div>`;
  const grid = panel.querySelector('.stk-grid');

  STICKER_TYPES.forEach(s => {
    const pick = document.createElement('div');
    pick.className = 'stk-pick';
    pick.innerHTML = `<span class="ic">${s.icon}</span><span class="lb">${s.label}</span>`;
    pick.onclick = () => {
      closeStickerPanel();
      if (onPick) onPick(s.id);
    };
    grid.appendChild(pick);
  });

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

// ── زر عائم يفتح لوحة الستيكرات ──
function createStickerFab(style, onPick) {
  const btn = document.createElement('div');
  btn.className = 'stk-fab';
  btn.textContent = '🎉';
  if (style) Object.assign(btn.style, style);
  btn.onclick = () => openStickerPanel(onPick);
  return btn;
}
