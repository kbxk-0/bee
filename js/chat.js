// ============================================================
//  js/chat.js — bee platform (نسخة خالد المطورة المدمجة بالهدايا)
// ============================================================

function triggerMarquee(text) {
  const el = document.getElementById('marquee-content');
  if (!el) return;
  el.innerText = text;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'moveMarquee 8s 2 linear';
}

// إشعار عند استلام تحويل كوينز
function showToastTransfer(fromName, amount) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#1c1500,#2a2000);
    border:1px solid rgba(251,191,36,0.5);
    color:#fbbf24;padding:10px 20px;border-radius:12px;
    font-size:13px;font-weight:bold;z-index:99999;
    box-shadow:0 4px 20px rgba(251,191,36,0.2);
    animation:fadeInUp .3s ease;
  `;
  toast.textContent = `💰 استلمت ${amount} 🪙 من ${fromName}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== الشات العام =====
function listenToGlobalChat() {
  const chat = document.getElementById('chat-messages');
  if (!chat) return;

  // إنشاء حاوية الشريط داخل الشات في الأعلى إذا لم تكن موجودة
  let marquee = document.getElementById('global-marquee');
  if (!marquee) {
    marquee = document.createElement('div');
    marquee.id = 'global-marquee';
    marquee.style.cssText = 'display:none; width:100%; padding:8px; font-weight:bold; overflow:hidden; border-bottom:1px solid #333;';
    chat.prepend(marquee);
  }

  if (chatListener) { chat.scrollTop = chat.scrollHeight; return; }
  chat.innerHTML = '';
  chat.appendChild(marquee); // الحفاظ على الشريط في الأعلى

  chatListener = db.ref('global_chat').limitToLast(50);
  chatListener.on('child_added', snap => {
    const msg = snap.val();
    if (!msg) return;

    // --- التعامل مع الشريط (Marquee) ---
    if (msg.type === 'marquee') {
      marquee.style.display = 'block';
      marquee.innerHTML = `<marquee scrollamount="5">${escapeHTML(msg.text)}</marquee>`;
      
      if (msg.isAdmin) {
        marquee.style.background = '#ff4757'; // أحمر
        marquee.style.color = 'white';
        chat.style.border = '2px solid #ff4757'; // تأثير وميض الحدود
        chat.classList.add('flash-border'); 
      } else {
        marquee.style.background = '#ffd700'; // أصفر للمكبر العادي
        marquee.style.color = 'black';
        chat.style.border = '1px solid #2a2a3f';
        chat.classList.remove('flash-border');
      }
      return; 
    }

    // --- رسم الرسائل العادية ---
    const isMine = auth.currentUser && msg.uid === auth.currentUser.uid;
    const color  = getAvatarColor(msg.sender || '؟');
    const letter = (msg.sender || '؟').charAt(0).toUpperCase();

    // إضافة التفاعل بالضغط على الاسم لفتح المنيو الجديد
    const senderName = `<strong onclick="openPlayerMenu('${msg.uid}', '${escapeHTML(msg.sender)}')" style="cursor:pointer; text-decoration:underline;">${escapeHTML(msg.sender)}</strong>`;

    const lvlTag   = msg.level  ? `<span style="background:#ffd700;color:black;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:bold">Lv.${msg.level}</span> ` : '';
    const vipTag   = msg.isVIP  ? `<span style="background:#ffa500;color:black;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:bold">VIP</span> ` : '';
    const avatar = `<div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;color:white;flex-shrink:0">${letter}</div>`;

    const wrap = document.createElement('div');
    wrap.style.cssText = `display:flex;align-items:flex-end;gap:7px;${isMine ? 'flex-direction:row-reverse' : ''}`;

    const bubble = document.createElement('div');
    bubble.style.cssText = isMine
      ? 'background:#6c63ff;color:white;border-radius:12px 12px 0 12px;padding:8px 11px;max-width:72%;font-size:13px;word-break:break-word;'
      : 'background:#1e1e2e;color:#e8e8f0;border-radius:12px 12px 12px 0;padding:8px 11px;max-width:72%;font-size:13px;word-break:break-word;border:1px solid #2a2a3f;';
    
    bubble.innerHTML = `${lvlTag}${vipTag}${senderName}<br>${escapeHTML(msg.text)}`;

    wrap.innerHTML = isMine ? `${avatar.replace('div style="', 'div style="align-self:flex-end;')}${bubble.outerHTML}` : `${avatar}${bubble.outerHTML}`;

    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  });
}

function sendMessage(isAmplifier = false) { 
  const input = document.getElementById('chat-input');
  const user  = auth.currentUser;
  if (!user || !input) return;
  
  // شرط المستوى 10
  if (currentLevel < 10 && !isAdmin) {
    alert("يجب أن تكون مستوى 10 أو أعلى للمشاركة في الشات العام!");
    return;
  }
  
  if (isMuted) { alert("أنت مكتوم!"); return; }
  
  const text = input.value.trim();
  if (!text) return;

  if (isAmplifier) {
    if (currentCoins < 10000) { alert("تحتاج 10,000 كوينز للمكبر!"); return; }
    
    // خصم الكوينز وإرسال رسالة المكبر
    db.ref('users/' + user.uid + '/coins').transaction(c => (c || 0) - 10000);
    db.ref('global_chat').push({
      uid: user.uid, sender: currentUsername, text: text,
      type: 'marquee', isAdmin: false, timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  } else {
    // إرسال رسالة عادية
    db.ref('global_chat').push({
      uid: user.uid, sender: currentUsername, level: currentLevel, 
      isVIP, clan: currentClan, title: currentTitle, 
      text: text, timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    // مكافآت الشات اليومية والـ XP
    db.ref('users/'+user.uid).transaction(u => {
      if (!u) return u;
      u.coins = (u.coins||0) + 1;
      u.xp    = (u.xp||0) + 10;
      if (u.xp >= u.level * 100) u.level = (u.level||1) + 1;
      if (!u.quests) u.quests = {};
      if (!u.quests.chatClaimed) u.quests.chatProgress = (u.quests.chatProgress||0) + 1;
      return u;
    });
  }
  input.value = '';
}

// ===== الرسائل الخاصة (المطورة آمنياً) =====
function listenToPrivateMessages() {
  const pmBox = document.getElementById('private-messages-box');
  const user = auth.currentUser;
  if (!pmBox || !user) return;
  if (pmListener) return;
  pmBox.innerHTML = '';

  pmListener = db.ref('user_pms/' + user.uid).limitToLast(30);
  pmListener.on('child_added', snap => {
    const pm = snap.val();
    if (!pm) return;

    const isMine = pm.senderUid === user.uid;
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
        <div style="font-size:12px;color:${isMine ? '#a78bfa' : '#34d399'}">${escapeHTML(pm.text)}</div>
      </div>`;
    pmBox.appendChild(div);
    pmBox.scrollTop = pmBox.scrollHeight;
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
    uid: user.uid, 
    sender: currentUsername,
    title: currentTitle, 
    titleColor: currentTitleColor,
    text: text,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  input.value = '';
}

// ===== أدوات الشات للإدارة =====
function renderAdminChatPanel() {
  if (!isAdmin) return;
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

// ============================================================
// ===== النظام الجديد: خيارات اللاعب من المنيو والمشرفين =====
// ============================================================

function openPlayerMenu(targetUid, targetName) {
  closePlayerMenu();

  const menu = document.createElement('div');
  menu.id = 'player-context-menu';
  menu.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #1a1a28; border: 2px solid #6c63ff; border-radius: 16px;
    padding: 20px; width: 280px; z-index: 10000; box-shadow: 0 10px 25px rgba(0,0,0,0.7);
    color: white; text-align: center; direction: rtl; font-family: inherit;
  `;

  // التحقق إذا كان الضاغط أدمن أو لديه رتبة إشراف شات
  const isMod = typeof isChatMod !== 'undefined' ? isChatMod : false;
  const showModTools = isAdmin || isMod;

  // الحاوية الداخلية لتسهيل التبديل لمتجر الهدايا
  menu.innerHTML = `
    <div id="player-menu-container">
      <h3 style="margin: 0 0 4px 0; color: #ffd700;">${escapeHTML(targetName)}</h3>
      <p style="font-size: 11px; color: #888; margin-bottom: 16px;">إجراءات اللاعب</p>
      
      <button onclick="sendPrivateMessageFromMenu('${targetUid}', '${targetName}')" style="width:100%; padding:10px; background:#2a2a4f; color:#a78bfa; border:1px solid #6c63ff; border-radius:8px; margin-bottom:8px; font-weight:bold; cursor:pointer;">💬 إرسال رسالة خاصة</button>
      <button onclick="transferCoinsFromMenu('${targetUid}', '${targetName}')" style="width:100%; padding:10px; background:#ffd700; color:black; border:none; border-radius:8px; margin-bottom:8px; font-weight:bold; cursor:pointer;">💸 تحويل كوينز</button>
      
      <button onclick="openGiftSubMenu('${targetUid}', '${targetName}')" style="width:100%; padding:10px; background: linear-gradient(135deg, #ff9f43, #ff4757); color:white; border:none; border-radius:8px; margin-bottom:12px; font-weight:bold; cursor:pointer; box-shadow: 0 4px 10px rgba(255,71,87,0.2);">🎁 إرسال هدية ملكية</button>
      
      ${showModTools ? `
        <div style="border-top: 1px solid #2a2a3f; padding-top: 10px; margin-top: 10px;">
          <p style="font-size: 11px; color: #ff4757; font-weight: bold; margin: 0 0 8px 0;">🛡️ أدوات الإشراف داخل الشات</p>
          <select id="mute-duration" style="width:100%; padding:6px; background:#111118; color:white; border:1px solid #ff4757; border-radius:6px; margin-bottom:8px; font-size:12px;">
            <option value="10">كتم لمدة 10 دقائق</option>
            <option value="60">كتم لمدة ساعة</option>
            <option value="1440">كتم لمدة 24 ساعة</option>
          </select>
          <button onclick="modMuteUser('${targetUid}', '${targetName}')" style="width:100%; padding:8px; background:#ff4757; color:white; border:none; border-radius:6px; margin-bottom:6px; font-size:12px; font-weight:bold; cursor:pointer;">🤫 تطبيق الكتم</button>
          <button onclick="modBanUser24h('${targetUid}', '${targetName}')" style="width:100%; padding:8px; background:#b33939; color:white; border:none; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer;">🚫 حظر 24 ساعة</button>
        </div>
      ` : ''}
      
      <button onclick="closePlayerMenu()" style="margin-top: 14px; background: transparent; color: #888; border: none; cursor: pointer; font-size: 12px; text-decoration: underline;">إغلاق</button>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.id = 'menu-overlay';
  overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999;';
  overlay.onclick = closePlayerMenu;

  document.body.appendChild(overlay);
  document.body.appendChild(menu);
}

// [تابع للنظام الجديد 🎁] دالة فتح واجهة اختيار الهدايا داخل نفس المنيو
function openGiftSubMenu(targetUid, targetName) {
  const container = document.getElementById('player-menu-container');
  if (!container) return;

  container.innerHTML = `
    <h3 style="margin: 0 0 4px 0; color: #ff9f43;">🎁 متجر الهدايا الفوري</h3>
    <p style="font-size: 11px; color: #888; margin-bottom: 16px;">اختر هدية لإرسالها إلى ‹${escapeHTML(targetName)}›</p>
    
    <button onclick="triggerGiftDelivery('${targetUid}', '${targetName}', 'gift_honey')" style="width:100%; padding:11px; background:#1e1e2e; color:#fff; border:1px solid rgba(255,159,67,0.3); border-radius:10px; margin-bottom:8px; font-size:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
      <span>🍯 عسل ملكي</span> <span style="color:#ffd700;">20 🪙</span>
    </button>
    
    <button onclick="triggerGiftDelivery('${targetUid}', '${targetName}', 'gift_bee')" style="width:100%; padding:11px; background:#1e1e2e; color:#fff; border:1px solid rgba(255,159,67,0.3); border-radius:10px; margin-bottom:8px; font-size:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
      <span>🐝 نحلة ذهبية</span> <span style="color:#ffd700;">50 🪙</span>
    </button>
    
    <button onclick="triggerGiftDelivery('${targetUid}', '${targetName}', 'gift_crown')" style="width:100%; padding:11px; background:#1e1e2e; color:#fff; border:1px solid rgba(255,159,67,0.3); border-radius:10px; margin-bottom:16px; font-size:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
      <span>👑 تاج النخبة</span> <span style="color:#ffd700;">200 🪙</span>
    </button>
    
    <button onclick="openPlayerMenu('${targetUid}', '${targetName}')" style="background:none; border:none; color:#a78bfa; font-size:12px; font-weight:bold; cursor:pointer; text-decoration:underline;">⬅️ العودة للخلف</button>
  `;
}

// [تابع للنظام الجديد 🎁] دالة وسيطة لتنفيذ الإرسال وإغلاق المنيو
function triggerGiftDelivery(targetUid, targetName, giftId) {
  if (typeof sendGift === 'function') {
    sendGift(targetUid, targetName, giftId);
    closePlayerMenu();
  } else {
    alert('⚠️ خطأ: دالة sendGift غير موجودة في ملف app.js الرئيسي!');
  }
}

function closePlayerMenu() {
  const menu = document.getElementById('player-context-menu');
  const overlay = document.getElementById('menu-overlay');
  if (menu) menu.remove();
  if (overlay) overlay.remove();
}

function transferCoinsFromMenu(targetUid, targetName) {
  const user = auth.currentUser;
  if (!user) return;

  if (targetName === currentUsername) { 
    alert("لا يمكنك التحويل لنفسك!"); 
    return; 
  }

  const amountInput = prompt(`أدخل كمية الكوينز المراد تحويلها إلى ${targetName}:`);
  const amount = parseInt(amountInput);

  if (isNaN(amount) || amount <= 0) { 
    alert("برجاء إدخال كمية صحيحة!"); 
    return; 
  }
  if (amount > currentCoins) { 
    alert("لا تملك هذا القدر من الكوينز!"); 
    return; 
  }

  const taxPercentage = 0.05; // ضريبة 5%
  const tax = Math.floor(amount * taxPercentage);
  const netAmount = amount - tax;

  const confirmTransfer = confirm(`سيتم خصم ${amount} 🪙 من رصيدك.\n(الضريبة 5%: ${tax} 🪙)\nسيستلم ${targetName} صافي: ${netAmount} 🪙.\n\nهل تريد الاستمرار؟`);
  if (!confirmTransfer) return;

  db.ref('users/' + user.uid).transaction(u => {
    if (u && u.coins >= amount) { u.coins -= amount; return u; }
    return u;
  }, (error, committed) => {
    if (committed) {
      // كتابة طلب التحويل — المستلم يطبقه على نفسه
      db.ref('transfers/' + targetUid).push({
        amount:    netAmount,
        from:      currentUsername,
        fromUid:   user.uid,
        timestamp: Date.now()
      }).then(() => {
        alert(`تم تحويل 🪙 ${netAmount} إلى ${targetName} بنجاح! (بعد ضريبة ${tax} 🪙)`);
        closePlayerMenu();
      }).catch(err => {
        console.error("خطأ في الإيداع:", err);
        alert("تم خصم الكوينز لكن فشل إيداعها، يرجى مراسلة الإدارة.");
      });
    } else {
      alert("فشل التحويل. تأكد من رصيدك الحالي.");
    }
  });
}

function sendPrivateMessageFromMenu(targetUid, targetName) {
  const user = auth.currentUser;
  if (!user) return;
  if (isMuted) { alert("أنت مكتوم!"); return; }

  const text = prompt(`أرسل رسالة خاصة إلى ${targetName}:`);
  if (!text || !text.trim()) return;

  const pmData = {
    senderUid: user.uid, 
    senderName: currentUsername,
    receiverUid: targetUid, 
    receiverName: targetName,
    text: text.trim(),
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  const updates = {};
  const newPmKey = db.ref().child('user_pms').push().key;
  updates['/user_pms/' + user.uid + '/' + newPmKey] = pmData;
  updates['/user_pms/' + targetUid + '/' + newPmKey] = pmData;
  updates['/users/' + targetUid + '/unreadPMs'] = firebase.database.ServerValue.increment(1);

  db.ref().update(updates)
    .then(() => {
      if (typeof showBrowserNotif === 'function') {
        showBrowserNotif(`رسالة من ${currentUsername}`, text);
      }
      alert("تم إرسال الرسالة الخاصة بنجاح ✓");
      closePlayerMenu();
    })
    .catch(err => {
      console.error("خطأ في الخاص:", err);
      alert("فشل إرسال الرسالة.");
    });
}

function modMuteUser(uid, name) {
  const duration = document.getElementById('mute-duration').value;
  db.ref('mutes/' + uid).set({
    until: Date.now() + (parseInt(duration) * 60 * 1000),
    mutedBy: currentUsername
  }).then(() => {
    alert(`تم كتم اللاعب ${name} بنجاح.`);
    closePlayerMenu();
  });
}

function modBanUser24h(uid, name) {
  if(!confirm(`هل أنت متأكد من حظر ${name} لمدة 24 ساعة؟`)) return;
  
  db.ref('bans/' + uid).set({
    until: Date.now() + (24 * 60 * 60 * 1000),
    bannedBy: currentUsername
  }).then(() => {
    alert(`تم حظر اللاعب ${name} لمدة 24 ساعة.`);
    closePlayerMenu();
  });
}