// ============================================================
//  js/notifications.js — bee platform
//  شارات الإشعارات + إشعارات المتصفح + تعديل الملف الشخصي
// ============================================================

// ===== شارات الإشعارات (النقاط الحمراء) =====
let unreadPM    = 0;
let notifListener = null;

function initBadges() {
  const user = auth.currentUser;
  if (!user || notifListener) return;

  // استمع لإشعارات هذا المستخدم
  notifListener = db.ref('notifications/' + user.uid);
  notifListener.on('value', snap => {
    const data = snap.val() || {};
    unreadPM = data.unreadPM || 0;
    updateBadge('home', unreadPM);
  });
}

function updateBadge(section, count) {
  // احذف القديم
  const old = document.getElementById('badge-' + section);
  if (old) old.remove();
  if (count <= 0) return;

  // أضف شارة جديدة على زر الـ navbar
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
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showBrowserNotif(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  // لا تُظهر الإشعار لو التطبيق مفتوح أمام المستخدم
  if (document.visibilityState === 'visible') return;
  new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    lang: 'ar',
    dir: 'rtl'
  });
}

// ===== تعديل الملف الشخصي =====
function showEditProfile() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';

  const colors = ['#6c63ff','#ff6584','#2ed573','#ffd700','#00d2d3','#ff4757','#a78bfa','#ff9f43','#1dd1a1','#54a0ff'];
  const currentColor = getAvatarColor(currentUsername);

  content.innerHTML = `
    <h3 style="margin:0 0 16px;color:var(--accent);font-size:15px">✏️ تعديل الملف</h3>

    <!-- معاينة الأفاتار -->
    <div id="avatar-preview" style="width:56px;height:56px;border-radius:50%;background:${currentColor};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;color:white;margin:0 auto 14px">
      ${currentUsername.charAt(0).toUpperCase()}
    </div>

    <!-- اختيار اللون -->
    <div style="font-size:12px;color:#888;margin-bottom:8px;text-align:center">اختر لون الأفاتار</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px">
      ${colors.map(c => `
        <div onclick="selectAvatarColor('${c}')"
             data-color="${c}"
             style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c===currentColor?'white':'transparent'};transition:transform .15s"
             onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform=''">
        </div>`).join('')}
    </div>

    <!-- تغيير الاسم -->
    <div style="font-size:12px;color:#888;margin-bottom:6px;text-align:right">اسم المستخدم</div>
    <input type="text" id="edit-username-input"
           value="${escapeHTML(currentUsername)}"
           maxlength="15"
           class="input-field" style="margin-bottom:6px;text-align:center">
    <div style="font-size:10px;color:#555;margin-bottom:14px;text-align:center">يمكن التغيير مرة كل 7 أيام</div>

    <button onclick="saveProfile()" class="btn btn-primary btn-full" style="margin-bottom:8px">حفظ التغييرات</button>
  `;
}

// لون الأفاتار المختار
let selectedAvatarColor = null;

function selectAvatarColor(color) {
  selectedAvatarColor = color;

  // حدّث المعاينة
  const preview = document.getElementById('avatar-preview');
  if (preview) preview.style.background = color;

  // حدّث الحدود
  document.querySelectorAll('[data-color]').forEach(el => {
    el.style.border = el.dataset.color === color ? '2px solid white' : '2px solid transparent';
  });
}

function saveProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const newName = document.getElementById('edit-username-input')?.value.trim();
  if (!newName || newName.length < 3 || newName.length > 15) {
    alert("الاسم بين 3 و15 حرفاً"); return;
  }

  // تحقق من فترة التغيير (7 أيام)
  db.ref('users/' + user.uid + '/lastUsernameChange').once('value', snap => {
    const last = snap.val() || 0;
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);

    if (newName !== currentUsername && daysSince < 7) {
      const daysLeft = Math.ceil(7 - daysSince);
      alert(`يمكنك تغيير اسمك بعد ${daysLeft} يوم`);
      return;
    }

    const updates = {};

    if (newName !== currentUsername) {
      updates.username = newName;
      updates.lastUsernameChange = Date.now();
    }

    if (selectedAvatarColor) {
      updates.avatarColor = selectedAvatarColor;
    }

    if (Object.keys(updates).length === 0) {
      alert("لا يوجد تغييرات"); return;
    }

    db.ref('users/' + user.uid).update(updates, err => {
      if (err) { alert("حدث خطأ، حاول مرة أخرى"); return; }
      alert("✓ تم حفظ التغييرات!");
      document.getElementById('profile-modal').style.display = 'none';
      selectedAvatarColor = null;
    });
  });
}

// ===== دالة تُشغَّل عند فتح الرئيسية لتصفير الإشعارات =====
function onHomeOpen() {
  clearBadge('home');
  requestNotifPermission();
}
