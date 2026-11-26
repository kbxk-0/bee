// ============================================================
//  js/profile.js — bee platform
//  الملف الشخصي: عرض + تعديل + popup الإحصائيات
// ============================================================

// ===== عرض ملف أي لاعب =====
function viewProfile(uid) {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  resetModalStack();
  modal.style.display = 'flex';
  content.innerHTML = '<div style="color:#705030;text-align:center;padding:20px">جاري التحميل...</div>';

  db.ref('users/' + uid).once('value', snap => {
    const u = snap.val();
    if (!u) { content.innerHTML = 'المستخدم غير موجود'; return; }
    const isMe = auth.currentUser && auth.currentUser.uid === uid;

    const bgStyles = {
      'bg_gold':    'linear-gradient(135deg,#1c1500,#2d2200)',
      'bg_purple':  'linear-gradient(135deg,#0d0a1c,#1a1030)',
      'bg_green':   'linear-gradient(135deg,#0a1a0e,#0f2a14)',
      'bg_red':     'linear-gradient(135deg,#1a0a0a,#2a1010)',
      'bg_default': 'linear-gradient(135deg,#0e0b04,#1a1208)',
    };
    const bg = bgStyles[u.profileBg] || bgStyles['bg_default'];

    const avatarHtml = u.photoURL
      ? `<img src="${u.photoURL}" style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:2px solid rgba(200,169,64,0.5)">`
      : `<div style="width:68px;height:68px;border-radius:50%;background:${getAvatarColor(u.username||'?')};
          display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;
          color:white;border:2px solid rgba(200,169,64,0.5)">
          ${(u.username || '?').charAt(0).toUpperCase()}
        </div>`;

    const badges = [];
    if ((u.level || 1) >= 5)  badges.push('🥉');
    if ((u.level || 1) >= 10) badges.push('🥈');
    if ((u.level || 1) >= 20) badges.push('🥇');
    if ((u.level || 1) >= 50) badges.push('💎');
    if (u.isVIP)   badges.push('⭐');
    if (u.isAdmin) badges.push('🛡️');

    content.innerHTML = `
      <div style="background:${bg};border-radius:14px;padding:16px;margin:-4px -4px 12px;overflow:hidden">
        <div style="display:flex;align-items:center;gap:12px">
          ${avatarHtml}
          <div>
            <div style="font-size:17px;font-weight:900;color:#f0e8d0">${escapeHTML(u.username || 'لاعب')}</div>
            <div style="font-size:11px;color:#c8a940;margin-top:3px">${badges.join(' ') || 'لاعب جديد'}</div>
            <div style="font-size:10px;color:#705030;margin-top:2px">⭐ المستوى ${u.level || 1}</div>
          </div>
        </div>
        ${u.bio ? `<div style="margin-top:10px;font-size:12px;color:#b09060;padding:8px;background:rgba(0,0,0,0.3);border-radius:8px">"${escapeHTML(u.bio)}"</div>` : ''}
      </div>

      <div style="font-size:12px;line-height:2.2;color:#b09060;margin-bottom:12px">
        <div>🪙 الكوينز: <strong style="color:#f0c040">${(u.coins || 0).toLocaleString('ar')}</strong></div>
        <div>🛡️ الكلان: <span style="color:#4a9d5c">${u.clan || 'لا يوجد'}</span></div>
        <div>💎 ${u.isVIP ? '<span style="color:#f0c040">VIP ★</span>' : 'عادي'}</div>
      </div>

      ${isMe ? `
        <div style="margin-bottom:10px">
          <div style="font-size:11px;color:#705030;margin-bottom:5px">✏️ حالتك</div>
          <input type="text" id="bio-input" value="${escapeHTML(u.bio || '')}" maxlength="60"
            placeholder="اكتب حالتك..." class="input-field" style="font-size:12px;margin-bottom:8px">
          <button onclick="saveFullProfile()"
            style="width:100%;padding:10px;background:linear-gradient(135deg,#c8a940,#f0c040);
              color:#1a0e00;border:none;border-radius:10px;font-weight:900;font-size:13px;
              cursor:pointer;font-family:inherit">
            حفظ التغييرات
          </button>
        </div>
      ` : `
        <button onclick="sendFriendRequest('${uid}','${escapeHTML(u.username || '')}',this)"
          style="width:100%;padding:9px;background:rgba(200,169,64,0.12);color:#f0c040;
            border:1px solid rgba(200,169,64,0.3);border-radius:8px;font-size:12px;
            cursor:pointer;font-weight:900;font-family:inherit;margin-bottom:8px">
          + إضافة صديق
        </button>
      `}
      <button onclick="showPlayerStats('${uid}')"
        style="width:100%;padding:9px;background:rgba(251,191,36,0.1);color:#fbbf24;
          border:1px solid rgba(251,191,36,0.3);border-radius:8px;font-size:12px;
          cursor:pointer;font-weight:900;font-family:inherit;margin-bottom:8px">
        📊 إحصائيات الألعاب
      </button>
      <button onclick="openReferral()"
        style="width:100%;padding:9px;background:rgba(46,213,115,.1);color:#2ed573;
          border:1px solid rgba(46,213,115,.25);border-radius:8px;font-size:12px;
          cursor:pointer;font-weight:900;font-family:inherit;margin-bottom:8px">
        🎁 نظام الإحالة
      </button>
      <button onclick="openLoadout()" 
        style="width:100%;padding:9px;background:rgba(108,99,255,.1);color:#a78bfa;
          border:1px solid rgba(108,99,255,.25);border-radius:8px;font-size:12px;
          cursor:pointer;font-weight:900;font-family:inherit;margin-bottom:8px">
        🎒 تجهيز الشخصية
      </button>
      <button onclick="showAchievements('${uid}')" 
        style="width:100%;padding:9px;background:rgba(200,169,64,0.08);color:#c8a940;
          border:1px solid rgba(200,169,64,0.25);border-radius:8px;font-size:12px;
          cursor:pointer;font-weight:900;font-family:inherit;margin-bottom:8px">
        🏅 الإنجازات
      </button>

      ${isAdmin && !isMe ? `
        <button onclick="adminGiveCoinsToUser('${uid}','${escapeHTML(u.username || '')}')"
          style="width:100%;padding:9px;background:#c03030;color:white;border:none;
            border-radius:8px;font-size:12px;cursor:pointer;font-weight:900;font-family:inherit">
          🪙 منح كوينز
        </button>` : ''}`;
  });
}

// ===== حفظ البروفايل =====
function saveFullProfile() {
  const user = auth.currentUser; if (!user) return;
  const bio  = document.getElementById('bio-input')?.value.trim() || '';

  db.ref('users/' + user.uid).update({ bio }, err => {
    if (!err) {
      Toast.show('✓ تم حفظ التغييرات!', 'success'); Sounds.play('success'); Haptic.success();
      document.getElementById('profile-modal').style.display = 'none';
    }
  });
}

// ===== تعديل الاسم واللون (popup تعديل) =====
function showEditProfile() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';

  const colors = ['#6c63ff','#ff6584','#2ed573','#ffd700','#00d2d3',
                  '#ff4757','#a78bfa','#ff9f43','#1dd1a1','#54a0ff'];
  const currentColor = getAvatarColor(currentUsername);

  // جلب الصورة الحالية لو موجودة
  const user = auth.currentUser;
  db.ref('users/' + user.uid + '/photoURL').once('value', snap => {
    const photoURL = snap.val() || '';

    const avatarHtml = photoURL
      ? `<img id="avatar-preview" src="${photoURL}"
           style="width:72px;height:72px;border-radius:50%;object-fit:cover;
             border:3px solid rgba(200,169,64,0.5);margin:0 auto 6px;display:block;cursor:pointer"
           onclick="document.getElementById('photo-upload-input').click()">`
      : `<div id="avatar-preview"
           onclick="document.getElementById('photo-upload-input').click()"
           style="width:72px;height:72px;border-radius:50%;background:${currentColor};
             display:flex;align-items:center;justify-content:center;cursor:pointer;
             font-size:28px;font-weight:bold;color:white;margin:0 auto 6px;
             border:3px solid rgba(200,169,64,0.3)">
           ${currentUsername.charAt(0).toUpperCase()}
         </div>`;

    content.innerHTML = `
      <h3 style="margin:0 0 14px;color:var(--accent);font-size:15px">✏️ تعديل الملف</h3>

      ${avatarHtml}

      <div style="text-align:center;margin-bottom:14px">
        <input type="file" id="photo-upload-input" accept="image/*"
          style="display:none" onchange="handlePhotoUpload(this)">
        <button onclick="document.getElementById('photo-upload-input').click()"
          style="background:rgba(200,169,64,0.12);border:1px solid rgba(200,169,64,0.3);
            color:#c8a940;padding:6px 16px;border-radius:10px;font-size:11px;
            cursor:pointer;font-family:inherit;font-weight:700">
          📷 تغيير الصورة
        </button>
        ${photoURL ? `<button onclick="removePhoto()"
          style="background:rgba(255,71,87,0.12);border:1px solid rgba(255,71,87,0.3);
            color:#ff4757;padding:6px 12px;border-radius:10px;font-size:11px;
            cursor:pointer;font-family:inherit;font-weight:700;margin-right:6px">
          🗑️ حذف
        </button>` : ''}
        <div id="upload-status" style="font-size:10px;color:#888;margin-top:5px"></div>
      </div>

      <div style="font-size:12px;color:#888;margin-bottom:8px;text-align:center">اختر لون الأفاتار</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:14px">
        ${colors.map(c => `
          <div onclick="selectAvatarColor('${c}')" data-color="${c}"
            style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;
              border:2px solid ${c === currentColor ? 'white' : 'transparent'};transition:transform .15s">
          </div>`).join('')}
      </div>

      <div style="font-size:12px;color:#888;margin-bottom:6px;text-align:right">اسم المستخدم</div>
      <input type="text" id="edit-username-input" value="${escapeHTML(currentUsername)}"
        maxlength="15" class="input-field" style="margin-bottom:6px;text-align:center">
      <div style="font-size:10px;color:#555;margin-bottom:14px;text-align:center">يمكن التغيير مرة كل 7 أيام</div>

      <button onclick="saveProfile()" class="btn btn-primary btn-full" style="margin-bottom:8px">
        حفظ التغييرات
      </button>`;
  });
}

let selectedAvatarColor = null;

function selectAvatarColor(color) {
  selectedAvatarColor = color;
  const preview = document.getElementById('avatar-preview');
  if (preview) preview.style.background = color;
  document.querySelectorAll('[data-color]').forEach(el => {
    el.style.border = el.dataset.color === color ? '2px solid white' : '2px solid transparent';
  });
}

function saveProfile() {
  const user = auth.currentUser; if (!user) return;
  const newName = document.getElementById('edit-username-input')?.value.trim();
  if (!newName || newName.length < 3 || newName.length > 15) {
    Toast.show('الاسم بين 3 و15 حرفاً', 'error'); return;
  }

  const nameChanging = newName !== currentUsername;

  db.ref('users/' + user.uid).once('value', snap => {
    const u         = snap.val() || {};
    const last      = u.lastUsernameChange || 0;
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);

    if (nameChanging && daysSince < 7) {
      Toast.show(`يمكنك تغيير اسمك بعد ${Math.ceil(7 - daysSince)} يوم`, 'error');
      return;
    }

    // سعر تغيير الاسم يتضاعف كل مرة — يبدأ 50,000 ويثبت بعد 5 مرات (حداً أقصى 1,600,000)
    const changeCount = u.nameChangeCount || 0;
    const price        = nameChanging ? 50000 * Math.pow(2, Math.min(changeCount, 5)) : 0;

    if (nameChanging && (u.coins || 0) < price) {
      Toast.show(`تحتاج ${price.toLocaleString('ar')} 🪙 لتغيير اسمك (السعر يتضاعف كل مرة)`, 'error');
      return;
    }

    if (!nameChanging && !selectedAvatarColor && !pendingPhotoURL) {
      Toast.show('لا يوجد تغييرات', 'error'); return;
    }

    db.ref('users/' + user.uid).transaction(uu => {
      if (!uu) return uu;
      if (nameChanging) {
        if ((uu.coins || 0) < price) return uu; // تأكيد أخير وقت التنفيذ الفعلي (تفادي تعارض لحظي)
        uu.coins              -= price;
        uu.username            = newName;
        uu.lastUsernameChange  = Date.now();
        uu.nameChangeCount     = (uu.nameChangeCount || 0) + 1;
      }
      if (selectedAvatarColor) uu.avatarColor = selectedAvatarColor;
      if (pendingPhotoURL)     uu.photoURL    = pendingPhotoURL;
      return uu;
    }, (err, committed) => {
      if (err || !committed) { Toast.show('حدث خطأ، حاول مرة أخرى', 'error'); return; }
      Toast.show(nameChanging ? `✓ تم تغيير اسمك! (- ${price.toLocaleString('ar')} 🪙)` : '✓ تم حفظ التغييرات!', 'success');
      Sounds.play('success'); Haptic.success();

      if (nameChanging) {
        db.ref('purchase_history/' + user.uid).push({
          item: 'تغيير الاسم', category: 'profile', price,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
      }

      document.getElementById('profile-modal').style.display = 'none';
      selectedAvatarColor = null;
      pendingPhotoURL  = null;
    });
  });
}

// ===== popup الإحصائيات الكاملة =====
function showProfilePopup() {
  const existing = document.getElementById('profile-popup');
  if (existing) { existing.remove(); return; }

  const xpCurrent  = typeof currentXP !== 'undefined' ? currentXP : 0;
  const xpNeeded   = currentLevel * 100;
  const xpPct      = Math.min(100, Math.round(xpCurrent / xpNeeded * 100));
  const rewards    = [50,75,100,125,150,175,200,250,300,500];
  const streak     = typeof currentDailyStreak !== 'undefined' ? currentDailyStreak : 0;
  const nextReward = rewards[Math.min(streak, rewards.length - 1)];

  const popup = document.createElement('div');
  popup.id = 'profile-popup';
  popup.style.cssText = 'position:fixed;inset:0;z-index:999;display:flex;flex-direction:column;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px)';
  popup.onclick = e => { if (e.target === popup) popup.remove(); };

  popup.innerHTML = `
    <div style="margin-top:auto;background:linear-gradient(135deg,#0d0d20,#12122a);
      border-radius:24px 24px 0 0;border-top:1px solid rgba(168,85,247,0.3);
      max-height:85vh;overflow-y:auto;padding:20px 16px 30px">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div style="font-size:16px;font-weight:900">الملف الشخصي</div>
        <button onclick="document.getElementById('profile-popup').remove()"
          style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
            width:32px;height:32px;color:#aaa;cursor:pointer;font-size:16px">✕</button>
      </div>

      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div id="profile-popup-avatar" onclick="showEditProfile()" style="cursor:pointer;position:relative">
          <div style="width:62px;height:62px;border-radius:50%;background:${getAvatarColor(currentUsername)};
            display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;
            color:white;border:2px solid rgba(168,85,247,0.6)">
            ${currentUsername.charAt(0).toUpperCase()}
          </div>
          <div style="position:absolute;bottom:0;right:0;background:#7c3aed;border-radius:50%;
            width:20px;height:20px;display:flex;align-items:center;justify-content:center;
            font-size:10px;border:2px solid #08081a">✏️</div>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="font-size:17px;font-weight:900">${escapeHTML(currentUsername)}</span>
            ${isVIP ? '<span style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0a00;font-size:9px;padding:2px 8px;border-radius:10px;font-weight:900">★ VIP</span>' : ''}
            ${isAdmin ? '<span style="background:linear-gradient(135deg,#dc2626,#ef4444);color:white;font-size:9px;padding:2px 8px;border-radius:10px;font-weight:900">Admin</span>' : ''}
          </div>
          ${currentTitle ? `<div style="font-size:12px;color:${currentTitleColor || '#a855f7'};font-weight:700">‹${escapeHTML(currentTitle)}›</div>` : ''}
          <div style="font-size:11px;color:#9999cc">⭐ Lv.${currentLevel}</div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#555577;margin-bottom:5px">
          <span>XP</span><span>${xpCurrent} / ${xpNeeded}</span>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:7px;overflow:hidden">
          <div style="height:100%;width:${xpPct}%;background:linear-gradient(90deg,#7c3aed,#a855f7,#fbbf24);border-radius:10px"></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <button onclick="claimDaily();document.getElementById('profile-popup').remove()"
          style="padding:11px;background:linear-gradient(135deg,#059669,#10b981);color:white;
            border:none;border-radius:12px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">
          🎁 مكافأة يومية
        </button>
        <button onclick="showSection('inventory');document.getElementById('profile-popup').remove()"
          style="padding:11px;background:linear-gradient(135deg,#4c1d95,#6d28d9);color:white;
            border:1px solid rgba(168,85,247,0.3);border-radius:12px;font-weight:800;
            font-size:12px;cursor:pointer;font-family:inherit">
          🎒 حقيبتي
        </button>
      </div>

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
        border-radius:16px;padding:14px;margin-bottom:12px">
        <div style="font-size:13px;font-weight:900;color:#fbbf24;margin-bottom:12px">🎯 المهام اليومية</div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="flex:1">
            <div style="font-size:12px;font-weight:700;margin-bottom:5px">
              💬 رسائل الشات <span style="color:#555577;font-size:10px">${questChat}/5</span>
            </div>
            <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:5px;overflow:hidden;width:85%">
              <div style="height:100%;width:${Math.min(100, questChat/5*100)}%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:10px"></div>
            </div>
          </div>
          ${claimedChatQuest
            ? '<span style="color:#10b981;font-size:13px">✓</span>'
            : `<button onclick="claimQuest('chat')" ${questChat >= 5 ? '' : 'disabled'}
                style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0a00;border:none;
                  border-radius:8px;font-size:11px;padding:5px 10px;cursor:pointer;
                  font-weight:900;font-family:inherit;${questChat >= 5 ? '' : 'opacity:0.35'}">+20🪙</button>`}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="flex:1">
            <div style="font-size:12px;font-weight:700;margin-bottom:5px">
              🎲 قلب العملة <span style="color:#555577;font-size:10px">${questFlip}/3</span>
            </div>
            <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:5px;overflow:hidden;width:85%">
              <div style="height:100%;width:${Math.min(100, questFlip/3*100)}%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:10px"></div>
            </div>
          </div>
          ${claimedFlipQuest
            ? '<span style="color:#10b981;font-size:13px">✓</span>'
            : `<button onclick="claimQuest('flip')" ${questFlip >= 3 ? '' : 'disabled'}
                style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0a00;border:none;
                  border-radius:8px;font-size:11px;padding:5px 10px;cursor:pointer;
                  font-weight:900;font-family:inherit;${questFlip >= 3 ? '' : 'opacity:0.35'}">+30🪙</button>`}
        </div>
      </div>

      <div style="background:linear-gradient(135deg,#1c1500,#251d00);border:1px solid rgba(251,191,36,0.2);
        border-radius:16px;padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;font-weight:900;color:#fbbf24;margin-bottom:3px">🔥 السلسلة اليومية</div>
            <div style="font-size:11px;color:#9999cc">${streak > 0 ? streak + ' يوم متتالي 🔥' : 'ابدأ سلسلتك اليوم!'}</div>
          </div>
          <div style="text-align:left">
            <div style="font-size:10px;color:#555577;margin-bottom:2px">مكافأة الغد</div>
            <div style="font-size:15px;font-weight:900;color:#fbbf24">🪙 ${nextReward}</div>
          </div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);
        border-radius:16px;padding:14px;margin-bottom:12px">
        <div style="font-size:13px;font-weight:900;color:#a855f7;margin-bottom:10px">💸 تحويل كوينز</div>
        <input type="text"   id="tr-user"   placeholder="اسم المستخدم..." class="input-field" style="margin-bottom:8px">
        <input type="number" id="tr-amount" placeholder="الكمية..."       class="input-field" style="margin-bottom:10px">
        <button onclick="transferCoins()"
          style="width:100%;padding:11px;background:linear-gradient(135deg,#7c3aed,#a855f7);
            color:white;border:none;border-radius:12px;font-weight:900;font-size:13px;
            cursor:pointer;font-family:inherit">إرسال الآن</button>
      </div>

      ${isAdmin ? `
        <button onclick="showSection('admin-panel');document.getElementById('profile-popup').remove()"
          style="width:100%;padding:13px;background:linear-gradient(135deg,#dc2626,#ef4444);
            color:white;border:none;border-radius:14px;font-weight:900;font-size:13px;
            cursor:pointer;font-family:inherit;margin-bottom:4px">
          ⚙️ لوحة الإدارة
        </button>` : ''}
    </div>`;

  document.body.appendChild(popup);

  // نحدّث الأفتار بالصورة الحقيقية لو موجودة (بدون ما نأخر فتح البوب أب نفسه)
  const _u = auth.currentUser;
  if (_u) {
    db.ref('users/' + _u.uid + '/photoURL').once('value', snap => {
      const photoURL = snap.val();
      const avatarWrap = document.getElementById('profile-popup-avatar');
      if (photoURL && avatarWrap) {
        avatarWrap.innerHTML = `
          <img src="${photoURL}" style="width:62px;height:62px;border-radius:50%;object-fit:cover;border:2px solid rgba(168,85,247,0.6)">
          <div style="position:absolute;bottom:0;right:0;background:#7c3aed;border-radius:50%;
            width:20px;height:20px;display:flex;align-items:center;justify-content:center;
            font-size:10px;border:2px solid #08081a">✏️</div>`;
      }
    });
  }

  if (typeof listenToPrivateMessages === 'function') listenToPrivateMessages();
}

// ============================================================
//  رفع الصورة الشخصية — ضغط ورفع لـ Firebase Storage
// ============================================================

let pendingPhotoURL = null; // رابط الصورة من Storage بعد ما يخلص الرفع — يُحفظ بقاعدة البيانات عند الضغط على "حفظ"

function handlePhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    Toast.show('يرجى اختيار صورة فقط', 'error'); return;
  }

  const user = auth.currentUser; if (!user) return;
  const status = document.getElementById('upload-status');
  if (status) status.textContent = '⏳ جاري المعالجة...';

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      // ضغط الصورة عبر Canvas إلى 200×200 بكسل
      const canvas  = document.createElement('canvas');
      canvas.width  = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      // اقتصاص مربع من المنتصف
      const size = Math.min(img.width, img.height);
      const sx   = (img.width  - size) / 2;
      const sy   = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

      // معاينة فورية محلية (قبل ما يخلص الرفع الفعلي)
      updateAvatarPreviewEl(canvas.toDataURL('image/jpeg', 0.85));
      if (status) status.textContent = '⏳ جاري الرفع...';

      // تحويل الكانفاس لملف ورفعه لـ Firebase Storage
      canvas.toBlob(blob => {
        const fileRef = firebase.storage().ref('avatars/' + user.uid + '.jpg');
        fileRef.put(blob, { contentType: 'image/jpeg' })
          .then(snapshot => snapshot.ref.getDownloadURL())
          .then(url => {
            pendingPhotoURL = url;
            updateAvatarPreviewEl(url); // نبدّل المعاينة لرابط الصورة الحقيقي من Storage
            if (status) status.textContent = '✅ الصورة جاهزة — اضغط حفظ';
          })
          .catch(err => {
            console.error(err);
            if (status) status.textContent = '❌ فشل الرفع، حاول مرة ثانية';
            Toast.show('فشل رفع الصورة', 'error');
          });
      }, 'image/jpeg', 0.8);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// تحديث عنصر معاينة الصورة (يحوّل الدائرة الملوّنة لصورة فعلية أول مرة)
function updateAvatarPreviewEl(src) {
  const preview = document.getElementById('avatar-preview');
  if (!preview) return;
  if (preview instanceof HTMLImageElement) {
    preview.src = src;
  } else {
    const img2 = document.createElement('img');
    img2.id = 'avatar-preview';
    img2.src = src;
    img2.style.cssText = preview.style.cssText + 'object-fit:cover';
    preview.replaceWith(img2);
  }
}

function removePhoto() {
  const user = auth.currentUser; if (!user) return;

  db.ref('users/' + user.uid + '/photoURL').remove(err => {
    if (!err) {
      pendingPhotoURL = null;
      // نحذف الملف من Storage كمان للتنظيف (لو فشل الحذف ما يهم، الملف يصير orphan بس مالها أثر)
      firebase.storage().ref('avatars/' + user.uid + '.jpg').delete().catch(()=>{});
      Toast.show('تم حذف الصورة', 'success');
      showEditProfile();
    }
  });
}

// ============================================================
//  إحصائيات الألعاب — تُعرض في ملف اللاعب
// ============================================================

function showPlayerStats(uid) {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  saveModalSnapshot();
  modal.style.display = 'flex';
  content.innerHTML = '<div style="text-align:center;color:#705030;padding:20px">جاري التحميل...</div>';

  const gameNames = {
    million: '🃏 مليون'
  };

  db.ref('users/' + uid + '/gameStats').once('value', statsSnap => {
    db.ref('game_history/' + uid).orderByChild('timestamp').limitToLast(10).once('value', histSnap => {

      const stats   = statsSnap.val() || {};
      const history = [];
      histSnap.forEach(s => history.unshift(s.val()));

      // حساب الإجماليات
      let totalWins = 0, totalLosses = 0, totalProfit = 0;
      Object.values(stats).forEach(g => {
        totalWins   += g.wins   || 0;
        totalLosses += g.losses || 0;
        totalProfit += g.totalWon || 0;
      });
      const totalGames = totalWins + totalLosses;
      const winRate    = totalGames ? Math.round(totalWins / totalGames * 100) : 0;

      content.innerHTML = `
        <div style="text-align:right">
          <h3 style="margin:0 0 14px;color:#fbbf24;font-size:15px">📊 إحصائيات الألعاب</h3>

          <!-- ملخص عام -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
            <div style="background:rgba(46,213,115,0.1);border:1px solid rgba(46,213,115,0.3);
              border-radius:12px;padding:12px;text-align:center">
              <div style="font-size:22px;font-weight:900;color:#2ed573">${totalWins}</div>
              <div style="font-size:10px;color:#888">فوز</div>
            </div>
            <div style="background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.3);
              border-radius:12px;padding:12px;text-align:center">
              <div style="font-size:22px;font-weight:900;color:#ff4757">${totalLosses}</div>
              <div style="font-size:10px;color:#888">خسارة</div>
            </div>
            <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);
              border-radius:12px;padding:12px;text-align:center">
              <div style="font-size:22px;font-weight:900;color:#fbbf24">${winRate}%</div>
              <div style="font-size:10px;color:#888">نسبة الفوز</div>
            </div>
            <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);
              border-radius:12px;padding:12px;text-align:center">
              <div style="font-size:22px;font-weight:900;color:#a78bfa">${totalProfit.toLocaleString('ar')}</div>
              <div style="font-size:10px;color:#888">🪙 ربح كلي</div>
            </div>
          </div>

          <!-- إحصائيات كل لعبة -->
          ${Object.entries(stats).map(([id, g]) => {
            const games  = (g.wins || 0) + (g.losses || 0);
            const rate   = games ? Math.round((g.wins || 0) / games * 100) : 0;
            const barW   = rate;
            return `
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
                border-radius:12px;padding:12px;margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <span style="font-size:13px;font-weight:700">${gameNames[id] || id}</span>
                  <span style="font-size:11px;color:#888">${games} مباراة</span>
                </div>
                <div style="background:rgba(255,255,255,0.06);border-radius:6px;height:6px;overflow:hidden;margin-bottom:4px">
                  <div style="height:100%;width:${barW}%;background:linear-gradient(90deg,#2ed573,#fbbf24);border-radius:6px"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;color:#888">
                  <span style="color:#2ed573">${g.wins || 0} فوز</span>
                  <span style="color:#fbbf24">${rate}% نسبة الفوز</span>
                  <span style="color:#ff4757">${g.losses || 0} خسارة</span>
                </div>
              </div>`;
          }).join('') || '<div style="text-align:center;color:#555;padding:16px;font-size:12px">لا توجد إحصائيات بعد</div>'}

          <!-- آخر المباريات -->
          ${history.length ? `
            <div style="font-size:12px;color:#888;margin:12px 0 8px">⏱️ آخر المباريات</div>
            ${history.map(h => `
              <div style="display:flex;justify-content:space-between;align-items:center;
                padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px">
                <span>${gameNames[h.game] || h.game}</span>
                <span style="color:${h.isWin ? '#2ed573' : '#ff4757'};font-weight:700">
                  ${h.isWin ? '+' : ''}${h.profit} 🪙
                </span>
              </div>`).join('')}
          ` : ''}
        </div>`;
    });
  });
}