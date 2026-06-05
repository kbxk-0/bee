// ============================================================
//  js/friends.js — bee platform
//  نظام الأصدقاء
// ============================================================

function showFriendsPanel() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
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
    if (snap.val()) { alert('أنتما أصدقاء بالفعل!'); return; }
    db.ref('friends/' + user.uid + '/' + targetUid).set(true);
    db.ref('friends/' + targetUid + '/' + user.uid).set(true);
    if (typeof sendNotification === 'function')
      sendNotification(targetUid, 'friend_add', 'طلب صداقة جديد', `${currentUsername} أضافك كصديق!`);
    alert(`تمت إضافة ${targetName} كصديق!`);
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
