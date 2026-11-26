// ============================================================
//  js/app.js — bee platform
//  الملف الرئيسي — يُحمَّل قبل auth.js مباشرةً
//  بعد التقسيم: يحتوي على دوال مساعدة لم تنتقل لملف محدد
// ============================================================

// ===== دوال مساعدة للمتجر (تبقى هنا لارتباطها بعدة ملفات) =====
(function() {
  const safeProxy = new Proxy({}, {
    get: (target, prop) => {
      const base = window.BeeEffects || {};
      if (typeof base[prop] === 'function') return base[prop].bind(base);
      if (prop in base) return base[prop];
      return () => {}; // إرجاع دالة فارغة تلقائياً لمنع خطأ is not a function
    }
  });

  Object.defineProperty(window, 'Effects', {
    get: () => safeProxy,
    set: (v) => { 
      if (v && typeof v === 'object') {
        window.BeeEffects = Object.assign(window.BeeEffects || {}, v);
      }
    },
    configurable: true
  });
})();
function buyFrame(name, gradient, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { Sounds.play('error'); Haptic.error(); Toast.show('لا تملك كوينز كافية!', 'error'); return; }
  db.ref('users/' + user.uid).transaction(u => {
    if (u && u.coins >= cost) {
      u.coins -= cost;
      if (!u.inventory) u.inventory = {};
      u.inventory['frame_' + name] = {
        type: 'frame', name, gradient,
        acquired: Date.now(),
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000
      };
    }
    return u;
  }, (e, ok) => { if (ok) { Sounds.play('purchase'); Haptic.success(); setTimeout(() => Sounds.play('coins'), 350); Toast.show(`🎉 حصلت على ${name}!`, 'gold'); if (typeof renderStore === 'function') renderStore(); } });
}

function buyEffect(name, icon, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { Sounds.play('error'); Haptic.error(); Toast.show('لا تملك كوينز كافية!', 'error'); return; }
  db.ref('users/' + user.uid).transaction(u => {
    if (u && u.coins >= cost) {
      u.coins -= cost;
      if (!u.inventory) u.inventory = {};
      u.inventory['effect_' + name] = {
        type: 'effect', name, icon,
        acquired: Date.now(),
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000
      };
    }
    return u;
  }, (e, ok) => { if (ok) { Sounds.play('purchase'); Haptic.success(); setTimeout(() => Sounds.play('coins'), 350); Toast.show(`🎉 حصلت على تأثير ${name}!`, 'gold'); if (typeof renderStore === 'function') renderStore(); } });
}

function buyTitle(name, color, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { Sounds.play('error'); Haptic.error(); Toast.show('لا تملك كوينز كافية!', 'error'); return; }
  db.ref('users/' + user.uid).transaction(u => {
    if (u && u.coins >= cost) {
      u.coins -= cost; u.title = name; u.titleColor = color;
      if (!u.inventory) u.inventory = {};
      u.inventory[name] = {
        acquired: Date.now(),
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
        color
      };
    }
    return u;
  }, (e, ok) => { if (ok) { Sounds.play('purchase'); Haptic.success(); setTimeout(() => Sounds.play('coins'), 350); Toast.show(`مبروك! حصلت على لقب ‹${name}› 🎉`, 'gold'); if (typeof renderStore === 'function') renderStore(); } });
}

// ===== إدارة بنر تثبيت التطبيق (PWA Install) =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function triggerPWAInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('وافق المستخدم على التثبيت');
      }
      deferredPrompt = null;
    });
  }
}
// ربط مكتبة التأثيرات بالاسم المطلوب في المتجر
window.Effects = window.BeeEffects || {};