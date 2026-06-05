// ============================================================
//  js/inventory.js — bee platform
//  حقيبة اللاعب + تجديد المنتجات المنتهية
// ============================================================

function renderInventory() {
  const list = document.getElementById('inventory-list');
  if (!list || !auth.currentUser) return;
  list.innerHTML = '<div style="text-align:center;color:#888;padding:20px">جاري التحميل...</div>';

  db.ref('users/' + auth.currentUser.uid + '/inventory').once('value', snap => {
    const items = snap.val();

    if (!items) {
      list.innerHTML = `
        <div style="text-align:center;padding:50px 20px">
          <div style="font-size:48px;margin-bottom:12px">🎒</div>
          <div style="color:#888;font-size:14px;font-weight:700">حقيبتك فارغة</div>
          <button onclick="showSection('store')"
            style="margin-top:16px;padding:10px 24px;background:linear-gradient(135deg,#c8a940,#f0c040);
              color:#1a0e00;border:none;border-radius:10px;font-weight:900;cursor:pointer;font-family:inherit">
            اذهب للمتجر 🛒
          </button>
        </div>`;
      return;
    }

    const now      = Date.now();
    const entries  = Object.entries(items);
    const active   = entries.filter(([, v]) => !v.expires || v.expires > now);
    const expired  = entries.filter(([, v]) => v.expires && v.expires <= now);

    const renewPrices = { titles: 15, frames: 20, effects: 10, memberships: 50 };

    const renderItem = ([key, item], isExpired) => {
      const left  = item.expires ? item.expires - now : null;
      const days  = left !== null ? Math.ceil(left / (1000 * 60 * 60 * 24)) : null;
      const icons = { frame: '🖼️', effect: '✨', membership: '👑' };
      const icon  = icons[item.type] || '🏷️';

      const cat = key.startsWith('frame_')  ? 'frames'
                : key.startsWith('effect_') ? 'effects'
                : key.includes('VIP')       ? 'memberships'
                : 'titles';

      const renewPrice = renewPrices[cat] || 15;

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;
          background:${isExpired ? 'rgba(255,71,87,0.05)' : 'rgba(255,255,255,0.04)'};
          border:1px solid ${isExpired ? 'rgba(255,71,87,0.25)' : 'rgba(255,255,255,0.08)'};
          border-radius:14px;margin-bottom:8px;opacity:${isExpired ? '0.7' : '1'}">

          <div style="width:42px;height:42px;border-radius:12px;
            background:${isExpired ? 'rgba(255,71,87,0.1)' : 'rgba(200,169,64,0.1)'};
            display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
            ${icon}
          </div>

          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;
              color:${item.color || (isExpired ? '#ff4757' : '#f0e8d0')};
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${escapeHTML(key.replace('frame_','').replace('effect_',''))}
            </div>
            <div style="font-size:10px;margin-top:2px;
              color:${isExpired ? '#ff4757' : days !== null && days <= 3 ? '#fbbf24' : '#888'}">
              ${isExpired ? '⚠️ منتهي' : item.expires ? `⏳ ${days} يوم متبقي` : '♾️ دائم'}
            </div>
          </div>

          ${isExpired ? `
            <button onclick="renewItem('${key}','${cat}',${renewPrice})"
              style="background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0e00;border:none;
                border-radius:8px;font-size:11px;padding:7px 12px;cursor:pointer;
                font-weight:900;font-family:inherit;flex-shrink:0">
              🔄 تجديد<br><span style="font-size:9px">${renewPrice} 🪙</span>
            </button>` : item.expires && days <= 3 ? `
            <div style="font-size:9px;color:#fbbf24;text-align:center;flex-shrink:0;font-weight:700">
              ينتهي<br>قريباً!
            </div>` : ''}
        </div>`;
    };

    list.innerHTML = `
      ${active.length ? `
        <div style="font-size:11px;color:#888;margin-bottom:8px;padding:0 2px">
          ✅ النشطة (${active.length})
        </div>
        ${active.map(i => renderItem(i, false)).join('')}
      ` : ''}

      ${expired.length ? `
        <div style="font-size:11px;color:#ff4757;margin:12px 0 8px;padding:0 2px">
          ⚠️ المنتهية (${expired.length}) — جدّدها لتفعيلها
        </div>
        ${expired.map(i => renderItem(i, true)).join('')}
      ` : ''}`;
  });
}

function renewItem(itemKey, category, price) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < price) { alert('رصيدك غير كافٍ! تحتاج ' + price + ' 🪙'); return; }
  if (!confirm(`تجديد "${itemKey.replace('frame_','').replace('effect_','')}" مقابل ${price} 🪙؟`)) return;

  const durations = { titles: 30, frames: 30, effects: 7, memberships: 30 };
  const days      = durations[category] || 30;

  db.ref('users/' + user.uid).transaction(u => {
    if (!u || u.coins < price) return u;
    u.coins -= price;
    if (u.inventory && u.inventory[itemKey]) {
      const now = Date.now();
      const currentExpiry = u.inventory[itemKey].expires || now;
      // لو لسه ما انتهى، نضيف للوقت المتبقي
      const base = currentExpiry > now ? currentExpiry : now;
      u.inventory[itemKey].expires = base + days * 24 * 60 * 60 * 1000;
    }
    return u;
  }, (err, committed) => {
    if (committed) {
      if (typeof showToast === 'function') showToast(`✅ تم تجديد المنتج لـ ${days} يوم`);
      renderInventory();
    } else {
      alert('فشل التجديد، تحقق من رصيدك.');
    }
  });
}
