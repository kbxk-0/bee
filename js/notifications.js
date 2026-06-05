// ============================================================
//  js/notifications.js — bee platform
//  شارات الإشعارات + إشعارات المتصفح
// ============================================================

let unreadPM = 0;

// ===== شارات الإشعارات (النقاط الحمراء على الأزرار) =====
function initBadges() {
  const user = auth.currentUser;
  if (!user || window.beeNotifListener) return;

  window.beeNotifListener = db.ref('notifications/' + user.uid);
  window.beeNotifListener.on('value', snap => {
    const data = snap.val() || {};
    unreadPM = data.unreadPM || 0;
    updateBadge('home', unreadPM);
  });
}

function updateBadge(section, count) {
  const old = document.getElementById('badge-' + section);
  if (old) old.remove();
  if (count <= 0) return;

  const btn = document.querySelector(`#navbar button[data-section="${section}"]`);
  if (!btn) return;

  btn.style.position = 'relative';
  const badge = document.createElement('div');
  badge.id = 'badge-' + section;
  badge.style.cssText = `
    position: absolute;
    top: 4px; left: 4px;
    background: #ff4757;
    color: white;
    font-size: 9px;
    font-weight: bold;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    line-height: 1;
    font-family: inherit;
  `;
  badge.textContent = count > 9 ? '9+' : count;
  btn.appendChild(badge);
}

function clearBadge(section) {
  const user = auth.currentUser;
  if (!user) return;
  updateBadge(section, 0);
  if (section === 'home') {
    db.ref('notifications/' + user.uid + '/unreadPM').set(0);
    unreadPM = 0;
  }
}

// تُستدعى عند وصول رسالة خاصة جديدة
function incrementUnreadPM(receiverUid) {
  db.ref('notifications/' + receiverUid + '/unreadPM').transaction(n => (n || 0) + 1);
}

// ===== إشعارات المتصفح =====
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission();
}

// ===== تُشغَّل عند فتح صفحة الرئيسية =====
function showBrowserNotif(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;
  new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    lang: 'ar',
    dir: 'rtl'
  });
}

function onHomeOpen() {
  clearBadge('home');
  requestNotifPermission();
}

console.log("Notifications panel initialized.");