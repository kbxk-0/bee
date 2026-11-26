// ============================================================
//  js/notifications-panel.js — bee platform
//  الإشعارات الداخلية: إرسال + استقبال + لوحة عرض
// ============================================================
//
//  sendNotification(uid, type, title, body)  ← يُستدعى من كل الملفات
//  initNotificationBell()                    ← يُستدعى من auth.js
//  openNotificationsPanel()                  ← يُستدعى من أي مكان
// ============================================================

// ── إرسال إشعار لمستخدم ──────────────────────────────────────
function sendNotification(uid, type, title, body) {
  if (!uid || typeof db === 'undefined') return;
  db.ref('notifications/' + uid + '/feed').push({
    type, title, body,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    read: false
  });
}

// ── تهيئة مستمع الإشعارات ─────────────────────────────────
let _bellInit           = false;
let _notifFeedRef       = null;
let _unreadNotifCount   = 0;

function initNotificationBell() {
  if (_bellInit) return;
  const user = auth.currentUser;
  if (!user) return;
  _bellInit = true;

  _notifFeedRef = db.ref('notifications/' + user.uid + '/feed')
    .orderByChild('read').equalTo(false);

  _notifFeedRef.on('value', snap => {
    const count = snap.numChildren();
    const wasZero = _unreadNotifCount === 0;
    _unreadNotifCount = count;

    // تحديث أي dot/badge موجود
    _updateNotifDot(count);

    // صوت + اهتزاز للإشعار الجديد
    if (!wasZero || count === 0) return;
    Sounds.play('notification');
    Haptic.medium();
  });
}

function _updateNotifDot(count) {
  // استخدم inbox-dot الموجود أو أي badge آخر
  const dot = document.getElementById('inbox-dot');
  if (dot) dot.style.display = count > 0 ? 'block' : 'none';
}

// ── فتح لوحة الإشعارات ─────────────────────────────────────
function openNotificationsPanel() {
  document.getElementById('notif-panel')?.remove();
  const user = auth.currentUser;
  if (!user) return;

  Sounds.play('tap'); Haptic.light();

  const panel = document.createElement('div');
  panel.id    = 'notif-panel';
  panel.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:8500',
    'background:#0a0a14',
    'display:flex', 'flex-direction:column',
    'font-family:inherit', 'direction:rtl'
  ].join(';');

  panel.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.07);
      display:flex;align-items:center;gap:12px;flex-shrink:0">
      <button onclick="document.getElementById('notif-panel').remove()"
        style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:36px;height:36px;color:#aaa;cursor:pointer;font-size:16px;flex-shrink:0">
        ←
      </button>
      <h2 style="margin:0;font-size:16px;color:#f0e8d0;flex:1">🔔 الإشعارات</h2>
      <button onclick="_markAllRead('${user.uid}')"
        style="background:none;border:none;color:#c8a940;font-size:12px;
          cursor:pointer;font-family:inherit;font-weight:700">
        قراءة الكل ✓
      </button>
    </div>
    <div id="notif-list" style="flex:1;overflow-y:auto">
      <div style="text-align:center;color:#555;padding:40px;font-size:13px">
        جاري التحميل...
      </div>
    </div>`;

  document.body.appendChild(panel);
  _loadNotifications(user.uid);
}

// ── تحميل وعرض الإشعارات ───────────────────────────────────
const _NOTIF_ICONS = {
  friend_add:  '🤝',
  transfer:    '🪙',
  gift:        '🎁',
  system:      '🔔',
  pm:          '💬',
  achievement: '🏅',
  tournament:  '🏆',
  levelup:     '⭐',
  clan:        '⚔️',
  vip:         '👑',
};

function _loadNotifications(uid) {
  const list = document.getElementById('notif-list');
  if (!list) return;

  db.ref('notifications/' + uid + '/feed')
    .orderByChild('timestamp').limitToLast(40)
    .once('value', snap => {
      if (!snap.exists()) {
        list.innerHTML = `
          <div style="text-align:center;padding:60px 20px">
            <div style="font-size:48px;margin-bottom:12px">🔔</div>
            <div style="color:#555;font-size:13px">لا توجد إشعارات بعد</div>
          </div>`;
        return;
      }

      const notifs = [];
      snap.forEach(s => notifs.push({ id: s.key, ...s.val() }));
      notifs.reverse();

      list.innerHTML = notifs.map(n => {
        const icon = _NOTIF_ICONS[n.type] || '🔔';
        const time = typeof timeAgoShort === 'function' && n.timestamp
          ? timeAgoShort(n.timestamp) : '';
        const isNew = !n.read;

        return `
          <div onclick="_markRead('${uid}','${n.id}',this)"
            data-notif-id="${n.id}"
            style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;
              border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;
              background:${isNew ? 'rgba(200,169,64,0.05)' : 'transparent'}">
            <div style="width:42px;height:42px;border-radius:50%;flex-shrink:0;
              background:rgba(200,169,64,0.1);border:1px solid rgba(200,169,64,0.18);
              display:flex;align-items:center;justify-content:center;font-size:19px">
              ${icon}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:${isNew ? '800' : '600'};
                color:${isNew ? '#f0e8d0' : '#888'};margin-bottom:3px">
                ${typeof escapeHTML === 'function' ? escapeHTML(n.title || '') : (n.title || '')}
              </div>
              <div style="font-size:12px;color:#666;line-height:1.4">
                ${typeof escapeHTML === 'function' ? escapeHTML(n.body || '') : (n.body || '')}
              </div>
              ${time ? `<div style="font-size:10px;color:#444;margin-top:4px">${time}</div>` : ''}
            </div>
            ${isNew ? `<div style="width:8px;height:8px;border-radius:50%;
              background:#c8a940;flex-shrink:0;margin-top:6px;flex-shrink:0"></div>` : ''}
          </div>`;
      }).join('');

      // وسّم كل شيء مقروءاً بعد 2 ثانية
      setTimeout(() => _markAllRead(uid), 2000);
    });
}

// ── وسّم كقروء ───────────────────────────────────────────────
function _markRead(uid, notifId, el) {
  db.ref('notifications/' + uid + '/feed/' + notifId + '/read').set(true);
  if (el) {
    el.style.background = 'transparent';
    el.querySelector('[style*="border-radius:50%"][style*="background:#c8a940"]')?.remove();
  }
}

function _markAllRead(uid) {
  if (!uid || typeof db === 'undefined') return;
  db.ref('notifications/' + uid + '/feed')
    .orderByChild('read').equalTo(false)
    .once('value', snap => {
      if (!snap.numChildren()) return;
      const upd = {};
      snap.forEach(s => { upd[s.key + '/read'] = true; });
      db.ref('notifications/' + uid + '/feed').update(upd);
      _unreadNotifCount = 0;
      _updateNotifDot(0);
      Toast.show('✓ تمت قراءة كل الإشعارات', 'success');
    });
}
