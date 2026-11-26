// ============================================================
//  js/friends.js — bee platform
//  نظام الأصدقاء
// ============================================================

function showFriendsPanel() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  resetModalStack();
  modal.style.display = 'flex';

  const user = auth.currentUser; if (!user) return;

  content.innerHTML = `
    <div style="text-align:right">
      <h3 style="margin:0 0 12px;color:#f0c040;font-size:15px">👥 الأصدقاء</h3>
      <div style="margin-bottom:12px">
        <input type="text" id="friend-search-input" placeholder="ابحث عن لاعب (اكتب 3 حروف)..."
          class="input-field" style="width:100%;font-size:12px;box-sizing:border-box"
          oninput="liveSearchPlayer(this.value)">
      </div>
      <div id="friend-search-result" style="margin-bottom:12px"></div>
      <div style="font-size:11px;color:#705030;margin-bottom:8px">أصدقاؤك</div>
      <div id="friends-list-content" style="display:flex;flex-direction:column;gap:8px">
        <div style="text-align:center;color:#705030;padding:20px;font-size:12px">جاري التحميل...</div>
      </div>
    </div>`;

  db.ref('friends/' + user.uid).once('value', snap => {
    const list    = document.getElementById('friends-list-content');
    const friends = snap.val();

    if (!list) return;
    if (!friends || Object.keys(friends).length === 0) {
      list.innerHTML = '<div style="text-align:center;color:#705030;padding:20px;font-size:12px">لا يوجد أصدقاء بعد<br>ابحث عن لاعب وأضفه</div>';
      return;
    }

    list.innerHTML = '';
    Object.keys(friends).forEach(fUid => {
      db.ref('users/' + fUid).once('value', s => {
        const f = s.val(); if (!f) return;
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px;background:rgba(200,169,64,0.06);border:1px solid rgba(200,169,64,0.15);border-radius:12px;cursor:pointer';
        div.onclick = () => viewProfile(fUid);

        const av = f.photoURL
          ? `<img src="${f.photoURL}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid rgba(200,169,64,0.4)">`
          : `<div style="width:38px;height:38px;border-radius:50%;background:${getAvatarColor(f.username||'?')};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:white">${(f.username||'?').charAt(0).toUpperCase()}</div>`;

        getFriendOnlineStatus(fUid, isOnline => {
          div.innerHTML = `${av}
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:#f0e8d0">${renderOnlineDot(isOnline)}${escapeHTML(f.username || 'لاعب')}</div>
              <div style="font-size:10px;color:#705030">Lv.${f.level || 1} · ${isOnline ? "<span style='color:#2ed573'>أونلاين</span>" : "أوفلاين"}</div>
            </div>
            <button onclick="event.stopPropagation();openGiftPicker('${fUid}','${escapeHTML(f.username||'')}')"
              style="background:rgba(200,169,64,0.12);border:1px solid rgba(200,169,64,0.3);
                border-radius:8px;font-size:15px;padding:5px 9px;cursor:pointer;flex-shrink:0">
              🎁
            </button>
            <span style="color:#705030;font-size:11px">←</span>`;
          list.appendChild(div);
        });
      });
    });
  });

  // تحديث عداد الأصدقاء
  db.ref('friends/' + user.uid).once('value', snap => {
    const badge = document.getElementById('friends-count-badge');
    if (badge) badge.textContent = snap.numChildren() + ' صديق';
  });
}

function liveSearchPlayer(val) {
  const res   = document.getElementById('friend-search-result');
  const myUid = auth.currentUser?.uid;
  if (!res) return;

  const query = val.trim();
  if (query.length < 3) { res.innerHTML = ''; return; }

  res.innerHTML = '<div style="font-size:11px;color:#705030;padding:4px">جاري البحث...</div>';

  db.ref('users')
    .orderByChild('username')
    .startAt(query)
    .endAt(query + '\uf8ff')
    .limitToFirst(8)
    .once('value', snap => {
      if (!snap.exists()) {
        res.innerHTML = '<div style="font-size:11px;color:#c03030;padding:4px">لا نتائج</div>';
        return;
      }

      const results = [];
      snap.forEach(child => {
        if (child.key !== myUid) results.push({ uid: child.key, ...child.val() });
      });

      if (!results.length) {
        res.innerHTML = '<div style="font-size:11px;color:#705030;padding:4px">لا نتائج</div>';
        return;
      }

      res.innerHTML = results.map(u => {
        const av = u.photoURL
          ? `<img src="${u.photoURL}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">`
          : `<div style="width:36px;height:36px;border-radius:50%;background:${getAvatarColor(u.username||'?')};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:white">${(u.username||'?').charAt(0).toUpperCase()}</div>`;

        return `
          <div style="display:flex;align-items:center;gap:10px;padding:9px 10px;
            background:rgba(200,169,64,0.06);border:1px solid rgba(200,169,64,0.15);
            border-radius:10px;margin-bottom:6px">
            <div onclick="viewProfile('${u.uid}')" style="cursor:pointer;flex-shrink:0">${av}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#f0e8d0">${escapeHTML(u.username || 'لاعب')}</div>
              <div style="font-size:10px;color:#705030">Lv.${u.level || 1}</div>
            </div>
            <button onclick="sendFriendRequest('${u.uid}','${escapeHTML(u.username||'')}',this)"
              style="background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0e00;border:none;
                border-radius:8px;font-size:11px;padding:5px 10px;cursor:pointer;font-weight:900;flex-shrink:0">
              + إضافة
            </button>
          </div>`;
      }).join('');
    });
}

// إبقاء البحث القديم للتوافق
function searchPlayer() {
  const inp = document.getElementById('friend-search-input');
  if (inp) liveSearchPlayer(inp.value);
}

function sendFriendRequest(targetUid, targetName, btn) {
  const user = auth.currentUser; if (!user) return;
  if (btn) { btn.disabled = true; btn.textContent = '✓ تم'; }

  db.ref('friends/' + user.uid + '/' + targetUid).once('value', snap => {
    if (snap.val()) { Toast.show('أنتما أصدقاء بالفعل!', 'error'); return; }
    db.ref('friends/' + user.uid + '/' + targetUid).set(true);
    db.ref('friends/' + targetUid + '/' + user.uid).set(true);
    if (typeof sendNotification === 'function')
      sendNotification(targetUid, 'friend_add', 'طلب صداقة جديد', `${currentUsername} أضافك كصديق!`);
    Toast.show(`تمت إضافة ${targetName} كصديق!`, 'success');
    Sounds.play('friendRequest'); Haptic.success();
  });
}

// ===== نقطة الأونلاين للأصدقاء فقط =====
function getFriendOnlineStatus(uid, callback) {
  db.ref('online/' + uid).once('value', snap => {
    callback(snap.exists());
  });
}

function renderOnlineDot(isOnline) {
  return isOnline
    ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;
        background:#2ed573;margin-right:4px;box-shadow:0 0 4px #2ed573"></span>`
    : `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;
        background:#555;margin-right:4px"></span>`;
}

// ============================================================
//  نظام الهدايا — يحترم إعداد الخصوصية "السماح بالهدايا"
//  (نفس الكاتالوج المستخدم بزر "🎁 هدية" بصفحة البروفايل الكاملة — chat.js)
// ============================================================
const GIFT_CATALOG = {
  gift_honey: { emoji: '🍯', name: 'عسل ملكي',   cost: 20  },
  gift_bee:   { emoji: '🐝', name: 'نحلة ذهبية', cost: 50  },
  gift_crown: { emoji: '👑', name: 'تاج النخبة', cost: 200 },
};

function openGiftPicker(targetUid, targetName) {
  document.getElementById('gift-picker-popup')?.remove();

  const popup = document.createElement('div');
  popup.id = 'gift-picker-popup';
  popup.style.cssText = `
    position:fixed;inset:0;z-index:9600;
    background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;
    padding:16px;font-family:inherit;direction:rtl;
  `;
  popup.innerHTML = `
    <div style="background:linear-gradient(135deg,#0d0d20,#1a1030);border:1px solid rgba(200,169,64,0.4);
      border-radius:20px;padding:18px;max-width:300px;width:100%">
      <div style="font-size:14px;font-weight:900;color:#f0c040;margin-bottom:4px">🎁 إرسال هدية</div>
      <div style="font-size:11px;color:#888;margin-bottom:14px">إلى ${escapeHTML(targetName)}</div>
      ${Object.entries(GIFT_CATALOG).map(([id, g]) => `
        <button onclick="sendGift('${targetUid}','${escapeHTML(targetName)}','${id}')"
          style="width:100%;padding:12px;background:rgba(200,169,64,0.08);color:#f0e8d0;
            border:1px solid rgba(200,169,64,0.25);border-radius:10px;margin-bottom:8px;
            font-size:13px;font-weight:700;cursor:pointer;
            display:flex;justify-content:space-between;align-items:center;font-family:inherit">
          <span>${g.emoji} ${g.name}</span>
          <span style="color:#fbbf24;font-weight:900">${g.cost} 🪙</span>
        </button>`).join('')}
      <button onclick="document.getElementById('gift-picker-popup').remove()"
        style="width:100%;padding:9px;background:rgba(255,255,255,0.06);color:#888;
          border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-size:12px;
          cursor:pointer;font-family:inherit">إلغاء</button>
    </div>`;
  document.body.appendChild(popup);
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
}

// ملاحظة: نفس هذي الدالة يستدعيها زر "🎁 هدية" بصفحة البروفايل الكاملة (chat.js) أيضاً
function sendGift(targetUid, targetName, giftId) {
  const gift = GIFT_CATALOG[giftId];
  if (!gift) return;
  const user = auth.currentUser; if (!user) return;
  if (currentCoins < gift.cost) { Toast.show('رصيدك غير كافٍ لهذي الهدية!', 'error'); Sounds.play('error'); return; }

  // نحترم إعداد خصوصية المستلم "السماح بالهدايا"
  db.ref('users/' + targetUid + '/privacy/allowGifts').once('value', snap => {
    if (snap.val() === false) {
      Toast.show(`${targetName} لا يستقبل هدايا حالياً`, 'error');
      document.getElementById('gift-picker-popup')?.remove();
      if (typeof closePlayerMenu === 'function') closePlayerMenu();
      return;
    }

    db.ref('users/' + user.uid).transaction(u => {
      if (u && u.coins >= gift.cost) u.coins -= gift.cost;
      return u;
    }, (err, committed) => {
      if (!committed) { Toast.show('فشل إرسال الهدية، حاول مرة أخرى', 'error'); return; }

      // إشعار فوري (نفس النظام الجاهز بـauth.js — amount:0 لأنها هدية رمزية مو تحويل كوينز)
      db.ref('transfers/' + targetUid).push({
        from: currentUsername, amount: 0, type: 'gift',
        giftEmoji: gift.emoji, giftName: gift.name,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      // سجل دائم لهدايا المستلم (يبقى حتى بعد اختفاء الإشعار اللحظي)
      db.ref('gift_history/' + targetUid).push({
        from: currentUsername, giftEmoji: gift.emoji, giftName: gift.name,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      Toast.show(`🎁 أرسلت ${gift.emoji} ${gift.name} إلى ${targetName}!`, 'gold');
      Sounds.play('purchase'); Haptic.success();
      document.getElementById('gift-picker-popup')?.remove();
      if (typeof closePlayerMenu === 'function') closePlayerMenu();
    });
  });
}
