// ==========================================
// 🐝 BEE PLATFORM - STORE MODULE (store.js)
// ==========================================

// دالة بناء واجهة المتجر الرئيسية
function renderStore() {
  const sec = document.getElementById('store');
  if (!sec) return;

  const coins = typeof currentCoins !== 'undefined' ? currentCoins : 0;

  sec.innerHTML = `
    <div style="padding:14px;color:white;font-family:'Cairo', sans-serif;">
      <h2 style="color:var(--accent);margin-top:0">🛒 المتجر</h2>
      <p style="color:#aaa;margin-top:0;margin-bottom:16px">رصيدك: <span style="color:#ffd700;font-weight:bold">🪙 ${coins.toLocaleString('ar')}</span></p>

      <div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;">
        ${['الكل','العضوية','الألقاب','الإطارات','التأثيرات'].map((t,i) => `
          <button onclick="filterStore(${i})" id="store-tab-${i}"
                  style="white-space:nowrap;padding:6px 14px;border-radius:20px;border:1px solid ${i===0?'var(--accent)':'#2a2a3f'};background:${i===0?'var(--accent)':'#1a1a28'};color:${i===0?'white':'#888'};font-size:12px;cursor:pointer;font-weight:bold;font-family:inherit">
            ${t}
          </button>
        `).join('')}
      </div>

      <div id="store-items" style="display:flex; flex-direction:column; gap:20px;">

        <div class="store-section" data-cat="1">
          <h4 style="font-size:12px;color:#aaa;margin-bottom:8px">👑 العضوية</h4>
          ${storeCard('VIP ذهبي','إطار ذهبي + شارة VIP في الشات','#ffd700','👑',50,'buyVIP()')}
        </div>

        <div class="store-section" data-cat="2">
          <h4 style="font-size:12px;color:#aaa;margin-bottom:8px">🏷️ الألقاب — تظهر في الشات · ٣٠ يوم</h4>
          <div style="display:flex;flex-direction:column;gap:8px;max-width:480px">
            ${buildTitleCard('الملك',    '#ff4757', 30)}
            ${buildTitleCard('الأسطورة','#2ed573',  25)}
            ${buildTitleCard('المحارب', '#00d2d3',  20)}
            ${buildTitleCard('الأمير',   '#a78bfa',  15)}
            ${buildTitleCard('النجم',    '#ffd700',  35)}
            ${buildTitleCard('الغيث',    '#54a0ff',  18)}
          </div>
        </div>

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

// دالة التحكم بفلترة وتصنيفات المتجر
function filterStore(tabIndex) {
  const sections = document.querySelectorAll('.store-section');
  
  // تحديث ستايل الأزرار لتوضيح التاب النشط
  for (let i = 0; i <= 4; i++) {
    const btn = document.getElementById(`store-tab-${i}`);
    if (btn) {
      if (i === tabIndex) {
        btn.style.background = 'var(--accent)';
        btn.style.borderColor = 'var(--accent)';
        btn.style.color = 'white';
      } else {
        btn.style.background = '#1a1a28';
        btn.style.borderColor = '#2a2a3f';
        btn.style.color = '#888';
      }
    }
  }

  // إخفاء وإظهار الأقسام بناءً على الفلتر
  sections.forEach(sec => {
    const cat = sec.getAttribute('data-cat');
    if (tabIndex === 0 || cat == tabIndex) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
}

// ══ الدوال المساعدة لبناء كروت المنتجات ══

function storeCard(name, desc, color, icon, price, actionClick) {
  return `
    <div class="card-premium" style="background:#161624; border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:16px; display:flex; justify-content:space-between; align-items:center; max-width:480px; margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="font-size:24px; width:44px; height:44px; background:rgba(255,255,255,0.03); border-radius:12px; display:flex; align-items:center; justify-content:center;">${icon}</div>
        <div>
          <div style="font-weight:bold; font-size:14px; color:${color};">${name}</div>
          <div style="font-size:11px; color:#aaa; margin-top:2px;">${desc}</div>
        </div>
      </div>
      <button onclick="${actionClick}" style="background:linear-gradient(180deg, #2ed573, #26af5f); border:none; color:white; padding:8px 14px; border-radius:12px; font-weight:900; font-size:12px; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:4px; box-shadow:0 4px 10px rgba(46,213,115,0.2);">
        <span>🪙 ${price}</span>
      </button>
    </div>`;
}

function buildTitleCard(title, color, price) {
  return storeCard(`لقب [ ${title} ]`, 'يظهر بجانب اسمك في غرف الدردشة', color, '🏷️', price, `buyStoreItem('titles', '${title}', ${price}, '${color}')`);
}

function frameCard(name, gradient, price) {
  return storeCard(name, 'إطار متحرك فخم يحيط بصورة حسابك', '#fff', '🖼️', price, `buyStoreItem('frames', '${name}', ${price}, '${gradient}')`);
}

function effectCard(name, emoji, desc, price) {
  return storeCard(name, desc, '#a78bfa', emoji, price, `buyStoreItem('effects', '${name}', ${price}, '${emoji}')`);
}

// ══ دالات عمليات الشراء والربط بالفايربيس ══
// ملاحظة: وحّدت شكل بيانات inventory هنا ليطابق الشكل اللي تتوقعه صفحة الحقيبة
// (inventory.js) — كانت قبل تُخزَّن بشكل مختلف تماماً فما تظهر صحيح بالحقيبة.
function buyStoreItem(category, itemName, price, meta) {
  if (typeof auth === 'undefined' || !auth.currentUser) {
    Toast.show("يجب تسجيل الدخول أولاً لإتمام الشراء! 🔐", 'error');
    return;
  }

  if (typeof currentCoins !== 'undefined' && currentCoins < price) {
    Toast.show("رصيدك من الكوينز غير كافٍ! 🪙", 'error');
    return;
  }

  const uid = auth.currentUser.uid;
  Sounds.play('click');

  const durations = { titles: 30, frames: 30, effects: 7 };
  const days      = durations[category] || 30;
  const key       = category === 'titles'  ? itemName
                   : category === 'frames'  ? 'frame_'  + itemName
                   :                           'effect_' + itemName;
  const itemType  = category === 'titles' ? 'title' : category === 'frames' ? 'frame' : 'effect';
  const now       = Date.now();
  const expires   = now + days * 24 * 60 * 60 * 1000;

  // سحب آمن ورسمي للعملات داخل الفايربيس عبر Transaction
  db.ref(`users/${uid}`).transaction(userData => {
    if (userData) {
      if ((userData.coins || 0) >= price) {
        userData.coins -= price;
        if (!userData.inventory) userData.inventory = {};

        const entry = { type: itemType, name: itemName, acquired: now, expires };
        if (category === 'frames')  entry.gradient = meta;
        if (category === 'effects') entry.icon     = meta;
        userData.inventory[key] = entry;

        if (category === 'titles') {
          userData.title      = itemName;
          userData.titleColor = meta;
        }
        return userData;
      }
    }
    return; // إلغاء العملية لو الرصيد بالسيرفر ناقص
  }, (error, committed) => {
    if (committed) {
      Toast.show(`🎉 مبروك! تم شراء [ ${itemName} ] وتفعيله في حسابك.`, 'gold');
      Sounds.play('purchase'); Haptic.success();
      setTimeout(() => Sounds.play('coins'), 350);

      // سجل المشتريات — منفصل عن الحقيبة، يبقى محفوظ بالتاريخ حتى بعد انتهاء صلاحية المنتج
      db.ref('purchase_history/' + uid).push({
        item: itemName, category, price,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      if (typeof renderStore === 'function') renderStore();
    } else {
      Toast.show("❌ فشلت عملية الشراء، يرجى التحقق من استقرار الاتصال.", 'error');
    }
  });
}

// دالة شراء الـ VIP الخاصة
function buyVIP() {
  const user = auth.currentUser; if(!user) return;
  if(currentCoins < 50){Toast.show('رصيدك غير كافٍ! تحتاج 50 🪙', 'error');return;}
  db.ref('users/'+user.uid).transaction(u=>{
    if(u&&u.coins>=50){
      u.coins-=50;
      u.isVIP=true;
      u.vipExpiry=Date.now()+30*24*60*60*1000;
      if(!u.inventory)u.inventory={};
      u.inventory['VIP_Gold']={type:'membership',acquired:Date.now(),expires:Date.now()+30*24*60*60*1000};
    }
    return u;
  },(err,ok)=>{
    if(ok){
      if(typeof activateVIP==='function')activateVIP(user.uid);
      else{if(typeof showToast==='function')showToast('⭐ تم تفعيل VIP!');}
      db.ref('purchase_history/' + user.uid).push({
        item: 'VIP ذهبي', category: 'memberships', price: 50,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      if(typeof renderStore==='function')renderStore();
    }
  });
}
window.renderStore = renderStore;
// بعد رندر المتجر نحرّك البطاقات
const _origRenderStore = renderStore;
window.renderStore = function() { _origRenderStore(); setTimeout(() => Effects.animateCards(document.getElementById('store')), 60); };