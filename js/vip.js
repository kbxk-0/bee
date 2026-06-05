// ============================================================
//  js/vip.js — bee platform
//  تفعيل VIP + الألقاب + الإطارات
// ============================================================

// ===== تفعيل VIP =====
function activateVIP(uid) {
  db.ref('users/' + uid).update({
    isVIP: true,
    vipExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000
  }, err => {
    if (!err) {
      isVIP = true;
      if (typeof showToast === 'function') showToast('⭐ تم تفعيل VIP! تمتع بالمزايا الحصرية');
      if (typeof sendNotification === 'function')
        sendNotification(uid, 'system', '⭐ VIP مفعّل!', 'تمتع بشارة VIP في الشات والملف الشخصي لمدة 30 يوم');
    }
  });
}

// ===== تجهيز بادج VIP في الشات =====
function getVIPBadge(userData) {
  if (!userData.isVIP) return '';
  return '<span style="background:linear-gradient(135deg,#b8860b,#ffd700);color:#1a0800;font-size:8px;padding:1px 5px;border-radius:5px;font-weight:900;margin-right:3px;vertical-align:middle">★VIP</span>';
}

// ===== بناء اسم المستخدم الكامل في الشات =====
function buildChatName(username, title, titleColor, isVIP, level) {
  let html = '';

  // اللقب
  if (title) {
    html += `<span style="color:${titleColor||'#a78bfa'};font-size:10px;font-weight:700;margin-left:3px">‹${escapeHTML(title)}›</span> `;
  }

  // الاسم
  html += `<strong style="color:${isVIP?'#ffd700':'inherit'}">${escapeHTML(username)}</strong>`;

  // VIP badge
  if (isVIP) {
    html += ' <span style="background:linear-gradient(135deg,#b8860b,#ffd700);color:#1a0800;font-size:8px;padding:1px 5px;border-radius:5px;font-weight:900;vertical-align:middle">★VIP</span>';
  }

  // مستوى
  if (level >= 10) {
    html += ` <span style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.5);font-size:9px;padding:1px 4px;border-radius:4px">Lv.${level}</span>`;
  }

  return html;
}

// ===== تجهيز إطار الأفاتار =====
function getAvatarFrame(userInventory) {
  if (!userInventory) return null;
  const frames = Object.entries(userInventory)
    .filter(([k, v]) => k.startsWith('frame_'))
    .filter(([k, v]) => !v.expires || v.expires > Date.now());
  if (!frames.length) return null;
  // Return active frame gradient
  const activeFrame = frames[0];
  const frameGradients = {
    'frame_إطار ناري':  'linear-gradient(135deg,#ff4757,#ff9f43)',
    'frame_إطار مائي':  'linear-gradient(135deg,#00d2d3,#54a0ff)',
    'frame_إطار ملكي':  'linear-gradient(135deg,#6c63ff,#a78bfa)',
    'frame_إطار ذهبي':  'linear-gradient(135deg,#ffd700,#ff9f43)',
    'frame_إطار نجمي':  'linear-gradient(135deg,#fff,#aaa)',
  };
  return frameGradients[activeFrame[0]] || 'linear-gradient(135deg,#c8a940,#f0c040)';
}

// ===== تجهيز تأثير الشات =====
function getChatEffect(userInventory) {
  if (!userInventory) return null;
  const effects = Object.entries(userInventory)
    .filter(([k, v]) => k.startsWith('effect_'))
    .filter(([k, v]) => !v.expires || v.expires > Date.now());
  return effects.length ? effects[0][0].replace('effect_', '') : null;
}

// ===== تجهيز ستايل الرسالة في الشات =====
function getChatMessageStyle(isMine, effect) {
  let style = isMine
    ? 'background:#6c63ff;color:white;border-radius:12px 12px 0 12px;padding:8px 11px;max-width:72%;font-size:13px;word-break:break-word;'
    : 'background:#1e1e2e;color:#e8e8f0;border-radius:12px 12px 12px 0;padding:8px 11px;max-width:72%;font-size:13px;word-break:break-word;border:1px solid #2a2a3f;';

  if (effect === 'رسائل متوهجة') {
    style += 'box-shadow:0 0 12px rgba(168,85,247,.6);';
  } else if (effect === 'تأثير قوس قزح') {
    style += 'background:linear-gradient(135deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff)!important;color:white;';
  } else if (effect === 'تأثير النار') {
    style += 'background:linear-gradient(135deg,#ff4500,#ff8c00)!important;color:white;';
  }
  return style;
}

// ===== صفحة تجهيز الأيتمز (Loadout) =====
function openLoadout() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';

  const user = auth.currentUser; if (!user) return;

  db.ref('users/' + user.uid + '/inventory').once('value', snap => {
    const inv = snap.val() || {};
    const now = Date.now();

    const sections = {
      titles:      { label: '🏷️ الألقاب',   prefix: '', filter: ([k]) => !k.startsWith('frame_') && !k.startsWith('effect_') && !k.includes('VIP') },
      frames:      { label: '🖼️ الإطارات',  prefix: 'frame_',  filter: ([k]) => k.startsWith('frame_')  },
      effects:     { label: '✨ التأثيرات',  prefix: 'effect_', filter: ([k]) => k.startsWith('effect_') },
    };

    content.innerHTML = `
      <h3 style="margin:0 0 12px;color:#f0c040;font-size:15px">🎒 تجهيز الشخصية</h3>
      ${Object.entries(sections).map(([type, sec]) => {
        const items = Object.entries(inv).filter(sec.filter)
          .filter(([k, v]) => !v.expires || v.expires > now);

        if (!items.length) return '';

        return `
          <div style="margin-bottom:14px">
            <div style="font-size:11px;color:#888;margin-bottom:8px">${sec.label}</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${items.map(([key, val]) => {
                const name    = key.replace('frame_','').replace('effect_','');
                const isActive = type === 'titles'  ? currentTitle === name
                               : type === 'frames'  ? false // check from inventory
                               : false;
                const days = val.expires ? Math.ceil((val.expires - now) / 86400000) : null;

                return `
                  <div style="display:flex;align-items:center;gap:10px;padding:10px;
                    background:rgba(255,255,255,.04);border:1px solid ${isActive?'rgba(200,169,64,.4)':'rgba(255,255,255,.07)'};
                    border-radius:12px">
                    <div style="flex:1">
                      <div style="font-size:13px;font-weight:700;color:${val.color||'#f0e8d0'}">${escapeHTML(name)}</div>
                      <div style="font-size:10px;color:#555;margin-top:1px">
                        ${days !== null ? `⏳ ${days} يوم` : '♾️ دائم'}
                        ${isActive ? ' · <span style="color:#2ed573">مفعّل ✓</span>' : ''}
                      </div>
                    </div>
                    ${!isActive ? `
                      <button onclick="equipItem('${type}','${escapeHTML(name)}','${escapeHTML(val.color||'')}','${user.uid}')"
                        style="background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0e00;border:none;
                          border-radius:8px;font-size:11px;padding:7px 12px;cursor:pointer;font-weight:900;font-family:inherit">
                        تفعيل
                      </button>` : `
                      <button onclick="unequipItem('${type}','${user.uid}')"
                        style="background:rgba(255,71,87,.15);color:#ff4757;border:1px solid rgba(255,71,87,.3);
                          border-radius:8px;font-size:11px;padding:7px 12px;cursor:pointer;font-weight:700;font-family:inherit">
                        إيقاف
                      </button>`}
                  </div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('')}`;
  });
}

function equipItem(type, name, color, uid) {
  const updates = {};
  if (type === 'titles') {
    updates.title      = name;
    updates.titleColor = color || '#a78bfa';
  }
  // frames and effects stored as active flags
  if (type === 'frames')  updates.activeFrame  = name;
  if (type === 'effects') updates.activeEffect = name;

  db.ref('users/' + uid).update(updates, err => {
    if (!err) {
      if (type === 'titles') { currentTitle = name; currentTitleColor = color || '#a78bfa'; }
      if (typeof showToast === 'function') showToast('✅ تم التفعيل!');
      openLoadout();
    }
  });
}

function unequipItem(type, uid) {
  const updates = {};
  if (type === 'titles') { updates.title = ''; updates.titleColor = ''; }
  if (type === 'frames') updates.activeFrame  = '';
  if (type === 'effects')updates.activeEffect = '';

  db.ref('users/' + uid).update(updates, err => {
    if (!err) {
      if (type === 'titles') { currentTitle = ''; currentTitleColor = ''; }
      if (typeof showToast === 'function') showToast('تم الإيقاف');
      openLoadout();
    }
  });
}

// ===== فحص انتهاء VIP =====
function checkVIPExpiry(userData) {
  if (!userData.isVIP) return;
  const expiry = userData.vipExpiry;
  if (expiry && Date.now() > expiry) {
    const uid = auth.currentUser?.uid;
    if (uid) db.ref('users/' + uid).update({ isVIP: false, vipExpiry: null });
  }
}
