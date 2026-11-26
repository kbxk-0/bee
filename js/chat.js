// ============================================================
//  js/chat.js — bee platform
//  الشات العام + الرسائل الخاصة + لوحة تحكم الشات
// ============================================================

function triggerMarquee(text) {
  const el = document.getElementById('marquee-content');
  if (!el) return;
  el.innerText = text;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'moveMarquee 8s 2 linear';
}

function showToastTransfer(fromName, amount) {
  Toast.show(`💰 استلمت ${amount} 🪙 من ${fromName}`, 'gold');
  Sounds.play('coins');
  Haptic.success();
}

// ============================================================
//  الشات العام
// ============================================================
function listenToGlobalChat() {
  const chat = document.getElementById('chat-messages');
  if (!chat) return;

  if (chatListener) { chat.scrollTop = chat.scrollHeight; return; }
  chat.innerHTML = '';

  renderChatControlPanel();
  watchModPermissions();

  let initialChatLoad = true;
  chatListener = db.ref('global_chat').limitToLast(50);
  setTimeout(() => { initialChatLoad = false; }, 1500);

  // رسالة جديدة
  chatListener.on('child_added', snap => {
    const msg = snap.val();
    if (!msg) return;

    // ── إعلان مارقي ──
    if (msg.type === 'marquee') {
      // تجاهل الإعلانات القديمة عند فتح الشات (أقدم من 5 دقائق)
      if (!msg.timestamp || Date.now() - msg.timestamp > 5 * 60 * 1000) return;
      showChatAnnouncement(msg.text, msg.isAdmin, msg.sender);
      return;
    }

    const wrap = buildMessageElement(snap.key, msg);
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
    // صوت للرسائل الجديدة فقط (بعد التحميل الأولي)
    if (!initialChatLoad && msg.uid !== auth.currentUser?.uid) {
      Sounds.play('message');
      Haptic.light();
    }
  });

  // ── حذف فوري بدون إعادة تحميل ──
  chatListener.on('child_removed', snap => {
    document.querySelector(`[data-msg-id="${snap.key}"]`)?.remove();
  });
}

// ── إعلان مارقي داخل منطقة الشات ──
function showChatAnnouncement(text, isAdmin, sender) {
  document.getElementById('chat-announce-overlay')?.remove();

  const chatSection = document.getElementById('chat');
  if (!chatSection) return;

  const bar = document.createElement('div');
  bar.id = 'chat-announce-overlay';

  if (isAdmin) {
    bar.style.cssText = `
      background: linear-gradient(135deg,#5a0000,#960000);
      border-bottom: 1px solid rgba(255,50,50,0.3);
      box-shadow: 0 3px 16px rgba(180,0,0,0.3);
      color: white;
      padding: 8px 12px; display:flex; align-items:center; gap:8px;
      font-family:'Cairo',sans-serif; direction:rtl; flex-shrink:0;
      overflow:hidden; animation:slideDownChat 0.35s ease;
    `;
  } else {
    bar.style.cssText = `
      background: linear-gradient(135deg,#3a2800,#584000);
      border-bottom: 1px solid rgba(180,130,0,0.28);
      box-shadow: 0 3px 16px rgba(140,100,0,0.2);
      color: #fff8e1;
      padding: 8px 12px; display:flex; align-items:center; gap:8px;
      font-family:'Cairo',sans-serif; direction:rtl; flex-shrink:0;
      overflow:hidden; animation:slideDownChat 0.35s ease;
    `;
  }

  const labelBg  = isAdmin ? 'rgba(255,255,255,0.15)' : 'rgba(180,130,0,0.3)';
  const label    = isAdmin ? '📢 إعلان رسمي' : `📣 ${escapeHTML(sender||'')}`;
  const safe     = escapeHTML(text);

  bar.innerHTML = `
    <span style="background:${labelBg};padding:2px 7px;border-radius:5px;
      font-size:9px;font-weight:800;flex-shrink:0;white-space:nowrap">
      ${label}
    </span>
    <div style="flex:1;overflow:hidden;font-size:12px;font-weight:700">
      <span style="display:inline-block;white-space:nowrap;animation:scrollText 10s linear 2">
        ${safe}
      </span>
    </div>
    <button onclick="document.getElementById('chat-announce-overlay')?.remove()"
      style="background:none;border:none;color:rgba(255,255,255,0.5);
        cursor:pointer;flex-shrink:0;font-size:15px;line-height:1;padding:0 4px">✕</button>
  `;

  // يظهر قبل منطقة الرسائل مباشرة
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) chatSection.insertBefore(bar, chatMessages);
  else chatSection.prepend(bar);

  // إخفاء تلقائي بعد دورتين (20 ثانية)
  setTimeout(() => {
    bar.style.transition = 'opacity 0.5s, max-height 0.4s, padding 0.4s';
    bar.style.opacity    = '0';
    bar.style.maxHeight  = '0';
    bar.style.padding    = '0';
    setTimeout(() => bar.remove(), 500);
  }, 20000);
}

// ── بناء عنصر الرسالة ──
// تخزين مؤقت لصور اللاعبين بالشات — نجيب صورة كل شخص مرة وحدة بس
// بكل جلسة، مهما تكرر اسمه برسائل كثيرة (يحافظ على سرعة الشات)
const _chatAvatarCache = {}; // uid -> رابط الصورة، أو false لو مفحوص ومالها صورة

function buildMessageElement(msgKey, msg) {
  const isMine    = auth.currentUser && msg.uid === auth.currentUser.uid;
  const canDelete = isAdmin || isChatMod;

  // الوقت — دائماً ظاهر
  const timeStr = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
    : '';

  // الأفاتار
  const color  = getAvatarColor(msg.sender || '؟');
  const letter = (msg.sender || '؟').charAt(0).toUpperCase();
  const hasCachedPhoto = msg.uid && (msg.uid in _chatAvatarCache);
  const cachedPhoto    = hasCachedPhoto ? _chatAvatarCache[msg.uid] : null;
  const avatarContent  = cachedPhoto
    ? `<img src="${cachedPhoto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`
    : `<span>${letter}</span>`;

  const avatarBorder = msg.isVIP ? '#ffd700' : 'rgba(180,150,0,0.3)';
  const avatarGlow   = msg.isVIP ? '0 0 8px rgba(255,215,0,0.4)' : 'none';
  const avatarStyle  = `
    width:36px;height:36px;border-radius:50%;flex-shrink:0;cursor:pointer;
    display:flex;align-items:center;justify-content:center;overflow:hidden;
    font-size:14px;font-weight:900;color:white;background:${color};
    border:2px solid ${avatarBorder};box-shadow:${avatarGlow};
  `;

  // شارات — بدون لفل (اللفل يظهر في البروفايل فقط)
  const vipBadge = msg.isVIP
    ? `<span style="background:linear-gradient(135deg,#b8860b,#ffd700);color:#1a0800;font-size:9px;padding:1px 6px;border-radius:5px;font-weight:900">★VIP</span>`
    : '';
  const titleBadge = msg.title
    ? `<span style="color:${msg.titleColor || '#c4900e'};font-size:10px;font-weight:700">‹${escapeHTML(msg.title)}›</span>`
    : '';

  // أزرار
  const deleteBtn = canDelete
    ? `<button onclick="deleteMessage('${msgKey}')" style="background:none;border:none;color:#ff4757;font-size:11px;cursor:pointer;padding:2px 5px;opacity:0.55" title="حذف">🗑️</button>`
    : '';
  const reportBtn = !isMine
    ? `<button onclick="reportMessage('${msgKey}','${escapeHTML(msg.sender)}','${msg.uid||''}','${escapeHTML(msg.text).substring(0,50)}')" style="background:none;border:none;color:#888;font-size:11px;cursor:pointer;padding:2px 5px;opacity:0.5" title="إبلاغ">🚩</button>`
    : '';

  const wrap = document.createElement('div');
  wrap.dataset.msgId = msgKey;

  if (isMine) {
    // رسالتي — يمين، ذهبي مكتوم
    wrap.style.cssText = 'display:flex;flex-direction:row-reverse;align-items:flex-end;gap:8px;margin:5px 10px;';
    wrap.innerHTML = `
      <div id="msgav-${msgKey}" style="${avatarStyle}" onclick="openPlayerProfile('${msg.uid}','${escapeHTML(msg.sender)}')">${avatarContent}</div>
      <div style="max-width:68%;display:flex;flex-direction:column;align-items:flex-end;gap:3px">
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end">
          ${titleBadge}${vipBadge}
          <span style="font-size:11px;color:#c4900e;font-weight:800">${escapeHTML(msg.sender)}</span>
        </div>
        <div style="
          background:rgba(180,130,0,0.07);
          border:1px solid rgba(180,130,0,0.2);
          border-radius:14px 14px 3px 14px;
          padding:9px 13px;font-size:13px;line-height:1.65;
          word-break:break-word;color:#fff8e1;">
          <div dir="auto">${escapeHTML(msg.text)}</div>
          <div style="font-size:10px;color:rgba(180,130,0,0.38);margin-top:4px;text-align:left;direction:ltr">${timeStr}</div>
        </div>
        <div style="min-height:16px">${deleteBtn}</div>
      </div>`;
  } else {
    // رسالة الآخرين — يسار، داكن
    wrap.style.cssText = 'display:flex;flex-direction:row;align-items:flex-end;gap:8px;margin:5px 10px;';
    wrap.innerHTML = `
      <div id="msgav-${msgKey}" style="${avatarStyle}" onclick="openPlayerProfile('${msg.uid}','${escapeHTML(msg.sender)}')">${avatarContent}</div>
      <div style="max-width:68%;display:flex;flex-direction:column;align-items:flex-start;gap:3px">
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
          <span style="font-size:11px;color:#e8e0c0;font-weight:800;cursor:pointer"
            onclick="openPlayerProfile('${msg.uid}','${escapeHTML(msg.sender)}')">${escapeHTML(msg.sender)}</span>
          ${vipBadge}${titleBadge}
        </div>
        <div style="
          background:#111118;
          border:1px solid rgba(255,255,255,0.05);
          border-radius:3px 14px 14px 14px;
          padding:9px 13px;font-size:13px;line-height:1.65;
          word-break:break-word;color:#ddd8c4;">
          <div dir="auto">${escapeHTML(msg.text)}</div>
          <div style="font-size:10px;color:#333;margin-top:4px;text-align:left;direction:ltr">${timeStr}</div>
        </div>
        <div style="min-height:16px">${deleteBtn}${reportBtn}</div>
      </div>`;
  }

  // لو ما جرّبنا نجيب صورة هذا الشخص بهذي الجلسة، نجيبها مرة وحدة ونخزّنها للباقي
  if (msg.uid && !hasCachedPhoto) {
    db.ref('users/' + msg.uid + '/photoURL').once('value', snap => {
      const url = snap.val() || false;
      _chatAvatarCache[msg.uid] = url;
      if (url) {
        const el = document.getElementById('msgav-' + msgKey);
        if (el) el.innerHTML = `<img src="${url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
      }
    });
  }

  return wrap;
}

// ── مراقبة صلاحيات المشرف لحظياً ──
function watchModPermissions() {
  const user = auth.currentUser;
  if (!user || isAdmin) return;
  db.ref('users/' + user.uid + '/isChatMod').on('value', snap => {
    const newVal = !!snap.val();
    if (isChatMod === newVal) return;
    isChatMod = newVal;
    document.getElementById('chat-admin-bar')?.remove();
    if (isChatMod) renderChatControlPanel();
  });
}

// ============================================================
//  إرسال رسالة
// ============================================================
function sendMessage(isAmplifier = false) {
  const input = document.getElementById('chat-input');
  const user  = auth.currentUser;
  if (!user || !input) return;
  if (currentLevel < 10 && !isAdmin) { Toast.show('يجب أن تكون مستوى 10 أو أعلى للمشاركة في الشات العام!', 'error'); return; }
  if (isMuted) { Toast.show('أنت مكتوم!', 'warning'); return; }

  const text = input.value.trim();
  if (!text) return;

  if (isAmplifier) {
    if (currentCoins < 10000) { Toast.show('تحتاج 10,000 🪙 لاستخدام المكبر!', 'error'); return; }
    db.ref('users/' + user.uid + '/coins').transaction(c => (c || 0) - 10000);
    db.ref('global_chat').push({
      uid: user.uid, sender: currentUsername, text,
      type: 'marquee', isAdmin: false,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  } else {
    db.ref('global_chat').push({
      uid: user.uid, sender: currentUsername,
      isVIP, clan: currentClan,
      title: currentTitle || '', titleColor: currentTitleColor || '',
      text, timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    db.ref('users/' + user.uid).transaction(u => {
      if (!u) return u;
      u.coins = (u.coins || 0) + 1;
      u.xp    = (u.xp    || 0) + 10;
      if (u.xp >= u.level * 100) u.level = (u.level || 1) + 1;
      if (!u.quests) u.quests = {};
      if (!u.quests.chatClaimed) u.quests.chatProgress = (u.quests.chatProgress || 0) + 1;
      return u;
    });
  }
  input.value = '';
  Sounds.play('click');
}

// ============================================================
//  الرسائل الخاصة
// ============================================================
function listenToPrivateMessages() {
  const pmBox = document.getElementById('private-messages-box');
  const user  = auth.currentUser;
  if (!pmBox || !user || pmListener) return;
  pmBox.innerHTML = '';

  pmListener = db.ref('user_pms/' + user.uid).limitToLast(30);
  let initialPMLoad = true;
  setTimeout(() => { initialPMLoad = false; }, 1500);
  pmListener.on('child_added', snap => {
    const pm = snap.val(); if (!pm) return;
    const isMine = pm.senderUid === user.uid;
    if (!initialPMLoad && !isMine) { Sounds.play('notification'); Haptic.medium(); }
    const color  = getAvatarColor(isMine ? pm.receiverName : pm.senderName);
    const who    = isMine ? `أنت → ${escapeHTML(pm.receiverName)}` : `${escapeHTML(pm.senderName)} → أنت`;

    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1a1a28';
    div.innerHTML = `
      <div style="width:26px;height:26px;border-radius:50%;background:${color};
        display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:white;flex-shrink:0">
        ${(isMine ? pm.receiverName : pm.senderName || '؟').charAt(0).toUpperCase()}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:10px;color:#666;margin-bottom:2px">${who}</div>
        <div style="font-size:12px;color:${isMine ? '#c4900e' : '#34d399'}">${escapeHTML(pm.text)}</div>
      </div>`;
    pmBox.appendChild(div);
    pmBox.scrollTop = pmBox.scrollHeight;
  });
}

// ============================================================
//  شريط تحكم الشات
// ============================================================
function renderChatControlPanel() {
  if (!isAdmin && !isChatMod) return;
  document.getElementById('chat-admin-bar')?.remove();

  const bar = document.createElement('div');
  bar.id = 'chat-admin-bar';

  if (isAdmin) {
    bar.style.cssText = `padding:7px 12px;background:#0d0000;
      border-bottom:1px solid rgba(255,71,87,0.3);
      display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#ff4757;`;
    bar.innerHTML = `
      <span>👑 الإدارة</span>
      <button onclick="openChatAdminPanel()" style="
        background:rgba(255,71,87,0.15);border:1px solid rgba(255,71,87,0.35);
        color:#ff4757;padding:4px 14px;border-radius:7px;cursor:pointer;
        font-size:11px;font-weight:800;font-family:inherit">لوحة التحكم</button>`;
  } else {
    bar.style.cssText = `padding:7px 12px;background:#030a00;
      border-bottom:1px solid rgba(108,99,255,0.25);
      display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#7c73f0;`;
    bar.innerHTML = `
      <span>🛡️ الإشراف</span>
      <button onclick="openChatModPanel()" style="
        background:rgba(108,99,255,0.12);border:1px solid rgba(108,99,255,0.3);
        color:#a78bfa;padding:4px 14px;border-radius:7px;cursor:pointer;
        font-size:11px;font-weight:800;font-family:inherit">لوحة الإشراف</button>`;
  }

  document.getElementById('chat')?.prepend(bar);
}

// ============================================================
//  لوحة تحكم الأدمن — 4 تبويبات
// ============================================================
function openChatAdminPanel() {
  document.getElementById('chat-panel-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'chat-panel-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:9990;display:flex;align-items:center;justify-content:center;padding:12px';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div style="background:#0a0a15;border:1px solid rgba(255,71,87,0.25);border-radius:20px;
      width:100%;max-width:360px;max-height:88vh;overflow:hidden;
      display:flex;flex-direction:column;direction:rtl;font-family:inherit;color:white">
      <div style="padding:14px 16px;background:#100000;border-bottom:1px solid rgba(255,71,87,0.2);
        display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:14px;font-weight:900;color:#ff4757">👑 لوحة تحكم الشات</span>
        <button onclick="document.getElementById('chat-panel-overlay').remove()"
          style="background:none;border:none;color:#555;cursor:pointer;font-size:16px">✕</button>
      </div>
      <div id="chat-panel-tabs" style="display:flex;border-bottom:1px solid rgba(255,255,255,0.07)">
        ${[['mods','👥 المشرفون'],['reports','🚩 البلاغات'],['banned','🚫 المحظورون'],['announce','📢 إعلان']].map(([id,label],i) => `
          <button id="tab-btn-${id}" onclick="switchChatTab('${id}')"
            style="flex:1;padding:10px 2px;background:${i===0?'rgba(255,71,87,0.1)':'transparent'};
              border:none;border-bottom:${i===0?'2px solid #ff4757':'2px solid transparent'};
              color:${i===0?'#ff4757':'#555'};font-size:9px;font-weight:800;cursor:pointer;font-family:inherit">
            ${label}</button>`).join('')}
      </div>
      <div id="chat-panel-content" style="flex:1;overflow-y:auto;padding:14px"></div>
    </div>`;

  document.body.appendChild(overlay);
  switchChatTab('mods');
}

// ============================================================
//  لوحة إشراف المشرف — تبويبان
// ============================================================
function openChatModPanel() {
  document.getElementById('chat-panel-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'chat-panel-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:9990;display:flex;align-items:center;justify-content:center;padding:12px';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div style="background:#0a0a15;border:1px solid rgba(108,99,255,0.25);border-radius:20px;
      width:100%;max-width:360px;max-height:88vh;overflow:hidden;
      display:flex;flex-direction:column;direction:rtl;font-family:inherit;color:white">
      <div style="padding:14px 16px;background:#050510;border-bottom:1px solid rgba(108,99,255,0.2);
        display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:14px;font-weight:900;color:#a78bfa">🛡️ لوحة الإشراف</span>
        <button onclick="document.getElementById('chat-panel-overlay').remove()"
          style="background:none;border:none;color:#555;cursor:pointer;font-size:16px">✕</button>
      </div>
      <div id="chat-panel-tabs" style="display:flex;border-bottom:1px solid rgba(255,255,255,0.07)">
        ${[['reports','🚩 البلاغات'],['ban','🚫 حظر لاعب']].map(([id,label],i) => `
          <button id="tab-btn-${id}" onclick="switchChatTab('${id}')"
            style="flex:1;padding:10px;background:${i===0?'rgba(108,99,255,0.1)':'transparent'};
              border:none;border-bottom:${i===0?'2px solid #a78bfa':'2px solid transparent'};
              color:${i===0?'#a78bfa':'#555'};font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">
            ${label}</button>`).join('')}
      </div>
      <div id="chat-panel-content" style="flex:1;overflow-y:auto;padding:14px"></div>
    </div>`;

  document.body.appendChild(overlay);
  switchChatTab('reports');
}

// ── تبديل التبويبات ──
function switchChatTab(tabId) {
  const content = document.getElementById('chat-panel-content');
  if (!content) return;

  const activeColor = isAdmin ? '#ff4757' : '#a78bfa';
  const activeBg    = isAdmin ? 'rgba(255,71,87,0.1)' : 'rgba(108,99,255,0.1)';

  document.querySelectorAll('[id^="tab-btn-"]').forEach(btn => {
    const active = btn.id === `tab-btn-${tabId}`;
    btn.style.background   = active ? activeBg    : 'transparent';
    btn.style.borderBottom = active ? `2px solid ${activeColor}` : '2px solid transparent';
    btn.style.color        = active ? activeColor : '#555';
  });

  content.innerHTML = '<div style="text-align:center;padding:24px;color:#444;font-size:12px">⏳ جاري التحميل...</div>';

  switch (tabId) {
    case 'mods':     loadModsTab(content);     break;
    case 'reports':  loadReportsTab(content);  break;
    case 'banned':   loadBannedTab(content);   break;
    case 'announce': loadAnnounceTab(content); break;
    case 'ban':      loadBanTab(content);      break;
  }
}

function loadModsTab(container) {
  container.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-size:11px;color:#555;margin-bottom:6px">ترقية لاعب إلى مشرف:</div>
      <div style="display:flex;gap:6px">
        <input id="mod-promote-input" placeholder="اسم اللاعب..."
          style="flex:1;padding:8px;background:#0d0d1c;border:1px solid rgba(255,71,87,0.2);
            color:white;border-radius:8px;font-family:inherit;font-size:12px">
        <button onclick="promoteToMod()"
          style="padding:8px 14px;background:rgba(255,71,87,0.15);color:#ff4757;
            border:1px solid rgba(255,71,87,0.3);border-radius:8px;
            font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">ترقية</button>
      </div>
    </div>
    <div style="font-size:11px;color:#555;margin-bottom:8px">المشرفون الحاليون:</div>
    <div id="mods-list"><div style="text-align:center;color:#444;font-size:12px;padding:10px">⏳</div></div>`;

  db.ref('users').orderByChild('isChatMod').equalTo(true).once('value', snap => {
    const list = document.getElementById('mods-list');
    if (!list) return;
    if (!snap.exists()) { list.innerHTML = '<div style="color:#444;font-size:12px;text-align:center;padding:8px">لا يوجد مشرفون حالياً</div>'; return; }
    let html = '';
    snap.forEach(c => {
      const u = c.val();
      html += `
        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:8px;background:#0d0d1c;border-radius:9px;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            ${renderAvatarHTML(u, 28)}
            <span style="font-size:12px;font-weight:700">${escapeHTML(u.username||'—')}</span>
          </div>
          <button onclick="removeFromMod('${c.key}','${escapeHTML(u.username||'')}')"
            style="padding:5px 10px;background:rgba(255,71,87,0.1);color:#ff4757;
              border:1px solid rgba(255,71,87,0.25);border-radius:7px;
              font-size:11px;cursor:pointer;font-family:inherit">إزالة</button>
        </div>`;
    });
    list.innerHTML = html;
  });
}

function loadReportsTab(container) {
  db.ref('reports').orderByChild('timestamp').limitToLast(30).once('value', snap => {
    if (!snap.exists()) {
      container.innerHTML = '<div style="text-align:center;color:#444;padding:24px;font-size:13px">✅ لا توجد بلاغات</div>';
      return;
    }
    const reports = [];
    snap.forEach(c => reports.unshift({ key: c.key, ...c.val() }));

    container.innerHTML = reports.map(r => {
      const date   = r.timestamp ? new Date(r.timestamp).toLocaleString('ar') : '—';
      const type   = r.type === 'photo' ? '🖼️ صورة' : '💬 رسالة';
      const status = r.status === 'dismissed' ? '<span style="color:#2ecc71;font-size:10px">✓ تجاهل</span>'
                   : r.status === 'actioned'  ? '<span style="color:#e74c3c;font-size:10px">✓ تم الإجراء</span>' : '';
      return `
        <div style="background:#0d0d1c;border:1px solid rgba(255,71,87,0.1);border-radius:10px;padding:10px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
            <span style="font-size:10px;color:#ff4757;font-weight:800">${type} ${status}</span>
            <span style="font-size:9px;color:#333">${date}</span>
          </div>
          <div style="font-size:11px;color:#777;margin-bottom:2px">المُبلَّغ عنه: <strong style="color:#ddd">${escapeHTML(r.reportedUser||'—')}</strong></div>
          <div style="font-size:11px;color:#777;margin-bottom:2px">المُبلِّغ: <strong style="color:#aaa">${escapeHTML(r.reportedBy||'—')}</strong></div>
          <div style="font-size:11px;color:#777;margin-bottom:2px">السبب: <strong style="color:#fbbf24">${escapeHTML(r.reason||'—')}</strong></div>
          ${r.details ? `<div style="font-size:10px;color:#555;margin-bottom:3px">التفاصيل: ${escapeHTML(r.details)}</div>` : ''}
          ${r.messageText ? `<div style="font-size:10px;color:#444;margin-bottom:5px;font-style:italic">"${escapeHTML(r.messageText.substring(0,80))}"</div>` : ''}
          ${r.status === 'pending' ? `
            <div style="display:flex;gap:6px;margin-top:7px">
              <button onclick="dismissReport('${r.key}')"
                style="flex:1;padding:7px;background:rgba(46,204,113,0.1);color:#2ecc71;
                  border:1px solid rgba(46,204,113,0.2);border-radius:7px;
                  font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">✓ تجاهل</button>
              ${r.reportedUserUid ? `
                <button onclick="banFromReport('${r.reportedUserUid}','${escapeHTML(r.reportedUser||'')}','${r.key}')"
                  style="flex:1;padding:7px;background:rgba(255,71,87,0.1);color:#ff4757;
                    border:1px solid rgba(255,71,87,0.2);border-radius:7px;
                    font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">🚫 حظر</button>` : ''}
            </div>` : ''}
        </div>`;
    }).join('');
  });
}

function loadBannedTab(container) {
  db.ref('bans').once('value', snap => {
    if (!snap.exists()) {
      container.innerHTML = '<div style="text-align:center;color:#444;padding:24px;font-size:13px">✅ لا يوجد محظورون</div>';
      return;
    }
    let html = '';
    snap.forEach(c => {
      const b       = c.val();
      const until   = b.until ? new Date(b.until).toLocaleString('ar') : '—';
      const expired = b.until && Date.now() > b.until;
      html += `
        <div style="background:#0d0d1c;border:1px solid rgba(255,71,87,0.1);border-radius:10px;
          padding:10px;margin-bottom:8px;opacity:${expired?'0.45':'1'}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:12px;font-weight:800;color:${expired?'#444':'#ff4757'}">${escapeHTML(b.username||c.key)}</div>
              <div style="font-size:10px;color:#444;margin-top:2px">حتى: ${until} ${expired?'<span style="color:#2ecc71">(انتهى)</span>':''}</div>
              ${b.bannedBy?`<div style="font-size:10px;color:#333">بواسطة: ${escapeHTML(b.bannedBy)}</div>`:''}
            </div>
            ${!expired?`
              <button onclick="unbanUser('${c.key}')"
                style="padding:6px 12px;background:rgba(46,204,113,0.1);color:#2ecc71;
                  border:1px solid rgba(46,204,113,0.2);border-radius:7px;
                  font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">رفع الحظر</button>`:''}
          </div>
        </div>`;
    });
    container.innerHTML = html || '<div style="text-align:center;color:#444;padding:24px;font-size:13px">لا يوجد محظورون</div>';
  });
}

function loadAnnounceTab(container) {
  container.innerHTML = `
    <div style="font-size:11px;color:#555;margin-bottom:6px">نص الإعلان:</div>
    <textarea id="announce-text" rows="3" placeholder="اكتب الإعلان هنا..."
      style="width:100%;background:#0d0d1c;border:1px solid rgba(255,71,87,0.2);
        color:white;border-radius:9px;padding:10px;font-family:inherit;font-size:12px;
        resize:none;box-sizing:border-box;margin-bottom:10px"></textarea>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
        <input type="radio" name="announce-type" value="admin" checked> 🔴 رسمي (أحمر - يصل لكل الصفحات)
      </label>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
        <input type="radio" name="announce-type" value="normal"> 📢 عادي (في الشات فقط)
      </label>
    </div>
    <button onclick="sendAdminAnnouncement()"
      style="width:100%;padding:12px;background:rgba(255,71,87,0.15);color:#ff4757;
        border:1px solid rgba(255,71,87,0.3);border-radius:10px;
        font-size:13px;font-weight:900;cursor:pointer;font-family:inherit">
      📢 بث الإعلان
    </button>`;
}

function loadBanTab(container) {
  container.innerHTML = `
    <div style="font-size:11px;color:#555;margin-bottom:6px">اسم اللاعب:</div>
    <input id="ban-username-input" placeholder="اسم اللاعب..."
      style="width:100%;padding:9px;background:#0d0d1c;border:1px solid rgba(108,99,255,0.2);
        color:white;border-radius:8px;font-family:inherit;font-size:12px;
        margin-bottom:8px;box-sizing:border-box">
    <div style="font-size:11px;color:#555;margin-bottom:6px">مدة الحظر:</div>
    <select id="ban-duration" style="width:100%;padding:9px;background:#0d0d1c;color:white;
      border:1px solid rgba(108,99,255,0.2);border-radius:8px;margin-bottom:12px;
      font-family:inherit;font-size:12px">
      <option value="60">ساعة واحدة</option>
      <option value="1440">24 ساعة</option>
      <option value="10080">أسبوع</option>
    </select>
    <button onclick="banByUsername()"
      style="width:100%;padding:12px;background:rgba(255,71,87,0.12);color:#ff4757;
        border:1px solid rgba(255,71,87,0.25);border-radius:10px;
        font-size:13px;font-weight:900;cursor:pointer;font-family:inherit">🚫 تنفيذ الحظر</button>`;
}

// ── إجراءات اللوحة ──
function promoteToMod() {
  const username = document.getElementById('mod-promote-input')?.value.trim();
  if (!username) return;
  db.ref('users').orderByChild('username').equalTo(username).once('value', snap => {
    if (!snap.exists()) { Toast.show(`اللاعب "${username}" غير موجود`, 'error'); return; }
    let uid = null;
    snap.forEach(c => { uid = c.key; });
    db.ref('users/' + uid + '/isChatMod').set(true, err => {
      if (!err) { Toast.show(`✅ تم ترقية ${username}`, 'success'); document.getElementById('mod-promote-input').value = ''; switchChatTab('mods'); }
    });
  });
}

function removeFromMod(uid, name) {
  if (!confirm(`إزالة ${name} من الإشراف؟`)) return;
  db.ref('users/' + uid + '/isChatMod').set(false, err => {
    if (!err) { Toast.show(`تم إزالة ${name}`, 'success'); switchChatTab('mods'); }
  });
}

function dismissReport(reportKey) {
  db.ref('reports/' + reportKey + '/status').set('dismissed', err => {
    if (!err) { Toast.show('تم تجاهل البلاغ', 'success'); switchChatTab('reports'); }
  });
}

function banFromReport(uid, name, reportKey) {
  if (!confirm(`حظر ${name} لمدة 24 ساعة؟`)) return;
  db.ref().update({
    ['/bans/' + uid]: { until: Date.now() + 86400000, bannedBy: currentUsername, username: name },
    ['/reports/' + reportKey + '/status']: 'actioned'
  }, err => { if (!err) { Toast.show(`🚫 تم حظر ${name}`, 'warning'); switchChatTab('reports'); } });
}

function unbanUser(uid) {
  if (!confirm('رفع الحظر؟')) return;
  db.ref('bans/' + uid).remove(err => {
    if (!err) { Toast.show('✅ تم رفع الحظر', 'success'); switchChatTab('banned'); }
  });
}

function sendAdminAnnouncement() {
  const text = document.getElementById('announce-text')?.value.trim();
  if (!text) { Toast.show('أدخل نص الإعلان', 'warning'); return; }
  const isAdminType = document.querySelector('input[name="announce-type"]:checked')?.value === 'admin';
  db.ref('global_chat').push({
    uid: auth.currentUser?.uid, sender: currentUsername,
    text, type: 'marquee', isAdmin: isAdminType,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    Toast.show('✅ تم بث الإعلان', 'success');
    document.getElementById('announce-text').value = '';
    document.getElementById('chat-panel-overlay')?.remove();
  });
}

function banByUsername() {
  const username = document.getElementById('ban-username-input')?.value.trim();
  const mins     = parseInt(document.getElementById('ban-duration')?.value || '1440');
  if (!username) return;
  db.ref('users').orderByChild('username').equalTo(username).once('value', snap => {
    if (!snap.exists()) { Toast.show(`اللاعب "${username}" غير موجود`, 'error'); return; }
    let uid = null, name = username;
    snap.forEach(c => { uid = c.key; name = c.val().username || username; });
    db.ref('bans/' + uid).set({
      until: Date.now() + mins * 60000, bannedBy: currentUsername, username: name
    }, err => { if (!err) { Toast.show(`🚫 تم حظر ${name}`, 'warning'); document.getElementById('chat-panel-overlay')?.remove(); } });
  });
}

// ============================================================
//  بروفايل اللاعب الكامل
// ============================================================
function openPlayerProfile(targetUid, targetName) {
  closePlayerMenu();

  const user    = auth.currentUser;
  const isSelf  = user && user.uid === targetUid;
  const isMod   = typeof isChatMod !== 'undefined' ? isChatMod : false;
  const showMod = (isAdmin || isMod) && !isSelf;

  const overlay = document.createElement('div');
  overlay.id = 'menu-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.onclick = e => { if (e.target === overlay) closePlayerMenu(); };

  const menu = document.createElement('div');
  menu.id = 'player-context-menu';
  menu.style.cssText = `
    background:#0e0e1c;border:1px solid rgba(180,130,0,0.22);
    border-radius:22px;width:100%;max-width:315px;
    box-shadow:0 24px 72px rgba(0,0,0,0.9);
    color:white;direction:rtl;font-family:inherit;
    overflow:hidden;max-height:92vh;overflow-y:auto;`;
  menu.innerHTML = '<div style="padding:48px;text-align:center"><div style="font-size:28px;margin-bottom:10px">⏳</div><div style="color:#444;font-size:13px">جاري تحميل البروفايل...</div></div>';
  overlay.appendChild(menu);
  document.body.appendChild(overlay);

  db.ref('users/' + targetUid).once('value', snap => {
    const u = snap.val() || {};
    const displayName  = u.username || targetName;
    const avatarColor  = getAvatarColor(displayName);
    const avatarLetter = displayName.charAt(0).toUpperCase();
    const xp     = u.xp || 0;
    const lvl    = u.level || 1;
    const xpNext = lvl * 100;
    const xpBar  = Math.min(100, Math.round((xp % xpNext) / xpNext * 100));
    const joinDate = u.createdAt
      ? new Date(u.createdAt).toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' })
      : '—';

    const avatarContent = renderAvatarInnerHTML(u);

    const borderColor = u.isVIP ? '#ffd700' : 'rgba(180,130,0,0.45)';
    const glowColor   = u.isVIP ? 'rgba(255,215,0,0.3)' : 'rgba(180,130,0,0.18)';

    const vipBadge  = u.isVIP
      ? `<span style="background:linear-gradient(135deg,#b8860b,#ffd700);color:#1a0800;font-size:10px;padding:2px 10px;border-radius:20px;font-weight:900">★ VIP</span>` : '';
    const titleText = u.currentTitle
      ? `<div style="color:${u.titleColor||'#c4900e'};font-size:11px;font-weight:700;margin-top:4px">‹${escapeHTML(u.currentTitle)}›</div>` : '';
    const clanTag = u.clan
      ? `<span style="background:rgba(180,130,0,0.1);color:#c4900e;border:1px solid rgba(180,130,0,0.2);font-size:11px;padding:2px 10px;border-radius:20px">🏰 ${escapeHTML(u.clan)}</span>` : '';

    // الكوينز مخفية — لصاحبها فقط
    const statsItems = isSelf
      ? [['🪙',(u.coins||0).toLocaleString(),'الكوينز'],['🏆',u.wins||0,'الانتصارات'],['🎮',u.gamesPlayed||0,'الألعاب'],['📅',joinDate,'الانضمام']]
      : [['🏆',u.wins||0,'الانتصارات'],['🎮',u.gamesPlayed||0,'الألعاب'],['📅',joinDate,'الانضمام']];
    const cols = isSelf ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr';

    menu.innerHTML = `
      <div id="player-menu-container">
        <div style="background:linear-gradient(160deg,#0a0a14,#111120);
          padding:26px 16px 18px;text-align:center;
          border-bottom:1px solid rgba(180,130,0,0.08)">
          <div style="width:78px;height:78px;border-radius:50%;background:${avatarColor};
            border:3px solid ${borderColor};box-shadow:0 0 16px ${glowColor};
            margin:0 auto 12px;display:flex;align-items:center;justify-content:center;overflow:hidden;
            font-size:30px;font-weight:900;color:white">
            ${avatarContent}</div>
          <div style="font-size:17px;font-weight:900;color:#fff8e1">${escapeHTML(displayName)}</div>
          ${titleText}
          <div style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:9px;flex-wrap:wrap">
            ${vipBadge}
            <span style="background:rgba(180,130,0,0.14);color:#c4900e;
              border:1px solid rgba(180,130,0,0.28);font-size:11px;
              padding:2px 11px;border-radius:20px;font-weight:800">المستوى ${lvl}</span>
            ${clanTag}
          </div>
        </div>
        <div style="padding:10px 16px;background:#08080e;border-bottom:1px solid rgba(180,130,0,0.06)">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#332e20;margin-bottom:5px">
            <span>التقدم للمستوى القادم</span>
            <span style="color:rgba(180,130,0,0.5);font-weight:800">${xp.toLocaleString()} / ${xpNext.toLocaleString()}</span>
          </div>
          <div style="height:5px;background:#111118;border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${xpBar}%;background:linear-gradient(90deg,#b8860b,#ffd700);border-radius:3px"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:${cols};gap:1px;background:rgba(180,130,0,0.05)">
          ${statsItems.map(([icon,val,label]) => `
            <div style="background:#08080e;padding:13px 6px;text-align:center">
              <div style="font-size:20px;margin-bottom:3px">${icon}</div>
              <div style="font-size:13px;font-weight:900;color:#fff8e1">${val}</div>
              <div style="font-size:9px;color:#332e20;margin-top:2px">${label}</div>
            </div>`).join('')}
        </div>
        <div id="gift-history-box-${targetUid}" style="padding:12px 16px 0"></div>
        <div style="padding:14px">
          ${!isSelf ? `
            <button onclick="sendPrivateMessageFromMenu('${targetUid}','${escapeHTML(targetName)}')"
              style="width:100%;padding:12px;background:#0f0f1a;color:#c4900e;
                border:1px solid rgba(180,130,0,0.28);border-radius:11px;
                font-weight:800;cursor:pointer;font-family:inherit;font-size:13px;margin-bottom:9px">
              💬 إرسال رسالة خاصة
            </button>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px">
              <button onclick="transferCoinsFromMenu('${targetUid}','${escapeHTML(targetName)}')"
                style="padding:12px;background:#130f00;color:#fbbf24;
                  border:1px solid rgba(180,130,0,0.18);border-radius:11px;
                  font-weight:800;cursor:pointer;font-family:inherit;font-size:12px">💸 تحويل</button>
              <button onclick="openGiftSubMenu('${targetUid}','${escapeHTML(targetName)}')"
                style="padding:12px;background:#0f0900;color:#ff9f43;
                  border:1px solid rgba(255,159,67,0.18);border-radius:11px;
                  font-weight:800;cursor:pointer;font-family:inherit;font-size:12px">🎁 هدية</button>
            </div>
          ` : `
            <button onclick="showSection('profile');closePlayerMenu()"
              style="width:100%;padding:12px;background:#0f0f1a;color:#c4900e;
                border:1px solid rgba(180,130,0,0.28);border-radius:11px;
                font-weight:800;cursor:pointer;font-family:inherit;font-size:13px;margin-bottom:9px">
              👤 صفحتي الشخصية
            </button>
          `}
          ${showMod ? `
            <div style="border:1px solid rgba(255,71,87,0.15);border-radius:11px;padding:12px;margin-bottom:9px;background:#0d0000">
              <div style="font-size:10px;color:#ff4757;font-weight:800;text-align:center;margin-bottom:9px">🛡️ أدوات الإشراف</div>
              <select id="mute-duration" style="width:100%;padding:8px;background:#0a0a15;color:white;
                border:1px solid rgba(255,71,87,0.2);border-radius:8px;margin-bottom:8px;font-family:inherit;font-size:12px">
                <option value="10">كتم 10 دقائق</option>
                <option value="60">كتم ساعة</option>
                <option value="1440">كتم 24 ساعة</option>
              </select>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <button onclick="modMuteUser('${targetUid}','${escapeHTML(targetName)}')"
                  style="padding:9px;background:rgba(255,71,87,0.08);color:#ff6b6b;
                    border:1px solid rgba(255,71,87,0.2);border-radius:8px;
                    font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">🤫 كتم</button>
                <button onclick="modBanUser24h('${targetUid}','${escapeHTML(targetName)}')"
                  style="padding:9px;background:rgba(179,57,57,0.08);color:#ff4757;
                    border:1px solid rgba(179,57,57,0.2);border-radius:8px;
                    font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">🚫 حظر</button>
              </div>
            </div>` : ''}
          <button onclick="closePlayerMenu()"
            style="width:100%;padding:10px;background:transparent;color:#2a2820;
              border:1px solid rgba(255,255,255,0.05);border-radius:11px;
              cursor:pointer;font-size:12px;font-family:inherit">✕ إغلاق</button>
        </div>
      </div>`;

    // الهدايا المستلمة — سجل دائم يبقى حتى بعد اختفاء إشعار الاستلام اللحظي
    db.ref('gift_history/' + targetUid).limitToLast(6).once('value', gsnap => {
      const box = document.getElementById('gift-history-box-' + targetUid);
      if (!box) return;
      const gifts = [];
      gsnap.forEach(c => gifts.push(c.val()));
      gifts.reverse();
      if (!gifts.length) return; // ما نعرض القسم أصلاً لو ما فيه هدايا

      box.innerHTML = `
        <div style="font-size:10px;color:#705030;font-weight:800;margin-bottom:6px">🎁 آخر الهدايا المستلمة</div>
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">
          ${gifts.map(g => `
            <div style="flex-shrink:0;background:rgba(200,169,64,0.08);border:1px solid rgba(200,169,64,0.2);
              border-radius:10px;padding:7px 10px;text-align:center;min-width:56px">
              <div style="font-size:18px">${g.giftEmoji||'🎁'}</div>
              <div style="font-size:8px;color:#888;margin-top:2px;white-space:nowrap">${escapeHTML(g.from||'؟')}</div>
            </div>`).join('')}
        </div>`;
    });
  });
}

function openPlayerMenu(targetUid, targetName) { openPlayerProfile(targetUid, targetName); }

// ============================================================
//  قائمة الهدايا
// ============================================================
function openGiftSubMenu(targetUid, targetName) {
  const container = document.getElementById('player-menu-container');
  if (!container) return;
  container.innerHTML = `
    <div style="padding:20px">
      <h3 style="margin:0 0 4px;color:#ff9f43;font-size:15px;text-align:center">🎁 متجر الهدايا</h3>
      <p style="font-size:11px;color:#444;margin:0 0 14px;text-align:center">اختر هدية لـ ‹${escapeHTML(targetName)}›</p>
      ${[['gift_honey','🍯 عسل ملكي','20'],['gift_bee','🐝 نحلة ذهبية','50'],['gift_crown','👑 تاج النخبة','200']].map(([id,name,price]) => `
        <button onclick="triggerGiftDelivery('${targetUid}','${escapeHTML(targetName)}','${id}')"
          style="width:100%;padding:12px;background:#0e0e1c;color:#fff8e1;
            border:1px solid rgba(180,130,0,0.18);border-radius:10px;margin-bottom:8px;
            font-size:13px;font-weight:700;cursor:pointer;
            display:flex;justify-content:space-between;align-items:center;font-family:inherit">
          <span>${name}</span>
          <span style="color:#c4900e;font-weight:900">${price} 🪙</span>
        </button>`).join('')}
      <button onclick="openPlayerProfile('${targetUid}','${escapeHTML(targetName)}')"
        style="width:100%;padding:10px;background:transparent;color:#444;
          border:1px solid rgba(255,255,255,0.06);border-radius:10px;
          font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">⬅️ رجوع</button>
    </div>`;
}

function triggerGiftDelivery(targetUid, targetName, giftId) {
  if (typeof sendGift === 'function') { sendGift(targetUid, targetName, giftId); closePlayerMenu(); }
}

function closePlayerMenu() {
  document.getElementById('player-context-menu')?.remove();
  document.getElementById('menu-overlay')?.remove();
}

// ============================================================
//  تحويل كوينز
// ============================================================
function transferCoinsFromMenu(targetUid, targetName) {
  const user = auth.currentUser; if (!user) return;
  if (targetName === currentUsername) { Toast.show('لا يمكنك التحويل لنفسك!', 'error'); return; }
  const amount = parseInt(prompt(`أدخل الكمية لتحويلها إلى ${targetName}:`));
  if (isNaN(amount) || amount <= 0) { Toast.show('كمية غير صحيحة', 'error'); return; }
  if (amount > currentCoins) { Toast.show('لا تملك هذا القدر!', 'success'); return; }
  const tax = Math.floor(amount * 0.05);
  const net = amount - tax;
  if (!confirm(`سيُخصم ${amount} 🪙\nضريبة 5%: ${tax} 🪙\nيستلم ${targetName}: ${net} 🪙\n\nاستمرار؟`)) return;
  db.ref('users/' + user.uid).transaction(u => {
    if (u && u.coins >= amount) { u.coins -= amount; return u; } return u;
  }, (err, committed) => {
    if (committed) {
      db.ref('transfers/' + targetUid).push({ amount: net, from: currentUsername, fromUid: user.uid, timestamp: Date.now() })
        .then(() => { Toast.show(`تم تحويل 🪙 ${net} إلى ${targetName}!`, 'success'); closePlayerMenu(); });
    } else { Toast.show('فشل التحويل.', 'error'); }
  });
}

// ============================================================
//  رسالة خاصة من البروفايل
// ============================================================
function sendPrivateMessageFromMenu(targetUid, targetName) {
  const user = auth.currentUser; if (!user) return;
  if (isMuted) { Toast.show('أنت مكتوم!', 'warning'); return; }
  closePlayerMenu();
  if (typeof startConversationWith === 'function') { startConversationWith(targetUid, targetName); return; }
  const text = prompt(`أرسل رسالة خاصة إلى ${targetName}:`);
  if (!text?.trim()) return;
  const pmData = {
    senderUid: user.uid, senderName: currentUsername,
    receiverUid: targetUid, receiverName: targetName,
    text: text.trim(), timestamp: firebase.database.ServerValue.TIMESTAMP
  };
  const key = db.ref().child('user_pms').push().key;
  db.ref().update({
    [`/user_pms/${user.uid}/${key}`]: pmData,
    [`/user_pms/${targetUid}/${key}`]: pmData,
    [`/users/${targetUid}/unreadPMs`]: firebase.database.ServerValue.increment(1)
  }).then(() => { Toast.show('تم إرسال الرسالة ✓', 'success'); });
}

// ============================================================
//  أدوات الإشراف
// ============================================================
function modMuteUser(uid, name) {
  const duration = document.getElementById('mute-duration')?.value || '10';
  db.ref('mutes/' + uid).set({ until: Date.now() + parseInt(duration) * 60000, mutedBy: currentUsername })
    .then(() => { Toast.show(`تم كتم ${name}.`, 'success'); closePlayerMenu(); });
}

function modBanUser24h(uid, name) {
  if (!confirm(`حظر ${name} لمدة 24 ساعة؟`)) return;
  db.ref('bans/' + uid).set({ until: Date.now() + 86400000, bannedBy: currentUsername, username: name })
    .then(() => { Toast.show(`تم حظر ${name}.`, 'warning'); closePlayerMenu(); });
}

function toggleMuteUser(uid) {
  db.ref('users/' + uid + '/isMuted').once('value', snap => {
    db.ref('users/' + uid + '/isMuted').set(!snap.val(), e => {
      if (!e) Toast.show(snap.val() ? 'تم إلغاء الكتم!' : 'تم الكتم!', 'success');
    });
  });
}

// ============================================================
//  حذف رسالة
// ============================================================
function deleteMessage(messageId) {
  if (!isAdmin && !isChatMod) return;
  if (!confirm('حذف هذه الرسالة؟')) return;
  db.ref('global_chat/' + messageId).remove(err => {
    if (err) Toast.show('فشل الحذف، حاول مرة أخرى.', 'error');
  });
}

// ============================================================
//  الإبلاغ عن رسالة
// ============================================================
function reportMessage(messageId, senderName, senderUid, text) {
  const user = auth.currentUser; if (!user) return;
  const modal = document.createElement('div');
  modal.id = 'report-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:#0e0e1c;border:1px solid rgba(255,71,87,0.3);border-radius:18px;
      padding:22px;width:290px;color:white;font-family:inherit;direction:rtl">
      <h3 style="margin:0 0 6px;color:#ff4757;font-size:14px">🚩 إبلاغ عن رسالة</h3>
      <p style="font-size:11px;color:#555;margin:0 0 14px">من: <strong style="color:#888">${escapeHTML(senderName)}</strong></p>
      <div style="font-size:11px;color:#555;margin-bottom:8px">السبب:</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
        ${['محتوى مسيء','تحرش أو تنمر','محتوى مخالف','إزعاج وسبام','أخرى'].map((r,i) => `
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px">
            <input type="radio" name="report-reason" value="${r}" ${i===0?'checked':''}> ${r}
          </label>`).join('')}
      </div>
      <textarea id="report-details" rows="2" placeholder="تفاصيل إضافية..."
        style="width:100%;background:#08080e;border:1px solid rgba(180,130,0,0.15);color:white;
          border-radius:9px;padding:8px;font-family:inherit;font-size:12px;
          resize:none;box-sizing:border-box;margin-bottom:12px"></textarea>
      <div style="display:flex;gap:8px">
        <button onclick="submitReport('${messageId}','${escapeHTML(senderName)}','${senderUid||''}','${escapeHTML(text)}')"
          style="flex:1;padding:10px;background:#ff4757;color:white;border:none;
            border-radius:9px;font-weight:800;cursor:pointer;font-family:inherit;font-size:12px">إرسال</button>
        <button onclick="document.getElementById('report-modal').remove()"
          style="padding:10px 14px;background:#111118;color:#666;border:none;
            border-radius:9px;cursor:pointer;font-family:inherit;font-size:12px">إلغاء</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function submitReport(messageId, senderName, senderUid, messageText) {
  const user    = auth.currentUser; if (!user) return;
  const reason  = document.querySelector('input[name="report-reason"]:checked')?.value || 'أخرى';
  const details = document.getElementById('report-details')?.value.trim() || '';
  db.ref('reports').push({
    messageId, type: 'message',
    reportedUser: senderName, reportedUserUid: senderUid || '',
    reportedBy: currentUsername, reporterUid: user.uid,
    messageText: messageText || '',
    reason, details,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    status: 'pending'
  }).then(() => {
    document.getElementById('report-modal')?.remove();
    if (typeof showToast === 'function') showToast('✅ تم إرسال الإبلاغ');
    else Toast.show('✅ تم إرسال الإبلاغ', 'success');
  });
}
