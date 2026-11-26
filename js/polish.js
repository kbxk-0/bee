// ================================================================
// 💎 polish.js — التفاصيل الاحترافية لتطبيق bee
// Toast Notifications · Haptic Feedback · Skeleton Loading
// ================================================================
//
// الاستخدام:
//   Toast.show('رسالة', 'gold')      ← أنواع: gold success error info warning
//   Toast.show('رسالة', 'error', 4000)  ← مدة مخصصة (ms)
//   Haptic.light() / Haptic.success() / Haptic.error()
//   Skeleton.create('100%', '48px', '12px')  ← عنصر تحميل
//   Skeleton.clear(container)               ← إزالة الـ skeletons
// ================================================================

// ── Toast Notifications ─────────────────────────────────────────
const Toast = (() => {

  const ICONS = {
    gold:    '🎉',
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    '💬'
  };

  const STYLE = {
    gold:    { border: 'rgba(200,169,64,0.55)', bg: 'rgba(24,18,2,0.92)',  bar: '#f0c040' },
    success: { border: 'rgba(5,150,105,0.5)',   bg: 'rgba(2,20,10,0.92)',  bar: '#10b981' },
    error:   { border: 'rgba(220,38,38,0.5)',   bg: 'rgba(20,2,2,0.92)',   bar: '#ef4444' },
    warning: { border: 'rgba(245,158,11,0.5)',  bg: 'rgba(20,14,2,0.92)',  bar: '#f59e0b' },
    info:    { border: 'rgba(99,102,241,0.5)',  bg: 'rgba(8,8,22,0.92)',   bar: '#818cf8' }
  };

  let box;

  const getBox = () => {
    if (!box || !document.contains(box)) {
      box = document.createElement('div');
      box.id = 'toast-box';
      box.style.cssText = [
        'position:fixed',
        'top:18px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:99998',
        'display:flex',
        'flex-direction:column',
        'gap:8px',
        'align-items:center',
        'width:calc(100% - 32px)',
        'max-width:330px',
        'pointer-events:none'
      ].join(';');
      document.body.appendChild(box);
    }
    return box;
  };

  const dismiss = toast => {
    if (!toast?.parentNode) return;
    clearTimeout(toast._t);
    toast.style.animation = 'toastOut 0.25s ease forwards';
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const show = (msg, type = 'info', duration = 3200) => {
    const s = STYLE[type] ?? STYLE.info;

    const toast = document.createElement('div');
    toast.style.cssText = [
      `background:${s.bg}`,
      'backdrop-filter:blur(24px)',
      '-webkit-backdrop-filter:blur(24px)',
      `border:1px solid ${s.border}`,
      'border-radius:14px',
      'padding:13px 15px',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'width:100%',
      'pointer-events:all',
      'cursor:pointer',
      'position:relative',
      'overflow:hidden',
      'box-shadow:0 10px 40px rgba(0,0,0,0.6)',
      'animation:toastIn 0.32s cubic-bezier(0.22,1,0.36,1) forwards'
    ].join(';');

    // أيقونة
    const ic = document.createElement('span');
    ic.textContent = ICONS[type] ?? '';
    ic.style.cssText = 'font-size:17px;flex-shrink:0;line-height:1';

    // نص
    const tx = document.createElement('span');
    tx.textContent = msg;
    tx.style.cssText = [
      'font-family:Cairo,sans-serif',
      'font-size:13px',
      'font-weight:600',
      'color:#f0e8d0',
      'direction:rtl',
      'flex:1',
      'line-height:1.45'
    ].join(';');

    // شريط تقدم
    const bar = document.createElement('div');
    bar.style.cssText = [
      'position:absolute',
      'bottom:0',
      'right:0',
      'height:2.5px',
      `background:${s.bar}`,
      'width:100%',
      `animation:toastBar ${duration}ms linear forwards`,
      'border-radius:0 0 14px 14px'
    ].join(';');

    toast.append(ic, tx, bar);
    toast.addEventListener('click', () => dismiss(toast));
    getBox().appendChild(toast);

    // اهتزاز
    if      (type === 'error')               Haptic.error();
    else if (type === 'gold' || type === 'success') Haptic.success();
    else                                     Haptic.light();

    toast._t = setTimeout(() => dismiss(toast), duration);
    return toast;
  };

  return { show, dismiss };

})();

// ── Haptic Feedback ─────────────────────────────────────────────
const Haptic = {
  light:   () => navigator.vibrate?.(8),
  medium:  () => navigator.vibrate?.(18),
  heavy:   () => navigator.vibrate?.(32),
  success: () => navigator.vibrate?.([8, 55, 8]),
  error:   () => navigator.vibrate?.([22, 60, 22]),
  double:  () => navigator.vibrate?.([10, 45, 10])
};

// ── Skeleton Loading ────────────────────────────────────────────
const Skeleton = {

  // أنشئ عنصر skeleton
  create(w = '100%', h = '20px', radius = '8px') {
    const el = document.createElement('div');
    el.className = 'skeleton-pulse';
    el.style.cssText = `width:${w};height:${h};border-radius:${radius};`;
    return el;
  },

  // بناء هيكل skeleton لبطاقة لاعب
  card() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:14px;display:flex;flex-direction:column;gap:10px;';
    wrap.append(
      this.create('100%', '44px', '10px'),
      this.create('70%',  '14px', '6px'),
      this.create('50%',  '12px', '6px')
    );
    return wrap;
  },

  // إزالة كل الـ skeletons من حاوية
  clear(container) {
    container?.querySelectorAll('.skeleton-pulse').forEach(s => s.remove());
  }
};

window.Toast    = Toast;
window.Haptic   = Haptic;
window.Skeleton = Skeleton;
