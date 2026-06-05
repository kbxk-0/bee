// ============================================================
//  js/clan.js — bee platform
//  صفحة النوادي + شات الكلان
// ============================================================

// ===== رسم صفحة الكلان =====
function renderClan() {
  const sec = document.getElementById('clan');
  if (!sec) return;

  if (currentClan) {
    sec.innerHTML = `
      <div style="padding:12px;color:white;display:flex;flex-direction:column;
        gap:10px;height:calc(100vh - 70px);overflow:hidden">

        <div style="background:#1a1a28;border-radius:10px;border:1px solid #2ed573;
          padding:12px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
          <div>
            <div style="font-size:11px;color:#2ed573">كلانك الحالي</div>
            <div style="font-size:18px;font-weight:bold">[ ${escapeHTML(currentClan)} ]</div>
          </div>
          <div style="display:flex;gap:6px;flex-direction:column;align-items:flex-end">
            <button onclick="showClanMembers()"
              style="background:#2a2a4f;color:#fbbf24;border:1px solid rgba(251,191,36,0.4);
                border-radius:6px;font-size:11px;padding:5px 10px;cursor:pointer">
              👥 الأعضاء
            </button>
            <button onclick="showClanSettings()"
              style="background:#2a2a4f;color:#a78bfa;border:1px solid #6c63ff;
                border-radius:6px;font-size:11px;padding:5px 10px;cursor:pointer">
              ⚙️ إعدادات
            </button>
            <button onclick="leaveClan()"
              style="background:#ff4757;color:white;border:none;
                border-radius:6px;font-size:11px;padding:5px 10px;cursor:pointer">
              مغادرة
            </button>
          </div>
        </div>

        <div id="clan-settings-panel"
          style="display:none;background:#1a1a28;border-radius:10px;
            border:1px solid #6c63ff;padding:12px;flex-shrink:0">
          <div id="clan-settings-content">جاري التحميل...</div>
        </div>

        <div style="flex:1;background:#1a1a28;border-radius:10px;
          border:1px solid var(--accent);display:flex;flex-direction:column;min-height:0">
          <div style="background:var(--accent);padding:9px 12px;font-weight:bold;
            font-size:13px;border-radius:10px 10px 0 0;flex-shrink:0">
            💬 شات الكلان
          </div>
          <div id="clan-chat-messages"
            style="flex:1;padding:10px;overflow-y:auto;display:flex;flex-direction:column;gap:5px">
          </div>
          <div style="padding:8px;border-top:1px solid #2a2a3f;display:flex;gap:6px;flex-shrink:0">
            <input type="text" id="clan-chat-input" placeholder="رسالة للكلان..."
              class="input-field" style="flex:1"
              onkeydown="if(event.key==='Enter') sendClanMessage()">
            <button onclick="sendClanMessage()"
              style="padding:0 14px;background:#2ed573;color:black;
                border:none;border-radius:8px;font-size:16px;cursor:pointer">➤</button>
          </div>
        </div>
      </div>`;
    listenToClanChat();

  } else {
    sec.innerHTML = `
      <div style="padding:14px;color:white;height:calc(100vh - 70px);overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h2 style="margin:0;font-size:18px">⚔️ الكلانات</h2>
          <button onclick="toggleCreateForm()"
            style="background:#6c63ff;color:white;border:none;border-radius:8px;
              padding:8px 14px;font-size:12px;font-weight:bold;cursor:pointer">
            + إنشاء كلان
          </button>
        </div>

        <div id="create-clan-form"
          style="display:none;background:#1a1a28;border-radius:12px;
            border:1px solid var(--accent);padding:14px;margin-bottom:14px">
          <h4 style="margin:0 0 10px;color:var(--accent);font-size:14px">إنشاء كلان جديد</h4>
          <input type="text" id="new-clan-name" placeholder="اسم الكلان (3-10 أحرف)..."
            class="input-field" style="margin-bottom:10px">
          <div style="font-size:12px;color:#aaa;margin-bottom:8px">نوع القبول:</div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:white">
              <input type="radio" name="clan-type" value="open" checked>
              🔓 مفتوح — يدخل أي شخص فوراً
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:white">
              <input type="radio" name="clan-type" value="request">
              📋 بطلب — أنت تقبل أو ترفض
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:white">
              <input type="radio" name="clan-type" value="closed">
              🔒 مغلق — بالدعوة فقط
            </label>
          </div>
          <button onclick="createClan()"
            style="width:100%;padding:10px;background:#6c63ff;color:white;
              border:none;border-radius:8px;font-weight:bold;font-size:13px;cursor:pointer">
            تأسيس الكلان ⚔️
          </button>
        </div>

        <div style="font-size:12px;color:#666;margin-bottom:8px">الكلانات الموجودة</div>
        <div id="clans-list">
          <div style="text-align:center;color:#666;padding:30px">جاري التحميل...</div>
        </div>
      </div>`;
    loadClansList();
  }
}

function toggleCreateForm() {
  const f = document.getElementById('create-clan-form');
  if (!f) return;
  const isOpen = f.style.display !== 'none';
  f.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) document.getElementById('new-clan-name')?.focus();
}

function loadClansList() {
  const d = document.getElementById('clans-list');
  if (!d) return;

  db.ref('clans').once('value', snap => {
    const clans = snap.val();
    if (!clans) {
      d.innerHTML = '<div style="text-align:center;color:#666;padding:40px">⚔️<br>لا يوجد كلانات بعد</div>';
      return;
    }
    const ti = { open: '🔓', request: '📋', closed: '🔒' };
    const tn = { open: 'مفتوح', request: 'بطلب', closed: 'مغلق' };

    d.innerHTML = Object.entries(clans).map(([id, c]) => `
      <div style="background:#1a1a28;border-radius:10px;border:1px solid #2a2a3f;
        padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:14px;font-weight:bold">[ ${escapeHTML(c.name)} ]</div>
          <div style="font-size:11px;color:#888;margin-top:2px">
            👥 ${c.memberCount || 1} · ${ti[c.type] || '🔓'} ${tn[c.type] || 'مفتوح'}
          </div>
        </div>
        ${c.type === 'open'
          ? `<button onclick="joinClan('${id}','${escapeHTML(c.name)}')"
               style="background:#2ed573;color:black;border:none;border-radius:6px;
                 padding:7px 12px;font-size:12px;font-weight:bold;cursor:pointer">انضمام</button>`
          : c.type === 'request'
          ? `<button onclick="requestJoinClan('${id}','${escapeHTML(c.name)}')"
               style="background:#6c63ff;color:white;border:none;border-radius:6px;
                 padding:7px 12px;font-size:12px;font-weight:bold;cursor:pointer">طلب انضمام</button>`
          : '<span style="font-size:11px;color:#ff4757">🔒 مغلق</span>'}
      </div>`).join('');
  });
}

function createClan() {
  const user   = auth.currentUser; if (!user) return;
  const name   = (document.getElementById('new-clan-name')?.value || '').trim();
  const typeEl = document.querySelector('input[name="clan-type"]:checked');
  const type   = typeEl ? typeEl.value : 'open';

  if (name.length < 3 || name.length > 10) { alert('الاسم بين 3 و10 أحرف'); return; }

  db.ref('clans').orderByChild('name').equalTo(name).once('value', snap => {
    if (snap.exists()) { alert('هذا الاسم مأخوذ'); return; }
    const clanId = db.ref('clans').push().key;
    db.ref('clans/' + clanId).set({
      name, type, leader: user.uid, leaderName: currentUsername,
      memberCount: 1, createdAt: Date.now()
    });
    db.ref('clans/' + clanId + '/members/' + user.uid).set({
      username: currentUsername, role: 'leader', joinedAt: Date.now()
    });
    db.ref('users/' + user.uid).update({ clan: name, clanId }, () => {
      alert(`🎉 تم تأسيس كلان [ ${name} ]!`);
      renderClan();
    });
  });
}

function joinClan(clanId, clanName) {
  const user = auth.currentUser; if (!user) return;
  db.ref('clans/' + clanId + '/members/' + user.uid).set({
    username: currentUsername, role: 'member', joinedAt: Date.now()
  });
  db.ref('clans/' + clanId + '/memberCount').transaction(n => (n || 0) + 1);
  db.ref('users/' + user.uid).update({ clan: clanName, clanId }, () => {
    alert(`انضممت لـ [ ${clanName} ]!`);
    renderClan();
  });
}

function requestJoinClan(clanId, clanName) {
  const user = auth.currentUser; if (!user) return;
  db.ref('clans/' + clanId + '/requests/' + user.uid).once('value', snap => {
    if (snap.exists()) { alert('أرسلت طلباً بالفعل!'); return; }
    db.ref('clans/' + clanId + '/requests/' + user.uid).set({
      username: currentUsername, uid: user.uid, time: Date.now()
    }, () => alert(`تم إرسال طلب الانضمام لـ [ ${clanName} ]`));
  });
}

function leaveClan() {
  const user = auth.currentUser; if (!user || !currentClan) return;
  if (!confirm(`هل أنت متأكد من مغادرة [ ${currentClan} ]؟`)) return;

  db.ref('users/' + user.uid + '/clanId').once('value', snap => {
    const clanId = snap.val();
    if (clanId) {
      db.ref('clans/' + clanId + '/members/' + user.uid).remove();
      db.ref('clans/' + clanId + '/memberCount').transaction(n => Math.max(0, (n || 1) - 1));
    }
    if (clanChatListener) { clanChatListener.off(); clanChatListener = null; }
    db.ref('users/' + user.uid).update({ clan: '', clanId: '' }, () => {
      alert('غادرت الكلان.');
      renderClan();
    });
  });
}

function showClanSettings() {
  const panel = document.getElementById('clan-settings-panel'); if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (isOpen) return;

  const content = document.getElementById('clan-settings-content');
  content.innerHTML = '<div style="color:#aaa;font-size:12px">جاري التحميل...</div>';

  db.ref('users/' + auth.currentUser.uid + '/clanId').once('value', snap => {
    const clanId = snap.val(); if (!clanId) return;
    db.ref('clans/' + clanId).once('value', cSnap => {
      const clan = cSnap.val(); if (!clan) return;
      const isLeader = clan.leader === auth.currentUser.uid;
      const tl   = { open: '🔓 مفتوح', request: '📋 بطلب', closed: '🔒 مغلق' };
      const reqs = clan.requests ? Object.entries(clan.requests) : [];

      content.innerHTML = `
        ${isLeader ? `
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:#aaa;margin-bottom:6px">
              نوع القبول: <strong style="color:white">${tl[clan.type] || '🔓 مفتوح'}</strong>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${['open','request','closed'].map(t => `
                <button onclick="changeClanType('${clanId}','${t}')"
                  style="font-size:11px;padding:5px 10px;border-radius:6px;cursor:pointer;
                    border:1px solid #3a3a5f;
                    ${clan.type === t ? 'background:#6c63ff;color:white' : 'background:#1a1a28;color:#aaa'}">
                  ${tl[t]}
                </button>`).join('')}
            </div>
          </div>
          <hr style="border:none;border-top:1px solid #2a2a3f;margin:8px 0">` : ''}

        <div style="font-size:12px;color:#aaa;margin-bottom:6px">
          📋 طلبات الانضمام ${reqs.length ? `(${reqs.length})` : ''}
        </div>
        ${reqs.length
          ? reqs.map(([uid, r]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;
                padding:6px 0;border-bottom:1px solid #2a2a3f">
                <span style="font-size:12px">👤 ${escapeHTML(r.username)}</span>
                ${isLeader ? `
                  <div style="display:flex;gap:5px">
                    <button onclick="acceptRequest('${clanId}','${uid}','${escapeHTML(r.username)}')"
                      style="background:#2ed573;color:black;border:none;border-radius:4px;
                        font-size:11px;padding:3px 8px;cursor:pointer">قبول</button>
                    <button onclick="rejectRequest('${clanId}','${uid}')"
                      style="background:#ff4757;color:white;border:none;border-radius:4px;
                        font-size:11px;padding:3px 8px;cursor:pointer">رفض</button>
                  </div>` : ''}
              </div>`).join('')
          : '<div style="font-size:12px;color:#555">لا يوجد طلبات</div>'}`;
    });
  });
}

function acceptRequest(clanId, uid, username) {
  db.ref('clans/' + clanId + '/requests/' + uid).remove();
  db.ref('clans/' + clanId + '/members/' + uid).set({ username, role: 'member', joinedAt: Date.now() });
  db.ref('clans/' + clanId + '/memberCount').transaction(n => (n || 0) + 1);
  db.ref('clans/' + clanId + '/name').once('value', snap => {
    db.ref('users/' + uid).update({ clan: snap.val(), clanId }, () => {
      alert(`تم قبول ${username}!`);
      showClanSettings();
    });
  });
}

function rejectRequest(clanId, uid) {
  db.ref('clans/' + clanId + '/requests/' + uid).remove(() => {
    alert('تم رفض الطلب.');
    showClanSettings();
  });
}

function changeClanType(clanId, newType) {
  const labels = { open: 'مفتوح', request: 'بطلب', closed: 'مغلق' };
  db.ref('clans/' + clanId + '/type').set(newType, () => {
    alert(`تم التغيير إلى: ${labels[newType]}`);
    showClanSettings();
  });
}

// ===== شات الكلان =====
function listenToClanChat() {
  const chatBox = document.getElementById('clan-chat-messages');
  if (!chatBox || !currentClan) return;
  if (clanChatListener) { clanChatListener.off(); clanChatListener = null; chatBox.innerHTML = ''; }

  clanChatListener = db.ref('clan_chats/' + currentClan).limitToLast(30);
  clanChatListener.on('child_added', snap => {
    const msg = snap.val(); if (!msg) return;
    const isMine = auth.currentUser && msg.uid === auth.currentUser.uid;
    const color  = getAvatarColor(msg.sender || '؟');
    const letter = (msg.sender || '؟').charAt(0).toUpperCase();

    const avatar = `<div style="width:28px;height:28px;border-radius:50%;background:${color};
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:bold;color:white;flex-shrink:0">${letter}</div>`;

    const bubble = `<div style="background:${isMine ? '#2a4f2a' : '#1e1e2e'};
      color:${isMine ? '#2ed573' : '#e8e8f0'};
      border-radius:${isMine ? '12px 12px 0 12px' : '12px 12px 12px 0'};
      padding:8px 11px;max-width:75%;font-size:13px;word-break:break-word;border:1px solid #2a2a3f">
      <strong style="font-size:11px;color:${color}">${escapeHTML(msg.sender)}</strong><br>
      ${escapeHTML(msg.text)}
    </div>`;

    const wrap = document.createElement('div');
    wrap.style.cssText = `display:flex;align-items:flex-end;gap:7px;${isMine ? 'flex-direction:row-reverse' : ''}`;
    wrap.innerHTML = `${avatar}${bubble}`;
    chatBox.appendChild(wrap);
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

function sendClanMessage() {
  const input = document.getElementById('clan-chat-input');
  const user  = auth.currentUser;
  if (!user || !currentClan || !input) return;
  if (isMuted) { alert('أنت مكتوم!'); return; }

  const text = input.value.trim();
  if (!text) return;

  db.ref('clan_chats/' + currentClan).push({
    uid: user.uid, sender: currentUsername,
    title: currentTitle, titleColor: currentTitleColor,
    text, timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  input.value = '';
}

// ===== نقطة الأونلاين لأعضاء الكلان =====
function loadClanMembersOnline(clanId) {
  const container = document.getElementById('clan-members-online');
  if (!container) return;

  db.ref('clans/' + clanId + '/members').once('value', snap => {
    const members = snap.val(); if (!members) return;
    container.innerHTML = '<div style="font-size:11px;color:#aaa;margin-bottom:6px">👥 الأعضاء</div>';

    Object.entries(members).forEach(([uid, m]) => {
      db.ref('online/' + uid).once('value', onlineSnap => {
        const isOnline = onlineSnap.exists();
        const dot = isOnline
          ? `<span style="width:8px;height:8px;border-radius:50%;background:#2ed573;display:inline-block;box-shadow:0 0 4px #2ed573"></span>`
          : `<span style="width:8px;height:8px;border-radius:50%;background:#555;display:inline-block"></span>`;

        const div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #1a1a2e';
        div.innerHTML = `
          ${dot}
          <span style="font-size:12px;color:${isOnline ? '#f0e8d0' : '#888'};flex:1">${escapeHTML(m.username || 'عضو')}</span>
          <span style="font-size:10px;color:#555">${m.role === 'leader' ? '👑' : '⚔️'}</span>`;
        container.appendChild(div);
      });
    });
  });
}

// ============================================================
//  نظام الرتب — قائد 👑 | نائب ⚔️ | عضو 🛡️
// ============================================================

const CLAN_ROLES = {
  leader:  { label: 'قائد',  icon: '👑', rank: 3 },
  deputy:  { label: 'نائب',  icon: '⚔️', rank: 2 },
  member:  { label: 'عضو',   icon: '🛡️', rank: 1 }
};

// عرض قائمة الأعضاء مع الرتب وأدوات الإدارة
function showClanMembers() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';
  content.innerHTML = '<div style="color:#888;text-align:center;padding:20px">جاري التحميل...</div>';

  const user = auth.currentUser; if (!user) return;

  db.ref('users/' + user.uid + '/clanId').once('value', snap => {
    const clanId = snap.val(); if (!clanId) return;

    db.ref('clans/' + clanId).once('value', cSnap => {
      const clan = cSnap.val(); if (!clan) return;
      const myRole    = clan.members?.[user.uid]?.role || 'member';
      const myRank    = CLAN_ROLES[myRole]?.rank || 1;
      const isLeader  = myRole === 'leader';
      const isDeputy  = myRole === 'deputy';
      const canManage = isLeader || isDeputy;

      const members = clan.members ? Object.entries(clan.members) : [];
      members.sort((a, b) => (CLAN_ROLES[b[1].role]?.rank || 1) - (CLAN_ROLES[a[1].role]?.rank || 1));

      content.innerHTML = `
        <div style="text-align:right">
          <h3 style="margin:0 0 12px;color:#c8a940;font-size:15px">
            ⚔️ أعضاء [ ${escapeHTML(clan.name)} ]
            <span style="font-size:11px;color:#888;font-weight:400">(${members.length})</span>
          </h3>

          <div style="display:flex;flex-direction:column;gap:6px">
            ${members.map(([uid, m]) => {
              const role      = CLAN_ROLES[m.role] || CLAN_ROLES.member;
              const isMe      = uid === user.uid;
              const targetRank = CLAN_ROLES[m.role]?.rank || 1;
              const canEdit   = canManage && !isMe && myRank > targetRank;

              return `
                <div style="display:flex;align-items:center;gap:10px;padding:10px;
                  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
                  border-radius:12px;${isMe?'border-color:rgba(200,169,64,0.3)':''}">

                  <div style="width:36px;height:36px;border-radius:50%;
                    background:${getAvatarColor(m.username||'?')};
                    display:flex;align-items:center;justify-content:center;
                    font-size:15px;font-weight:900;color:white;flex-shrink:0">
                    ${(m.username||'?').charAt(0).toUpperCase()}
                  </div>

                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:700;color:#f0e8d0">
                      ${escapeHTML(m.username||'عضو')}
                      ${isMe ? '<span style="font-size:9px;color:#c8a940">(أنت)</span>' : ''}
                    </div>
                    <div style="font-size:11px;color:#888;margin-top:1px">
                      ${role.icon} ${role.label}
                    </div>
                  </div>

                  ${canEdit ? `
                    <div style="display:flex;gap:4px;flex-shrink:0">
                      ${isLeader && m.role === 'member' ? `
                        <button onclick="changeMemberRole('${clanId}','${uid}','deputy')"
                          style="background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);
                            border-radius:6px;font-size:9px;padding:4px 8px;cursor:pointer;font-family:inherit">
                          ترقية ⚔️
                        </button>` : ''}
                      ${isLeader && m.role === 'deputy' ? `
                        <button onclick="changeMemberRole('${clanId}','${uid}','member')"
                          style="background:rgba(168,85,247,0.15);color:#a78bfa;border:1px solid rgba(168,85,247,0.3);
                            border-radius:6px;font-size:9px;padding:4px 8px;cursor:pointer;font-family:inherit">
                          تخفيض 🛡️
                        </button>` : ''}
                      <button onclick="kickMember('${clanId}','${uid}','${escapeHTML(m.username||'')}')"
                        style="background:rgba(255,71,87,0.15);color:#ff4757;border:1px solid rgba(255,71,87,0.3);
                          border-radius:6px;font-size:9px;padding:4px 8px;cursor:pointer;font-family:inherit">
                        طرد
                      </button>
                    </div>` : ''}
                </div>`;
            }).join('')}
          </div>

          ${isLeader ? `
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.07)">
              <div style="font-size:11px;color:#888;margin-bottom:8px">⚠️ منطقة الخطر</div>
              <button onclick="confirmDisbandClan('${clanId}')"
                style="width:100%;padding:10px;background:rgba(255,71,87,0.1);color:#ff4757;
                  border:1px solid rgba(255,71,87,0.3);border-radius:10px;font-size:12px;
                  cursor:pointer;font-weight:700;font-family:inherit">
                🗑️ حل الكلان نهائياً
              </button>
            </div>` : ''}
        </div>`;
    });
  });
}

function changeMemberRole(clanId, uid, newRole) {
  const label = CLAN_ROLES[newRole]?.label || newRole;
  if (!confirm(`تغيير رتبة اللاعب إلى ${label}؟`)) return;

  db.ref('clans/' + clanId + '/members/' + uid + '/role').set(newRole, err => {
    if (!err) {
      if (typeof showToast === 'function') showToast(`✅ تم التغيير إلى ${label}`);
      showClanMembers();
    }
  });
}

function kickMember(clanId, uid, username) {
  if (!confirm(`طرد ${username} من الكلان؟`)) return;

  db.ref('clans/' + clanId + '/members/' + uid).remove();
  db.ref('clans/' + clanId + '/memberCount').transaction(n => Math.max(0, (n || 1) - 1));
  db.ref('users/' + uid).update({ clan: '', clanId: '' }, () => {
    if (typeof showToast === 'function') showToast(`تم طرد ${username}`);
    showClanMembers();
  });
}

function confirmDisbandClan(clanId) {
  if (!confirm('هل أنت متأكد؟ سيتم حل الكلان وطرد جميع الأعضاء نهائياً!')) return;
  if (!confirm('هذا الإجراء لا يمكن التراجع عنه. تأكيد نهائي؟')) return;

  db.ref('clans/' + clanId + '/members').once('value', snap => {
    const members = snap.val() || {};
    const updates = {};

    Object.keys(members).forEach(uid => {
      updates[`users/${uid}/clan`]   = '';
      updates[`users/${uid}/clanId`] = '';
    });

    db.ref().update(updates).then(() => {
      db.ref('clans/' + clanId).remove();
      if (clanChatListener) { clanChatListener.off(); clanChatListener = null; }
      if (typeof showToast === 'function') showToast('تم حل الكلان');
      document.getElementById('profile-modal').style.display = 'none';
      renderClan();
    });
  });
}