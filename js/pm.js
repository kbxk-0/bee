// ============================================================
//  js/pm.js — bee platform
//  نظام الرسائل الخاصة — صندوق وارد + محادثات
// ============================================================

let pmPanelListener = null;

// ===== فتح صندوق الوارد =====
function openInbox() {
  document.getElementById('pm-panel')?.remove();
  const user = auth.currentUser; if (!user) return;

  const panel = document.createElement('div');
  panel.id    = 'pm-panel';
  panel.style.cssText = `
    position:fixed;inset:0;z-index:8500;background:#0a0a14;
    display:flex;flex-direction:column;font-family:inherit;direction:rtl;
  `;

  panel.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.07);
      display:flex;align-items:center;gap:12px;flex-shrink:0">
      <button onclick="closeInbox()"
        style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:36px;height:36px;color:#aaa;cursor:pointer;font-size:16px;flex-shrink:0">←</button>
      <h2 style="margin:0;font-size:16px;color:#f0e8d0;flex:1">💬 الرسائل الخاصة</h2>
      <button onclick="openNewMessage()"
        style="background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0e00;
          border:none;border-radius:10px;padding:8px 14px;font-size:12px;
          font-weight:900;cursor:pointer;font-family:inherit">
        + جديد
      </button>
    </div>
    <div id="inbox-list" style="flex:1;overflow-y:auto">
      <div style="text-align:center;color:#555;padding:40px;font-size:13px">جاري التحميل...</div>
    </div>`;

  document.body.appendChild(panel);
  loadInbox(user.uid);
}

function closeInbox() {
  if (pmPanelListener) { pmPanelListener.off(); pmPanelListener = null; }
  document.getElementById('pm-panel')?.remove();
}

// ===== تحميل صندوق الوارد =====
function loadInbox(uid) {
  const list = document.getElementById('inbox-list'); if (!list) return;

  db.ref('conversations').orderByChild('participants/' + uid).equalTo(true)
    .once('value', snap => {
      if (!snap.exists()) {
        list.innerHTML = `
          <div style="text-align:center;padding:60px 20px">
            <div style="font-size:48px;margin-bottom:12px">💬</div>
            <div style="color:#555;font-size:13px;margin-bottom:16px">لا توجد محادثات بعد</div>
            <button onclick="openNewMessage()"
              style="padding:10px 24px;background:linear-gradient(135deg,#c8a940,#f0c040);
                color:#1a0e00;border:none;border-radius:10px;font-weight:900;
                cursor:pointer;font-family:inherit">
              ابدأ محادثة جديدة
            </button>
          </div>`;
        return;
      }

      const convs = [];
      snap.forEach(s => convs.push({ id: s.key, ...s.val() }));
      convs.sort((a, b) => (b.lastTime || 0) - (a.lastTime || 0));

      list.innerHTML = convs.map(c => {
        const otherUid  = Object.keys(c.participants || {}).find(id => id !== uid) || '';
        const otherName = c.names?.[otherUid] || 'لاعب';
        const unread    = c.unread?.[uid] || 0;
        const lastMsg   = c.lastMessage || '';
        const lastTime  = c.lastTime ? timeAgoShort(c.lastTime) : '';

        return `
          <div onclick="openConversation('${c.id}','${otherUid}','${escapeHTML(otherName)}')"
            style="display:flex;align-items:center;gap:12px;padding:14px 16px;
              border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;
              background:${unread ? 'rgba(200,169,64,0.05)' : 'transparent'}">
            <div style="width:46px;height:46px;border-radius:50%;
              background:${getAvatarColor(otherName)};flex-shrink:0;
              display:flex;align-items:center;justify-content:center;
              font-size:20px;font-weight:900;color:white;position:relative">
              ${otherName.charAt(0).toUpperCase()}
              ${unread ? `<div style="position:absolute;top:-2px;right:-2px;background:#ff4757;
                color:white;font-size:9px;font-weight:bold;min-width:16px;height:16px;
                border-radius:8px;display:flex;align-items:center;justify-content:center;
                padding:0 3px;border:2px solid #0a0a14">${unread > 9 ? '9+' : unread}</div>` : ''}
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <span style="font-size:14px;font-weight:${unread?'800':'600'};color:#f0e8d0">
                  ${escapeHTML(otherName)}
                </span>
                <span style="font-size:10px;color:#555">${lastTime}</span>
              </div>
              <div style="font-size:12px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${escapeHTML(lastMsg || 'ابدأ المحادثة...')}
              </div>
            </div>
          </div>`;
      }).join('');
    });
}

// ===== فتح محادثة =====
function openConversation(convId, otherUid, otherName) {
  const panel = document.getElementById('pm-panel'); if (!panel) return;
  const user  = auth.currentUser; if (!user) return;

  // صفّر الرسائل غير المقروءة
  db.ref('conversations/' + convId + '/unread/' + user.uid).set(0);

  panel.innerHTML = `
    <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.07);
      display:flex;align-items:center;gap:10px;flex-shrink:0">
      <button onclick="openInbox()"
        style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:34px;height:34px;color:#aaa;cursor:pointer;font-size:14px;flex-shrink:0">←</button>
      <div onclick="viewProfile('${otherUid}')" style="cursor:pointer;
        width:36px;height:36px;border-radius:50%;background:${getAvatarColor(otherName)};
        display:flex;align-items:center;justify-content:center;
        font-size:16px;font-weight:900;color:white;flex-shrink:0">
        ${otherName.charAt(0).toUpperCase()}
      </div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700;color:#f0e8d0">${escapeHTML(otherName)}</div>
        <div id="other-online-status" style="font-size:10px;color:#555">جاري التحقق...</div>
      </div>
      <button onclick="openNewMessageTo('${otherUid}','${escapeHTML(otherName)}')"
        style="background:none;border:none;color:#555;cursor:pointer;font-size:18px">⋮</button>
    </div>

    <div id="conv-messages" style="flex:1;overflow-y:auto;padding:12px;
      display:flex;flex-direction:column;gap:8px"></div>

    <div style="padding:10px 12px;border-top:1px solid rgba(255,255,255,0.07);
      display:flex;gap:8px;flex-shrink:0;background:#0d0d1e">
      <input type="text" id="pm-input" placeholder="اكتب رسالة..."
        class="input-field" style="flex:1"
        onkeydown="if(event.key==='Enter') sendPM('${convId}','${otherUid}','${escapeHTML(otherName)}')">
      <button onclick="sendPM('${convId}','${otherUid}','${escapeHTML(otherName)}')"
        style="width:42px;height:42px;background:linear-gradient(135deg,#c8a940,#f0c040);
          color:#1a0e00;border:none;border-radius:10px;font-size:16px;
          cursor:pointer;flex-shrink:0;font-weight:900">➤</button>
    </div>`;

  // حالة الأونلاين
  db.ref('online/' + otherUid).once('value', snap => {
    const el = document.getElementById('other-online-status');
    if (el) el.innerHTML = snap.exists()
      ? '<span style="color:#2ed573">● متصل الآن</span>'
      : '<span style="color:#555">● غير متصل</span>';
  });

  loadConversationMessages(convId, user.uid);
}

function loadConversationMessages(convId, myUid) {
  const box = document.getElementById('conv-messages'); if (!box) return;
  if (pmPanelListener) { pmPanelListener.off(); }

  pmPanelListener = db.ref('conversations/' + convId + '/messages').limitToLast(50);
  pmPanelListener.on('child_added', snap => {
    const msg   = snap.val(); if (!msg) return;
    const isMine = msg.senderUid === myUid;

    const bubble = document.createElement('div');
    bubble.style.cssText = `
      max-width:75%;word-break:break-word;padding:9px 12px;
      border-radius:${isMine ? '14px 14px 0 14px' : '14px 14px 14px 0'};
      font-size:13px;line-height:1.5;
      background:${isMine ? 'linear-gradient(135deg,#c8a940,#f0c040)' : 'rgba(255,255,255,0.08)'};
      color:${isMine ? '#1a0e00' : '#f0e8d0'};
      align-self:${isMine ? 'flex-end' : 'flex-start'};
    `;

    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'}) : '';
    bubble.innerHTML = `${escapeHTML(msg.text)}<div style="font-size:9px;opacity:0.6;margin-top:3px;text-align:${isMine?'left':'right'}">${time}</div>`;

    box.appendChild(bubble);
    box.scrollTop = box.scrollHeight;
  });
}

// ===== إرسال رسالة خاصة =====
function sendPM(convId, otherUid, otherName) {
  const input = document.getElementById('pm-input');
  const user  = auth.currentUser;
  if (!user || !input) return;
  if (isMuted) { alert('أنت مكتوم!'); return; }

  const text = input.value.trim(); if (!text) return;
  input.value = '';

  const msg = {
    senderUid: user.uid, senderName: currentUsername,
    text, timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  db.ref('conversations/' + convId + '/messages').push(msg);
  db.ref('conversations/' + convId).update({
    lastMessage: text, lastTime: firebase.database.ServerValue.TIMESTAMP,
    ['unread/' + otherUid]: firebase.database.ServerValue.increment(1)
  });

  // إشعار للمستلم
  if (typeof sendNotification === 'function')
    sendNotification(otherUid, 'pm', `رسالة من ${currentUsername}`, text.substring(0, 60));
  if (typeof showBrowserNotif === 'function')
    showBrowserNotif(`رسالة من ${currentUsername}`, text);
}

// ===== فتح محادثة جديدة =====
function openNewMessage() {
  const panel = document.getElementById('pm-panel'); if (!panel) return;
  const user  = auth.currentUser; if (!user) return;

  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.7);display:flex;align-items:flex-end';
  div.onclick = e => { if (e.target === div) div.remove(); };

  div.innerHTML = `
    <div style="width:100%;background:#1a1a28;border-radius:20px 20px 0 0;
      padding:20px 16px 30px;font-family:inherit;direction:rtl">
      <h3 style="margin:0 0 14px;color:#f0e8d0;font-size:15px">💬 محادثة جديدة</h3>
      <input type="text" id="new-msg-search"
        placeholder="ابحث عن لاعب (3 حروف)..."
        oninput="searchForNewMessage(this.value)"
        class="input-field" style="margin-bottom:10px;width:100%;box-sizing:border-box">
      <div id="new-msg-results"></div>
    </div>`;

  document.body.appendChild(div);
  setTimeout(() => document.getElementById('new-msg-search')?.focus(), 100);
}

function searchForNewMessage(val) {
  const res = document.getElementById('new-msg-results'); if (!res) return;
  const q   = val.trim();
  if (q.length < 3) { res.innerHTML = ''; return; }
  const myUid = auth.currentUser?.uid;

  db.ref('users').orderByChild('username')
    .startAt(q).endAt(q + '\uf8ff').limitToFirst(6)
    .once('value', snap => {
      if (!snap.exists()) { res.innerHTML = '<div style="color:#555;font-size:12px;text-align:center;padding:12px">لا نتائج</div>'; return; }
      res.innerHTML = '';
      snap.forEach(s => {
        if (s.key === myUid) return;
        const u   = s.val();
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;cursor:pointer;background:rgba(255,255,255,0.04);margin-bottom:6px';
        div.innerHTML = `
          <div style="width:38px;height:38px;border-radius:50%;background:${getAvatarColor(u.username||'?')};
            display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:white">
            ${(u.username||'?').charAt(0).toUpperCase()}
          </div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#f0e8d0">${escapeHTML(u.username||'لاعب')}</div>
            <div style="font-size:10px;color:#555">Lv.${u.level||1}</div>
          </div>
          <span style="color:#c8a940;font-size:12px">محادثة →</span>`;
        div.onclick = () => {
          document.querySelectorAll('[style*="z-index:9000"]').forEach(el => el.remove());
          startConversationWith(s.key, u.username || 'لاعب');
        };
        res.appendChild(div);
      });
    });
}

function startConversationWith(otherUid, otherName) {
  const user = auth.currentUser; if (!user) return;
  const ids  = [user.uid, otherUid].sort();
  const convId = ids[0] + '_' + ids[1];

  db.ref('conversations/' + convId).once('value', snap => {
    if (!snap.exists()) {
      db.ref('conversations/' + convId).set({
        participants: { [user.uid]: true, [otherUid]: true },
        names: { [user.uid]: currentUsername, [otherUid]: otherName },
        lastMessage: '', lastTime: Date.now(),
        unread: { [user.uid]: 0, [otherUid]: 0 }
      });
    }
    openConversation(convId, otherUid, otherName);
  });
}

// للاستخدام من منيو الشات بدل prompt()
function openNewMessageTo(targetUid, targetName) {
  startConversationWith(targetUid, targetName);
}

// دالة مساعدة للوقت
function timeAgoShort(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'الآن';
  if (m < 60) return m + 'د';
  if (h < 24) return h + 'س';
  return d + 'ي';
}
