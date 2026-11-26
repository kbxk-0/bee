// ============================================================
//  js/inventory.js — bee platform
//  حقيبة اللاعب + تجديد المنتجات المنتهية
// ============================================================

// ===== صياغة الوقت المتبقي: أيام/ساعات وقت بعيد، عد تنازلي حي ساعة:دقيقة:ثانية بآخر يوم =====
function formatTimeLeft(ms) {
  if (ms <= 0) return 'انتهى';
  const totalSec = Math.floor(ms / 1000);
  const days  = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  const secs  = totalSec % 60;
  if (days >= 1) return `⏳ ${days} يوم ${hours} ساعة متبقية`;
  const pad = n => String(n).padStart(2, '0');
  return `⏰ ${pad(hours)}:${pad(mins)}:${pad(secs)} متبقي`;
}

function renderInventory() {
  const list = document.getElementById('inventory-list');
  if (!list || !auth.currentUser) return;
  list.innerHTML = '<div style="text-align:center;color:#888;padding:20px">جاري التحميل...</div>';
  clearInterval(window._invCountdownTimer); // نوقف أي عداد قديم قبل لا نبني واحد جديد

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
            <div id="countdown-${key}" style="font-size:10px;margin-top:2px;
              color:${isExpired ? '#ff4757' : days !== null && days <= 3 ? '#fbbf24' : '#888'}">
              ${isExpired ? '⚠️ منتهي' : item.expires ? formatTimeLeft(left) : '♾️ دائم'}
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
      ` : ''}

      <div style="font-size:11px;color:#888;margin:18px 0 8px;padding:0 2px">📜 سجل المشتريات</div>
      <div id="purchase-history-list"></div>`;

    loadPurchaseHistory();

    // عداد حي يحدّث الوقت المتبقي لكل منتج نشط له صلاحية — وينقل أي منتج
    // انتهى فعلياً (وصل صفر) تلقائياً لقسم "المنتهية" بدون ما تحتاج تحدّث الصفحة
    const activeWithExpiry = active.filter(([, item]) => item.expires);
    if (activeWithExpiry.length) {
      window._invCountdownTimer = setInterval(() => {
        let anyJustExpired = false;
        activeWithExpiry.forEach(([key, item]) => {
          const el = document.getElementById('countdown-' + key);
          if (!el) return;
          const msLeft = item.expires - Date.now();
          if (msLeft <= 0) { anyJustExpired = true; }
          else el.textContent = formatTimeLeft(msLeft);
        });
        if (anyJustExpired) renderInventory(); // يعيد البناء فينتقل المنتج لقسم "المنتهية" تلقائياً
      }, 1000);
    }
  });
}

// ===== سجل المشتريات بالتاريخ — منفصل عن الحقيبة، يبقى محفوظ حتى بعد انتهاء المنتج =====
function loadPurchaseHistory() {
  const box = document.getElementById('purchase-history-list');
  if (!box || !auth.currentUser) return;
  box.innerHTML = '<div style="text-align:center;color:#555;padding:10px;font-size:11px">جاري التحميل...</div>';

  db.ref('purchase_history/' + auth.currentUser.uid).limitToLast(30).once('value', snap => {
    const entries = [];
    snap.forEach(child => entries.push(child.val()));
    entries.reverse(); // الأحدث أول

    if (!entries.length) {
      box.innerHTML = `<div style="text-align:center;color:#555;padding:14px;font-size:11px">لا توجد مشتريات سابقة</div>`;
      return;
    }

    box.innerHTML = entries.map(e => {
      const d = e.timestamp ? new Date(e.timestamp) : null;
      const dateStr = d ? d.toLocaleDateString('ar', { day:'numeric', month:'short', year:'numeric' }) : '—';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:9px 12px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:6px">
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:700;color:#f0e8d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${escapeHTML(e.item || '—')}
            </div>
            <div style="font-size:10px;color:#555577;margin-top:1px">${dateStr}</div>
          </div>
          <div style="color:#fbbf24;font-weight:800;font-size:12px;flex-shrink:0">- ${e.price || 0} 🪙</div>
        </div>`;
    }).join('');
  });
}

function renewItem(itemKey, category, price) {
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < price) { Toast.show('رصيدك غير كافٍ! تحتاج ' + price + ' 🪙', 'error'); Sounds.play('error'); Haptic.error(); return; }

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
      Toast.show(`✅ تم تجديد المنتج لـ ${days} يوم`, 'success');
      renderInventory();
    } else {
      Toast.show('فشل التجديد، تحقق من رصيدك.', 'success');
    }
  });
}