// ============================================================
//  js/chat.js — bee platform
// ============================================================

function triggerMarquee(text) {
  const el = document.getElementById('marquee-content');
  if (!el) return;
  el.innerText = text;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'moveMarquee 8s 2 linear';
}

// ===== الشات العام =====
function listenToGlobalChat() {
  const chat = document.getElementById('chat-messages');
  if (!chat) return;
  if (chatListener) { chat.scrollTop = chat.scrollHeight; return; }
  chat.innerHTML = '';

  chatListener = db.ref('global_chat').limitToLast(50);
  chatListener.on('child_added', snap => {
    const msg = snap.val();
    if (!msg) return;

    const isMine = auth.currentUser && msg.uid === auth.currentUser.uid;
    const color  = getAvatarColor(msg.sender || '؟');
    const letter = (msg.sender || '؟').charAt(0).toUpperCase();

    const time = msg.timestamp
      ? new Date(msg.timestamp).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})
      : '';

    // شارات
    const lvlTag   = msg.level  ? `<span style="background:#ffd700;color:black;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:bold">Lv.${msg.level}</span> ` : '';
    const vipTag   = msg.isVIP  ? `<span style="background:#ffa500;color:black;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:bold">VIP</span> ` : '';
    const clanTag  = msg.clan   ? `<span style="color:#2ed573;font-size:11px;font-weight:bold">[${escapeHTML(msg.clan)}] </span>` : '';
    const titleTag = msg.title  ? `<span style="color:${msg.titleColor||'#fff'};font-size:11px;font-weight:bold">‹${escapeHTML(msg.title)}› </span>` : '';
    const muteBtn  = isAdmin    ? `<button onclick="toggleMuteUser('${msg.uid}')" style="float:left;background:#ff4757;color:white;border:none;border-radius:3px;font-size:9px;padding:2px 5px;cursor:pointer;margin-bottom:3px">كتم</button>` : '';

    // الأفاتار دائرة ملونة بالحرف الأول
    const avatar = `<div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;color:white;flex-shrink:0">${letter}</div>`;

    const wrap = document.createElement('div');
    wrap.style.cssText = `display:flex;align-items:flex-end;gap:7px;${isMine ? 'flex-direction:row-reverse' : ''}`;

    const bubble = document.createElement('div');
    bubble.style.cssText = isMine
      ? 'background:#6c63ff;color:white;border-radius:12px 12px 0 12px;padding:8px 11px;max-width:72%;font-size:13px;word-break:break-word;line-height:1.5'
      : 'background:#1e1e2e;color:#e8e8f0;border-radius:12px 12px 12px 0;padding:8px 11px;max-width:72%;font-size:13px;word-break:break-word;border:1px solid #2a2a3f;line-height:1.5';

    bubble.innerHTML = `${muteBtn}${clanTag}${titleTag}<strong style="font-size:11px">${escapeHTML(msg.sender)}</strong> ${lvlTag}${vipTag}<br>${escapeHTML(msg.text)}<div style="font-size:9px;opacity:0.5;margin-top:3px;text-align:${isMine?'left':'right'}">${time}</div>`;

    wrap.appendChild(isMine ? bubble : document.createTextNode(''));
    wrap.innerHTML = isMine
      ? `${avatar.replace('div style="', 'div style="align-self:flex-end;')}${bubble.outerHTML}`
      : `${avatar}${bubble.outerHTML}`;

    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  });
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const user  = auth.currentUser;
  if (!user || !input) return;
  if (isMuted) { alert("أنت مكتوم ولا يمكنك الإرسال!"); return; }
  const text = input.value.trim();
  if (!text) return;

  db.ref('global_chat').push({
    uid: user.uid, sender: currentUsername,
    level: currentLevel, isVIP, clan: currentClan,
    title: currentTitle, titleColor: currentTitleColor,
    text: escapeHTML(text),
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });

  db.ref('users/'+user.uid).transaction(u => {
    if (!u) return u;
    u.coins = (u.coins||0) + 1;
    u.xp    = (u.xp||0) + 10;
    if (u.xp >= u.level * 100) u.level = (u.level||1) + 1;
    if (!u.quests) u.quests = {};
    if (!u.quests.chatClaimed) u.quests.chatProgress = (u.quests.chatProgress||0) + 1;
    return u;
  });
  input.value = '';
}

// ===== الرسائل الخاصة =====
function listenToPrivateMessages() {
  const pmBox = document.getElementById('private-messages-box');
  if (!pmBox || !auth.currentUser) return;
  if (pmListener) return;
  pmBox.innerHTML = '';

  pmListener = db.ref('private_messages').limitToLast(30);
  pmListener.on('child_added', snap => {
    const pm = snap.val();
    if (!pm) return;
    if (pm.senderUid !== auth.currentUser.uid && pm.receiverUid !== auth.currentUser.uid) return;

    const isMine = pm.senderUid === auth.currentUser.uid;
    const color  = getAvatarColor(isMine ? pm.receiverName : pm.senderName);
    const who    = isMine ? `أنت → ${escapeHTML(pm.receiverName)}` : `${escapeHTML(pm.senderName)} → أنت`;

    const div = document.createElement('div');
    div.style.cssText = `display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1a1a28`;
    div.innerHTML = `
      <div style="width:26px;height:26px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:white;flex-shrink:0">
        ${(isMine ? pm.receiverName : pm.senderName || '؟').charAt(0).toUpperCase()}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:10px;color:#666;margin-bottom:2px">${who}</div>
        <div style="font-size:12px;color:${isMine?'#a78bfa':'#34d399'}">${escapeHTML(pm.text)}</div>
      </div>`;
    pmBox.appendChild(div);
    pmBox.scrollTop = pmBox.scrollHeight;
  });
}

function sendPrivateMessage() {
  const target = document.getElementById('pm-target');
  const input  = document.getElementById('pm-input');
  const user   = auth.currentUser;
  if (!user || !target || !input) return;
  if (isMuted) { alert("أنت مكتوم!"); return; }
  const targetName = target.value.trim();
  const text       = input.value.trim();
  if (!targetName || !text) { alert("يرجى إدخال الاسم والرسالة"); return; }

  db.ref('users').orderByChild('username').equalTo(targetName).once('value', snap => {
    if (!snap.exists()) { alert("المستخدم غير موجود!"); return; }
    const targetUid = Object.keys(snap.val())[0];
    db.ref('private_messages').push({
      senderUid: user.uid, senderName: currentUsername,
      receiverUid: targetUid, receiverName: targetName,
      text: escapeHTML(text),
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    // أضف إشعار للمستلم
    incrementUnreadPM(targetUid);
    showBrowserNotif(`رسالة من ${currentUsername}`, text);

    input.value = '';
    alert("تم الإرسال ✓");
  });
}

// ===== شات الكلان =====
function listenToClanChat() {
  const chatBox = document.getElementById('clan-chat-messages');
  if (!chatBox || !currentClan) return;
  if (clanChatListener) { clanChatListener.off(); clanChatListener = null; chatBox.innerHTML = ''; }

  clanChatListener = db.ref('clan_chats/'+currentClan).limitToLast(30);
  clanChatListener.on('child_added', snap => {
    const msg = snap.val();
    if (!msg) return;
    const isMine = auth.currentUser && msg.uid === auth.currentUser.uid;
    const color  = getAvatarColor(msg.sender || '؟');
    const letter = (msg.sender || '؟').charAt(0).toUpperCase();

    const avatar = `<div style="width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;color:white;flex-shrink:0">${letter}</div>`;
    const bubble = `<div style="background:${isMine?'#2a4f2a':'#1e1e2e'};color:${isMine?'#2ed573':'#e8e8f0'};border-radius:${isMine?'12px 12px 0 12px':'12px 12px 12px 0'};padding:8px 11px;max-width:75%;font-size:13px;word-break:break-word;border:1px solid #2a2a3f">
      <strong style="font-size:11px;color:${color}">${escapeHTML(msg.sender)}</strong><br>${escapeHTML(msg.text)}
    </div>`;

    const wrap = document.createElement('div');
    wrap.style.cssText = `display:flex;align-items:flex-end;gap:7px;${isMine?'flex-direction:row-reverse':''}`;
    wrap.innerHTML = `${avatar}${bubble}`;
    chatBox.appendChild(wrap);
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

function sendClanMessage() {
  const input = document.getElementById('clan-chat-input');
  const user  = auth.currentUser;
  if (!user || !currentClan || !input) return;
  if (isMuted) { alert("أنت مكتوم!"); return; }
  const text = input.value.trim();
  if (!text) return;
  db.ref('clan_chats/'+currentClan).push({
    uid: user.uid, sender: currentUsername,
    title: currentTitle, titleColor: currentTitleColor,
    text: escapeHTML(text),
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  input.value = '';
}

// ===== أدوات الشات للإدارة =====
function renderAdminChatPanel() {
  if (!isAdmin) return;
  // لوحة بسيطة تظهر في قسم الشات إذا كان المستخدم مشرفاً
  let panel = document.getElementById('chat-admin-bar');
  if (panel) return;
  panel = document.createElement('div');
  panel.id = 'chat-admin-bar';
  panel.style.cssText = 'padding:6px 10px;background:#2a0a0a;border-bottom:1px solid #ff4757;font-size:11px;color:#ff4757;text-align:center';
  panel.innerHTML = `🛡️ وضع الإشراف مفعّل · <button onclick="showSection('admin-panel')" style="background:none;border:none;color:#ff4757;font-size:11px;cursor:pointer;text-decoration:underline">فتح لوحة التحكم</button>`;
  const chatSec = document.getElementById('chat');
  if (chatSec) chatSec.prepend(panel);
}

function toggleMuteUser(uid) {
  db.ref('users/'+uid+'/isMuted').once('value', snap => {
    const muted = snap.val() || false;
    db.ref('users/'+uid+'/isMuted').set(!muted, e => {
      if (!e) alert(muted ? "تم إلغاء الكتم!" : "تم الكتم!");
    });
  });
}
