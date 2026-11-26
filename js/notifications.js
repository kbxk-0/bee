// ============================================================
//  js/notifications.js — bee platform
//  شارات الإشعارات + إشعارات المتصفح + الإعلانات الإدارية
// ============================================================

let unreadPM = 0;
let adminChatListener = null;

// ===== شارات الإشعارات =====
function initBadges() {
  const user = auth.currentUser;
  if (!user || window.beeNotifListener) return;

  window.beeNotifListener = db.ref('notifications/' + user.uid);
  window.beeNotifListener.on('value', snap => {
    const data = snap.val() || {};
    unreadPM = data.unreadPM || 0;
    updateBadge('home', unreadPM);
  });

  // مستمع الإعلانات الإدارية — يعمل على كل الصفحات
  initAdminAnnouncementListener();
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
    position: absolute; top: 4px; left: 4px;
    background: #ff4757; color: white;
    font-size: 9px; font-weight: bold;
    min-width: 16px; height: 16px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px; line-height: 1; font-family: inherit;
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

function incrementUnreadPM(receiverUid) {
  db.ref('notifications/' + receiverUid + '/unreadPM').transaction(n => (n || 0) + 1);
}

// ============================================================
//  مستمع الإعلانات الإدارية — يعمل حتى لو مو في صفحة الشات
// ============================================================
function initAdminAnnouncementListener() {
  if (adminChatListener) return;

  const startTime = Date.now();

  adminChatListener = db.ref('global_chat').limitToLast(1);
  adminChatListener.on('child_added', snap => {
    const msg = snap.val();
    if (!msg || msg.type !== 'marquee' || !msg.isAdmin) return;
    // تجاهل الإعلانات القديمة (أقدم من 10 ثواني)
    if (msg.timestamp && msg.timestamp < startTime - 10000) return;
    showGlobalAdminAnnouncement(msg.text);
  });
}

// شريط إعلان أحمر ثابت يظهر فوق كل شي على أي صفحة
function showGlobalAdminAnnouncement(text) {
  Sounds.play('notification');
  Haptic.heavy();
  document.getElementById('global-admin-announce')?.remove();

  const el = document.createElement('div');
  el.id = 'global-admin-announce';
  el.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99995;
    background: linear-gradient(135deg, #5a0000, #990000);
    color: white; padding: 10px 14px;
    display: flex; align-items: center; gap: 8px;
    font-family: 'Cairo', sans-serif; direction: rtl;
    box-shadow: 0 4px 24px rgba(180,0,0,0.55);
    border-bottom: 1px solid rgba(255,60,60,0.35);
    animation: slideDownAnnounce 0.4s ease;
  `;

  const safe = String(text).replace(/</g,'&lt;').replace(/>/g,'&gt;');

  el.innerHTML = `
    <span style="background:rgba(255,255,255,0.15);padding:2px 9px;border-radius:6px;
      font-size:10px;font-weight:800;flex-shrink:0;white-space:nowrap">
      📢 إعلان الإدارة
    </span>
    <div style="flex:1;overflow:hidden;font-size:12px;font-weight:700">
      <span style="display:inline-block;white-space:nowrap;animation:scrollText 10s linear 2">
        ${safe}
      </span>
    </div>
    <button onclick="document.getElementById('global-admin-announce')?.remove()"
      style="background:none;border:none;color:rgba(255,255,255,0.55);
        cursor:pointer;font-size:18px;line-height:1;flex-shrink:0;padding:0 2px">✕</button>
  `;

  document.body.appendChild(el);

  // إخفاء تلقائي بعد 20 ثانية (دورتين للنص)
  setTimeout(() => {
    el.style.transition = 'opacity 0.5s, transform 0.4s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-100%)';
    setTimeout(() => el.remove(), 500);
  }, 20000);
}

// ============================================================
//  إشعارات المتصفح
// ============================================================
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission();
}

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
