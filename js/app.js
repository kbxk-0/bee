// ============================================================
//  js/app.js — bee platform
//  الملف الرئيسي — يُحمَّل قبل auth.js مباشرةً
//  بعد التقسيم: يحتوي على دوال مساعدة لم تنتقل لملف محدد
// ============================================================

// ===== دوال مساعدة للمتجر (تبقى هنا لارتباطها بعدة ملفات) =====
function buyFrame(name, gradient, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { alert('لا تملك كوينز كافية!'); return; }
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
  }, (e, ok) => { if (ok) { alert(`🎉 حصلت على ${name}!`); if (typeof renderStore === 'function') renderStore(); } });
}

function buyEffect(name, icon, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { alert('لا تملك كوينز كافية!'); return; }
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
  }, (e, ok) => { if (ok) { alert(`🎉 حصلت على تأثير ${name}!`); if (typeof renderStore === 'function') renderStore(); } });
}

function buyTitle(name, color, cost) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < cost) { alert('لا تملك كوينز كافية!'); return; }
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
  }, (e, ok) => { if (ok) { alert(`مبروك! حصلت على لقب ‹${name}› 🎉`); if (typeof renderStore === 'function') renderStore(); } });
}
