// ============================================================
//  js/settings.js — bee platform
//  صفحة إعدادات المستخدم
// ============================================================

function openSettings() {
  document.getElementById('settings-panel')?.remove();
  const user = auth.currentUser; if (!user) return;

  const panel = document.createElement('div');
  panel.id    = 'settings-panel';
  panel.style.cssText = `
    position:fixed;inset:0;z-index:8500;
    background:#0a0a14;overflow-y:auto;
    font-family:inherit;direction:rtl;
  `;

  db.ref('users/' + user.uid).once('value', snap => {
    const u = snap.val() || {};

    panel.innerHTML = `
      <div style="max-width:480px;margin:0 auto;padding:16px 16px 80px">

        <!-- هيدر -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-top:8px">
          <button onclick="document.getElementById('settings-panel').remove()"
            style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
              width:36px;height:36px;color:#aaa;cursor:pointer;font-size:16px;flex-shrink:0">
            ←
          </button>
          <h2 style="margin:0;font-size:17px;color:#f0e8d0">⚙️ الإعدادات</h2>
        </div>

        <!-- بطاقة الحساب -->
        <div style="background:rgba(14,11,4,0.8);border:1px solid rgba(200,169,64,0.2);
          border-radius:16px;padding:16px;margin-bottom:16px">
          <div style="font-size:11px;color:#705030;margin-bottom:10px;font-weight:700">👤 الحساب</div>
          <div style="font-size:13px;color:#888;margin-bottom:4px">البريد الإلكتروني</div>
          <div style="font-size:14px;color:#f0e8d0;margin-bottom:12px">${user.email}</div>
          <button onclick="changePassword()"
            style="width:100%;padding:10px;background:rgba(108,99,255,0.15);color:#a78bfa;
              border:1px solid rgba(108,99,255,0.3);border-radius:10px;font-size:13px;
              cursor:pointer;font-weight:700;font-family:inherit">
            🔑 تغيير كلمة المرور
          </button>
        </div>

        <!-- الخصوصية -->
        <div style="background:rgba(14,11,4,0.8);border:1px solid rgba(200,169,64,0.2);
          border-radius:16px;padding:16px;margin-bottom:16px">
          <div style="font-size:11px;color:#705030;margin-bottom:12px;font-weight:700">🔒 الخصوصية</div>

          ${settingToggle('show-online', 'إظهار حالة الأونلاين', 'يرى أصدقاؤك أنك متصل', u.privacy?.showOnline !== false)}
          ${settingToggle('show-stats',  'إظهار إحصائيات الألعاب', 'يرى الآخرون نتائجك', u.privacy?.showStats !== false)}
          ${settingToggle('allow-gifts', 'السماح بالهدايا', 'يمكن للاعبين إرسال هدايا لك', u.privacy?.allowGifts !== false)}
          ${settingToggle('allow-pm',    'السماح بالرسائل الخاصة', 'يمكن لأي شخص مراسلتك', u.privacy?.allowPM !== false)}
        </div>

        <!-- الإشعارات -->
        <div style="background:rgba(14,11,4,0.8);border:1px solid rgba(200,169,64,0.2);
          border-radius:16px;padding:16px;margin-bottom:16px">
          <div style="font-size:11px;color:#705030;margin-bottom:12px;font-weight:700">🔔 الإشعارات</div>

          ${settingToggle('notif-friends', 'إشعارات الأصدقاء',    'عند إضافة صديق جديد',    u.notifSettings?.friends  !== false)}
          ${settingToggle('notif-gifts',   'إشعارات الهدايا',     'عند استلام هدية',         u.notifSettings?.gifts    !== false)}
          ${settingToggle('notif-transfer','إشعارات التحويلات',   'عند استلام كوينز',        u.notifSettings?.transfer !== false)}
          ${settingToggle('notif-clan',    'إشعارات الكلان',      'رسائل وتحديثات الكلان',  u.notifSettings?.clan     !== false)}
        </div>

        <!-- حفظ -->
        <button onclick="saveSettings()"
          style="width:100%;padding:14px;background:linear-gradient(135deg,#c8a940,#f0c040);
            color:#1a0e00;border:none;border-radius:14px;font-weight:900;font-size:15px;
            cursor:pointer;font-family:inherit;margin-bottom:16px">
          حفظ الإعدادات ✓
        </button>

        <!-- خطر -->
        <div style="background:rgba(255,71,87,0.05);border:1px solid rgba(255,71,87,0.2);
          border-radius:16px;padding:16px">
          <div style="font-size:11px;color:#ff4757;margin-bottom:12px;font-weight:700">⚠️ منطقة الخطر</div>
          <button onclick="confirmDeleteAccount()"
            style="width:100%;padding:10px;background:rgba(255,71,87,0.1);color:#ff4757;
              border:1px solid rgba(255,71,87,0.3);border-radius:10px;font-size:13px;
              cursor:pointer;font-weight:700;font-family:inherit;margin-bottom:8px">
            🗑️ حذف الحساب نهائياً
          </button>
          <button onclick="doLogout()"
            style="width:100%;padding:10px;background:rgba(255,255,255,0.05);color:#888;
              border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-size:13px;
              cursor:pointer;font-weight:700;font-family:inherit">
            🚪 تسجيل الخروج
          </button>
        </div>

        <!-- معلومات التطبيق -->
        <div style="text-align:center;margin-top:24px;color:#333;font-size:11px">
          🐝 bee platform<br>
          الإصدار 1.0.0
        </div>

      </div>`;

    document.body.appendChild(panel);
  });
}

// ===== مكوّن الـToggle =====
function settingToggle(id, title, subtitle, checked) {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div>
        <div style="font-size:13px;color:#f0e8d0;font-weight:600">${title}</div>
        <div style="font-size:11px;color:#555;margin-top:1px">${subtitle}</div>
      </div>
      <label style="position:relative;display:inline-block;width:46px;height:26px;flex-shrink:0">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}
          style="opacity:0;width:0;height:0">
        <span onclick="toggleSwitch('${id}')" style="position:absolute;cursor:pointer;
          inset:0;border-radius:26px;transition:.3s;
          background:${checked ? 'linear-gradient(135deg,#c8a940,#f0c040)' : '#2a2a3f'}" id="sw-${id}">
          <span style="position:absolute;content:'';height:20px;width:20px;left:3px;bottom:3px;
            background:white;border-radius:50%;transition:.3s;
            transform:${checked ? 'translateX(20px)' : 'translateX(0)'}" id="knob-${id}">
          </span>
        </span>
      </label>
    </div>`;
}

function toggleSwitch(id) {
  const input = document.getElementById(id);
  const sw    = document.getElementById('sw-' + id);
  const knob  = document.getElementById('knob-' + id);
  if (!input) return;
  input.checked = !input.checked;
  if (sw)   sw.style.background   = input.checked ? 'linear-gradient(135deg,#c8a940,#f0c040)' : '#2a2a3f';
  if (knob) knob.style.transform  = input.checked ? 'translateX(20px)' : 'translateX(0)';
}

// ===== حفظ الإعدادات =====
function saveSettings() {
  const user = auth.currentUser; if (!user) return;

  const get = id => document.getElementById(id)?.checked ?? true;

  const updates = {
    'privacy/showOnline':      get('show-online'),
    'privacy/showStats':       get('show-stats'),
    'privacy/allowGifts':      get('allow-gifts'),
    'privacy/allowPM':         get('allow-pm'),
    'notifSettings/friends':   get('notif-friends'),
    'notifSettings/gifts':     get('notif-gifts'),
    'notifSettings/transfer':  get('notif-transfer'),
    'notifSettings/clan':      get('notif-clan'),
  };

  db.ref('users/' + user.uid).update(updates, err => {
    if (!err) {
      if (typeof showToast === 'function') showToast('✅ تم حفظ الإعدادات');
      document.getElementById('settings-panel').remove();
    } else {
      alert('حدث خطأ، حاول مرة أخرى');
    }
  });
}

// ===== تغيير كلمة المرور =====
function changePassword() {
  const user = auth.currentUser; if (!user) return;
  auth.sendPasswordResetEmail(user.email).then(() => {
    alert(`📧 تم إرسال رابط تغيير كلمة المرور إلى:\n${user.email}`);
  }).catch(err => alert('خطأ: ' + err.message));
}

// ===== تسجيل الخروج =====
function doLogout() {
  if (!confirm('تسجيل الخروج؟')) return;
  auth.signOut().then(() => {
    document.getElementById('settings-panel')?.remove();
  });
}

// ===== حذف الحساب =====
function confirmDeleteAccount() {
  if (!confirm('⚠️ هذا الإجراء نهائي — سيُحذف حسابك وبياناتك كاملاً.\n\nهل أنت متأكد؟')) return;
  if (!confirm('تأكيد نهائي — حذف الحساب؟')) return;

  const user = auth.currentUser; if (!user) return;
  const uid  = user.uid;

  db.ref('users/' + uid).remove().then(() => {
    db.ref('friends/' + uid).remove();
    db.ref('notifications/' + uid).remove();
    db.ref('game_history/' + uid).remove();
    return user.delete();
  }).then(() => {
    alert('تم حذف الحساب.');
  }).catch(err => {
    if (err.code === 'auth/requires-recent-login') {
      alert('لحذف الحساب يجب تسجيل الدخول مجدداً أولاً.');
      auth.signOut();
    } else {
      alert('خطأ: ' + err.message);
    }
  });
}
