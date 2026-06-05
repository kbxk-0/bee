// ============================================================
//  js/chat.js — bee platform
//  الشات العام + الرسائل الخاصة + أدوات الإشراف
//  ملاحظة: شات الكلان انتقل إلى clan.js
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
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#1c1500,#2a2000);
    border:1px solid rgba(251,191,36,0.5);
    color:#fbbf24;padding:10px 20px;border-radius:12px;
    font-size:13px;font-weight:bold;z-index:99999;
    box-shadow:0 4px 20px rgba(251,191,36,0.2);
  `;
  toast.textContent = `💰 استلمت ${amount} 🪙 من ${fromName}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== الشات العام =====
function listenToGlobalChat() {
  const chat = document.getElementById('chat-messages');
  if (!chat) return;

  let marquee = document.getElementById('global-marquee');
  if (!marquee) {
    marquee = document.createElement('div');
    marquee.id = 'global-marquee';
    marquee.style.cssText = 'display:none;width:100%;padding:8px;font-weight:bold;overflow:hidden;border-bottom:1px solid #333;';
    chat.prepend(marquee);
  }

  if (chatListener) { chat.scrollTop = chat.scrollHeight; return; }
  chat.innerHTML = '';
  chat.appendChild(marquee);

  chatListener = db.ref('global_chat').limitToLast(50);
  chatListener.on('child_added', snap => {
    const msg = snap.val();
    if (!msg) return;

    if (msg.type === 'marquee') {
      marquee.style.display = 'block';
      marquee.innerHTML = `<marquee scrollamount="5">${escapeHTML(msg.text)}</marquee>`;
      if (msg.isAdmin) {
        marquee.style.background = '#ff4757';
        marquee.style.color = 'white';
      } else {
        marquee.style.background = '#ffd700';
        marquee.style.color = 'black';
      }
      return;
    }

    const isMine = auth.currentUser && msg.uid === auth.currentUser.uid;
    const color  = getAvatarColor(msg.sender || '؟');
    const letter = (msg.sender || '؟').charAt(0).toUpperCase();

    const senderName = (() => {
      let n = '';
      if(msg.title) n += `<span style="color:${msg.titleColor||'#a78bfa'};font-size:10px;font-weight:700;margin-left:2px">‹${escapeHTML(msg.title)}›</span> `;
      n += `<strong onclick="openPlayerMenu('${msg.uid}','${escapeHTML(msg.sender)}')" style="cursor:pointer;text-decoration:underline;color:${msg.isVIP?'#ffd700':'inherit'}">${escapeHTML(msg.sender)}</strong>`;
      if(msg.isVIP) n += ' <span style="background:linear-gradient(135deg,#b8860b,#ffd700);color:#1a0800;font-size:7px;padding:1px 4px;border-radius:4px;font-weight:900">★VIP</span>';
      return n;
    })();
    const lvlTag = msg.level ? `<span style="background:#ffd700;color:black;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:bold">Lv.${msg.level}</span> ` : '';
    const vipTag = msg.isVIP ? `<span style="background:#ffa500;color:black;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:bold">VIP</span> ` : '';

    const avatar = `<div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;color:white;flex-shrink:0">${letter}</div>`;

    const msgKey = snap.key;
    const canDelete = isAdmin || isChatMod;

    const wrap = document.createElement('div');
    wrap.style.cssText = `display:flex;align-items:flex-end;gap:7px;${isMine ? 'flex-direction:row-reverse' : ''}`;

    const bubble = document.createElement('div');
    bubble.style.cssText = isMine
      ? 'background:#6c63ff;color:white;border-radius:12px 12px 0 12px;padding:8px 11px;max-width:72%;font-size:13px;word-break:break-word;'
      : 'background:#1e1e2e;color:#e8e8f0;border-radius:12px 12px 12px 0;padding:8px 11px;max-width:72%;font-size:13px;word-break:break-word;border:1px solid #2a2a3f;';

    const deleteBtn = canDelete
      ? `<button onclick="deleteMessage('${msgKey}')" style="background:none;border:none;color:#ff4757;font-size:11px;cursor:pointer;opacity:0.5;padding:0 2px">🗑️</button>`
      : '';

    const reportBtn = !isMine
      ? `<button onclick="reportMessage('${msgKey}','${escapeHTML(msg.sender)}','${escapeHTML(msg.text).substring(0,50)}')" style="background:none;border:none;color:#888;font-size:10px;cursor:pointer;opacity:0.4;padding:0 2px">🚩</button>`
      : '';

    const actionBtns = `<span style="float:${isMine?'left':'right'}">${deleteBtn}${reportBtn}</span>`;
    bubble.innerHTML = `${lvlTag}${vipTag}${senderName}${actionBtns}<br>${escapeHTML(msg.text)}`;

    wrap.innerHTML = isMine
      ? `${avatar}${bubble.outerHTML}`
      : `${avatar}${bubble.outerHTML}`;

    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  });
}

function sendMessage(isAmplifier = false) {
  const input = document.getElementById('chat-input');
  const user  = auth.currentUser;
  if (!user || !input) return;
  if (currentLevel < 10 && !isAdmin) { alert('يجب أن تكون مستوى 10 أو أعلى للمشاركة في الشات العام!'); return; }
  if (isMuted) { alert('أنت مكتوم!'); return; }

  const text = input.value.trim();
  if (!text) return;

  if (isAmplifier) {
    if (currentCoins < 10000) { alert('تحتاج 10,000 كوينز للمكبر!'); return; }
    db.ref('users/' + user.uid + '/coins').transaction(c => (c || 0) - 10000);
    db.ref('global_chat').push({
      uid: user.uid, sender: currentUsername, text,
      type: 'marquee', isAdmin: false,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  } else {
    db.ref('global_chat').push({
      uid: user.uid, sender: currentUsername, level: currentLevel,
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
}

// ===== الرسائل الخاصة =====
function listenToPrivateMessages() {
  const pmBox = document.getElementById('private-messages-box');
  const user  = auth.currentUser;
  if (!pmBox || !user || pmListener) return;
  pmBox.innerHTML = '';

  pmListener = db.ref('user_pms/' + user.uid).limitToLast(30);
  pmListener.on('child_added', snap => {
    const pm = snap.val(); if (!pm) return;
    const isMine = pm.senderUid === user.uid;
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
        <div style="font-size:12px;color:${isMine ? '#a78bfa' : '#34d399'}">${escapeHTML(pm.text)}</div>
      </div>`;
    pmBox.appendChild(div);
    pmBox.scrollTop = pmBox.scrollHeight;
  });
}

// ===== أدوات الإدارة في الشات =====
function renderAdminChatPanel() {
  if (!isAdmin && !isChatMod) return;
  if (document.getElementById('chat-admin-bar')) return;

  const panel = document.createElement('div');
  panel.id = 'chat-admin-bar';

  if (isAdmin) {
    panel.style.cssText = 'padding:6px 10px;background:#2a0a0a;border-bottom:1px solid #ff4757;font-size:11px;color:#ff4757;text-align:center';
    panel.innerHTML = `👑 وضع الإدارة مفعّل · <button onclick="showSection('admin-panel')" style="background:none;border:none;color:#ff4757;font-size:11px;cursor:pointer;text-decoration:underline">فتح لوحة التحكم</button>`;
  } else {
    panel.style.cssText = 'padding:6px 10px;background:#0a0a2a;border-bottom:1px solid #6c63ff;font-size:11px;color:#a78bfa;text-align:center';
    panel.innerHTML = `🛡️ وضع الإشراف مفعّل — يمكنك كتم وحظر اللاعبين`;
  }

  document.getElementById('chat')?.prepend(panel);
}

function toggleMuteUser(uid) {
  db.ref('users/' + uid + '/isMuted').once('value', snap => {
    const muted = snap.val() || false;
    db.ref('users/' + uid + '/isMuted').set(!muted, e => {
      if (!e) alert(muted ? 'تم إلغاء الكتم!' : 'تم الكتم!');
    });
  });
}

// ===== منيو خيارات اللاعب =====
function openPlayerMenu(targetUid, targetName) {
  closePlayerMenu();
  const isMod = typeof isChatMod !== 'undefined' ? isChatMod : false;
  const showModTools = isAdmin || isMod;

  const overlay = document.createElement('div');
  overlay.id = 'menu-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;';
  overlay.onclick = closePlayerMenu;

  const menu = document.createElement('div');
  menu.id = 'player-context-menu';
  menu.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:#1a1a28;border:2px solid #6c63ff;border-radius:16px;
    padding:20px;width:280px;z-index:10000;
    box-shadow:0 10px 25px rgba(0,0,0,0.7);
    color:white;text-align:center;direction:rtl;font-family:inherit;`;

  menu.innerHTML = `
    <div id="player-menu-container">
      <h3 style="margin:0 0 4px;color:#ffd700">${escapeHTML(targetName)}</h3>
      <p style="font-size:11px;color:#888;margin-bottom:16px">إجراءات اللاعب</p>
      <button onclick="sendPrivateMessageFromMenu('${targetUid}','${escapeHTML(targetName)}')"
        style="width:100%;padding:10px;background:#2a2a4f;color:#a78bfa;border:1px solid #6c63ff;border-radius:8px;margin-bottom:8px;font-weight:bold;cursor:pointer">
        💬 إرسال رسالة خاصة
      </button>
      <button onclick="transferCoinsFromMenu('${targetUid}','${escapeHTML(targetName)}')"
        style="width:100%;padding:10px;background:#ffd700;color:black;border:none;border-radius:8px;margin-bottom:8px;font-weight:bold;cursor:pointer">
        💸 تحويل كوينز
      </button>
      <button onclick="openGiftSubMenu('${targetUid}','${escapeHTML(targetName)}')"
        style="width:100%;padding:10px;background:linear-gradient(135deg,#ff9f43,#ff4757);color:white;border:none;border-radius:8px;margin-bottom:12px;font-weight:bold;cursor:pointer">
        🎁 إرسال هدية ملكية
      </button>
      ${showModTools ? `
        <div style="border-top:1px solid #2a2a3f;padding-top:10px;margin-top:10px">
          <p style="font-size:11px;color:#ff4757;font-weight:bold;margin:0 0 8px">🛡️ أدوات الإشراف</p>
          <select id="mute-duration" style="width:100%;padding:6px;background:#111118;color:white;border:1px solid #ff4757;border-radius:6px;margin-bottom:8px;font-size:12px">
            <option value="10">كتم لمدة 10 دقائق</option>
            <option value="60">كتم لمدة ساعة</option>
            <option value="1440">كتم لمدة 24 ساعة</option>
          </select>
          <button onclick="modMuteUser('${targetUid}','${escapeHTML(targetName)}')"
            style="width:100%;padding:8px;background:#ff4757;color:white;border:none;border-radius:6px;margin-bottom:6px;font-size:12px;font-weight:bold;cursor:pointer">
            🤫 تطبيق الكتم
          </button>
          <button onclick="modBanUser24h('${targetUid}','${escapeHTML(targetName)}')"
            style="width:100%;padding:8px;background:#b33939;color:white;border:none;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer">
            🚫 حظر 24 ساعة
          </button>
        </div>` : ''}
      <button onclick="closePlayerMenu()"
        style="margin-top:14px;background:transparent;color:#888;border:none;cursor:pointer;font-size:12px;text-decoration:underline">
        إغلاق
      </button>
    </div>`;

  document.body.appendChild(overlay);
  document.body.appendChild(menu);
}

function openGiftSubMenu(targetUid, targetName) {
  const container = document.getElementById('player-menu-container');
  if (!container) return;
  container.innerHTML = `
    <h3 style="margin:0 0 4px;color:#ff9f43">🎁 متجر الهدايا</h3>
    <p style="font-size:11px;color:#888;margin-bottom:16px">اختر هدية لـ ‹${escapeHTML(targetName)}›</p>
    ${[
      ['gift_honey','🍯 عسل ملكي','20'],
      ['gift_bee',  '🐝 نحلة ذهبية','50'],
      ['gift_crown','👑 تاج النخبة','200']
    ].map(([id,name,price]) => `
      <button onclick="triggerGiftDelivery('${targetUid}','${escapeHTML(targetName)}','${id}')"
        style="width:100%;padding:11px;background:#1e1e2e;color:#fff;
          border:1px solid rgba(255,159,67,0.3);border-radius:10px;margin-bottom:8px;
          font-size:12px;font-weight:bold;cursor:pointer;display:flex;
          justify-content:space-between;align-items:center">
        <span>${name}</span><span style="color:#ffd700">${price} 🪙</span>
      </button>`).join('')}
    <button onclick="openPlayerMenu('${targetUid}','${escapeHTML(targetName)}')"
      style="background:none;border:none;color:#a78bfa;font-size:12px;font-weight:bold;cursor:pointer;text-decoration:underline">
      ⬅️ رجوع
    </button>`;
}

function triggerGiftDelivery(targetUid, targetName, giftId) {
  if (typeof sendGift === 'function') {
    sendGift(targetUid, targetName, giftId);
    closePlayerMenu();
  }
}

function closePlayerMenu() {
  document.getElementById('player-context-menu')?.remove();
  document.getElementById('menu-overlay')?.remove();
}

function transferCoinsFromMenu(targetUid, targetName) {
  const user = auth.currentUser; if (!user) return;
  if (targetName === currentUsername) { alert('لا يمكنك التحويل لنفسك!'); return; }

  const amount = parseInt(prompt(`أدخل الكمية لتحويلها إلى ${targetName}:`));
  if (isNaN(amount) || amount <= 0) { alert('كمية غير صحيحة'); return; }
  if (amount > currentCoins) { alert('لا تملك هذا القدر!'); return; }

  const tax       = Math.floor(amount * 0.05);
  const netAmount = amount - tax;
  if (!confirm(`سيُخصم ${amount} 🪙\nضريبة 5%: ${tax} 🪙\nيستلم ${targetName}: ${netAmount} 🪙\n\nاستمرار؟`)) return;

  db.ref('users/' + user.uid).transaction(u => {
    if (u && u.coins >= amount) { u.coins -= amount; return u; }
    return u;
  }, (err, committed) => {
    if (committed) {
      db.ref('transfers/' + targetUid).push({
        amount: netAmount, from: currentUsername, fromUid: user.uid, timestamp: Date.now()
      }).then(() => {
        alert(`تم تحويل 🪙 ${netAmount} إلى ${targetName}!`);
        closePlayerMenu();
      });
    } else {
      alert('فشل التحويل.');
    }
  });
}

function sendPrivateMessageFromMenu(targetUid, targetName) {
  const user = auth.currentUser; if (!user) return;
  if (isMuted) { alert('أنت مكتوم!'); return; }
  closePlayerMenu();
  // استخدم نظام المحادثات الجديد
  if (typeof startConversationWith === 'function') {
    startConversationWith(targetUid, targetName); return;
  }
  const text = prompt(`أرسل رسالة خاصة إلى ${targetName}:`);
  if (!text?.trim()) return;

  const pmData = {
    senderUid: user.uid, senderName: currentUsername,
    receiverUid: targetUid, receiverName: targetName,
    text: text.trim(), timestamp: firebase.database.ServerValue.TIMESTAMP
  };
  const key     = db.ref().child('user_pms').push().key;
  const updates = {
    [`/user_pms/${user.uid}/${key}`]:   pmData,
    [`/user_pms/${targetUid}/${key}`]:  pmData,
    [`/users/${targetUid}/unreadPMs`]:  firebase.database.ServerValue.increment(1)
  };

  db.ref().update(updates).then(() => {
    if (typeof showBrowserNotif === 'function') showBrowserNotif(`رسالة من ${currentUsername}`, text);
    alert('تم إرسال الرسالة ✓');
    closePlayerMenu();
  });
}

function modMuteUser(uid, name) {
  const duration = document.getElementById('mute-duration')?.value || '10';
  db.ref('mutes/' + uid).set({
    until: Date.now() + parseInt(duration) * 60 * 1000,
    mutedBy: currentUsername
  }).then(() => { alert(`تم كتم ${name}.`); closePlayerMenu(); });
}

function modBanUser24h(uid, name) {
  if (!confirm(`حظر ${name} لمدة 24 ساعة؟`)) return;
  db.ref('bans/' + uid).set({
    until: Date.now() + 24 * 60 * 60 * 1000,
    bannedBy: currentUsername
  }).then(() => { alert(`تم حظر ${name}.`); closePlayerMenu(); });
}

// ===== حذف رسالة من الشات العام =====
function deleteMessage(messageId) {
  if (!isAdmin && !isChatMod) return;
  if (!confirm('حذف هذه الرسالة؟')) return;
  db.ref('global_chat/' + messageId).remove(err => {
    if (err) alert('فشل الحذف، حاول مرة أخرى.');
  });
}

// ============================================================
//  الإبلاغ عن رسالة
// ============================================================

function reportMessage(messageId, senderName, text) {
  const user = auth.currentUser; if (!user) return;

  const modal = document.createElement('div');
  modal.id    = 'report-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div style="background:#1a1a28;border:1px solid #ff4757;border-radius:16px;
      padding:20px;width:290px;color:white;font-family:inherit;direction:rtl">
      <h3 style="margin:0 0 6px;color:#ff4757;font-size:14px">🚩 إبلاغ عن رسالة</h3>
      <p style="font-size:11px;color:#888;margin:0 0 14px">
        رسالة من: <strong style="color:#aaa">${escapeHTML(senderName)}</strong>
      </p>

      <div style="font-size:11px;color:#888;margin-bottom:8px">سبب الإبلاغ:</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
        ${['محتوى مسيء','تحرش أو تنمر','محتوى مخالف','إزعاج وسبام','أخرى'].map((r, i) => `
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px">
            <input type="radio" name="report-reason" value="${r}" ${i===0?'checked':''}>
            ${r}
          </label>`).join('')}
      </div>

      <div style="font-size:11px;color:#888;margin-bottom:6px">تفاصيل إضافية (اختياري):</div>
      <textarea id="report-details" rows="2"
        placeholder="أضف تفاصيل..."
        style="width:100%;background:#111118;border:1px solid #2a2a3f;color:white;
          border-radius:8px;padding:8px;font-family:inherit;font-size:12px;
          resize:none;box-sizing:border-box;margin-bottom:12px"></textarea>

      <div style="display:flex;gap:8px">
        <button onclick="submitReport('${messageId}','${escapeHTML(senderName)}')"
          style="flex:1;padding:10px;background:#ff4757;color:white;border:none;
            border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;font-size:12px">
          إرسال الإبلاغ
        </button>
        <button onclick="document.getElementById('report-modal').remove()"
          style="padding:10px 14px;background:#2a2a3f;color:#aaa;border:none;
            border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px">
          إلغاء
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function submitReport(messageId, senderName) {
  const user   = auth.currentUser; if (!user) return;
  const reason = document.querySelector('input[name="report-reason"]:checked')?.value || 'أخرى';
  const details = document.getElementById('report-details')?.value.trim() || '';

  db.ref('reports').push({
    messageId,
    reportedUser: senderName,
    reportedBy: currentUsername,
    reporterUid: user.uid,
    reason,
    details,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    status: 'pending'
  }).then(() => {
    document.getElementById('report-modal')?.remove();
    if (typeof showToast === 'function') showToast('✅ تم إرسال الإبلاغ للإدارة');
  });
}
