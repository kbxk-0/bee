// ============================================================
//  js/clan.js — bee platform
//  نظام النوادي — مبني على نظام جواكر:
//  3 أنواع نوادي (مفتوح/خاص/مغلق) + مشرفين داخليين بصلاحيات
//  محددة + مستويات نادي تتحكم بعدد الأعضاء + صورة نادي
//
//  ملاحظة: أرقام المستويات/الحد الأقصى للأعضاء تصميم معقول مني
//  (جواكر ما تنشر أرقامها الدقيقة علناً) — سهل تتعدل لاحقاً.
// ============================================================

const CLUB_TYPES = {
  open:    { label: 'مفتوح', icon: '🔓', desc: 'ينضم أي لاعب فوراً بدون موافقة' },
  private: { label: 'خاص',   icon: '🔒', desc: 'الانضمام بدعوة من المالك أو مشرف مخوّل فقط' },
  closed:  { label: 'مغلق',  icon: '📋', desc: 'الانضمام بطلب، يوافق عليه المالك أو مشرف مخوّل' },
};

const CLUB_LEVELS = [
  { level: 1, maxMembers: 20,  xpNeeded: 0      },
  { level: 2, maxMembers: 35,  xpNeeded: 5000   },
  { level: 3, maxMembers: 50,  xpNeeded: 15000  },
  { level: 4, maxMembers: 75,  xpNeeded: 35000  },
  { level: 5, maxMembers: 100, xpNeeded: 70000  },
];

function getClubLevelInfo(totalXp) {
  let info = CLUB_LEVELS[0];
  for (const l of CLUB_LEVELS) if ((totalXp || 0) >= l.xpNeeded) info = l;
  const next = CLUB_LEVELS.find(l => l.level === info.level + 1) || null;
  return { ...info, next };
}

function normalizeClubName(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// تهريب مخصص لإدراج نص داخل onclick="...('نص')" — مختلف عن escapeHTML()
// (اللي يهرّب للعرض بالصفحة، مو للحقن جوا سلسلة جافاسكربت). كان استخدام
// escapeHTML() هنا بالغلط يكسر الزر بصمت لأي اسم نادي.
function jsAttrEscape(str) {
  return String(str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ── صلاحياتي بهذا النادي (مالك = كل الصلاحيات، مشرف = حسب اللي منحه المالك) ──
function getMyClubPerms(clan, uid) {
  const role = clan.members?.[uid]?.role;
  if (role === 'owner') return { notify: true, createGames: true, acceptMembers: true, kickMembers: true, isOwner: true, isMod: false };
  if (role === 'moderator') {
    const p = (clan.modPerms && clan.modPerms[uid]) || {};
    return { notify: !!p.notify, createGames: !!p.createGames, acceptMembers: !!p.acceptMembers, kickMembers: !!p.kickMembers, isOwner: false, isMod: true };
  }
  return { notify: false, createGames: false, acceptMembers: false, kickMembers: false, isOwner: false, isMod: false };
}

// ============================================================
//  رسم صفحة النوادي — "من جوا" (ناديك) أو "من برا" (تصفّح)
// ============================================================
function renderClan() {
  const sec = document.getElementById('clan');
  if (!sec) return;

  if (currentClanId) renderMyClubHome(sec);
  else renderClubsBrowser(sec);
}

// ── من جوا: صفحة ناديك ──
function renderMyClubHome(sec) {
  const user = auth.currentUser;
  sec.innerHTML = `<div style="text-align:center;color:#705030;padding:60px">جاري التحميل...</div>`;
  if (!user) return;

  db.ref('clans/' + currentClanId).once('value', snap => {
    const clan = snap.val();
    if (!clan) { currentClanId = ''; currentClan = ''; renderClan(); return; }

    const lvl   = getClubLevelInfo(clan.totalXp || 0);
    const type  = CLUB_TYPES[clan.type] || CLUB_TYPES.open;
    const perms = getMyClubPerms(clan, user.uid);
    const photo = clan.photoURL
      ? `<img src="${clan.photoURL}" style="width:100%;height:100%;object-fit:cover">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:34px">🛡️</div>`;

    const xpProgress = lvl.next ? Math.min(100, Math.round(((clan.totalXp||0) - lvl.xpNeeded) / (lvl.next.xpNeeded - lvl.xpNeeded) * 100)) : 100;

    sec.innerHTML = `
      <div style="padding:12px;color:white;display:flex;flex-direction:column;
        gap:10px;height:calc(100vh - 70px);overflow:hidden">

        <div style="background:rgba(14,11,4,0.85);border:1px solid rgba(200,169,64,0.3);
          border-radius:16px;padding:12px;flex-shrink:0">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
            <div style="width:54px;height:54px;border-radius:14px;overflow:hidden;flex-shrink:0;
              background:rgba(200,169,64,0.1);border:1px solid rgba(200,169,64,0.3)">${photo}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:16px;font-weight:900;color:#f0c040;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                [ ${escapeHTML(clan.name)} ]
              </div>
              <div style="font-size:11px;color:#888;margin-top:2px">
                ${type.icon} ${type.label} · 👥 ${clan.memberCount||1}/${lvl.maxMembers} · ⭐ مستوى ${lvl.level}
              </div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:6px;overflow:hidden">
            <div style="height:100%;width:${xpProgress}%;background:linear-gradient(90deg,#c8a940,#f0c040);border-radius:10px"></div>
          </div>
          <div style="font-size:9px;color:#705030;margin-top:4px">
            ${lvl.next ? `${(clan.totalXp||0).toLocaleString('ar')} / ${lvl.next.xpNeeded.toLocaleString('ar')} XP للمستوى ${lvl.next.level}` : 'وصل النادي لأعلى مستوى 🏆'}
          </div>
        </div>

        <div style="display:flex;gap:6px;flex-shrink:0">
          <button onclick="showClanMembers()" style="${clubBtnStyle('#f0c040')}">👥 الأعضاء</button>
          ${perms.createGames ? `<button onclick="startClubGameSession('${currentClanId}')" style="${clubBtnStyle('#2ed573')}">🃏 ابدأ جلسة</button>` : ''}
          ${(perms.isOwner) ? `<button onclick="showClanSettings()" style="${clubBtnStyle('#a78bfa')}">⚙️ إعدادات</button>` : ''}
          <button onclick="leaveClan()" style="${clubBtnStyle('#ff4757')}">مغادرة</button>
        </div>

        <div id="clan-settings-panel"
          style="display:none;background:rgba(14,11,4,0.85);border-radius:14px;
            border:1px solid rgba(168,85,247,0.4);padding:12px;flex-shrink:0;max-height:50vh;overflow-y:auto">
          <div id="clan-settings-content">جاري التحميل...</div>
        </div>

        <div style="flex:1;background:rgba(14,11,4,0.85);border-radius:14px;
          border:1px solid rgba(200,169,64,0.25);display:flex;flex-direction:column;min-height:0">
          <div style="background:linear-gradient(135deg,#a87e10,#f0c040);color:#1a0800;padding:9px 12px;font-weight:900;
            font-size:13px;border-radius:14px 14px 0 0;flex-shrink:0">
            💬 شات النادي
          </div>
          <div id="clan-chat-messages"
            style="flex:1;padding:10px;overflow-y:auto;display:flex;flex-direction:column;gap:5px">
          </div>
          <div style="padding:8px;border-top:1px solid rgba(255,255,255,0.07);display:flex;gap:6px;flex-shrink:0">
            <input type="text" id="clan-chat-input" placeholder="رسالة للنادي..."
              class="input-field" style="flex:1"
              onkeydown="if(event.key==='Enter') sendClanMessage()">
            ${perms.notify ? `<button onclick="openClanAnnouncementBox()" title="إعلان" style="padding:0 12px;background:rgba(168,85,247,0.2);color:#a78bfa;border:1px solid rgba(168,85,247,0.4);border-radius:8px;font-size:14px;cursor:pointer">📢</button>` : ''}
            <button onclick="sendClanMessage()"
              style="padding:0 14px;background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0800;
                border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:900">➤</button>
          </div>
        </div>
      </div>`;
    listenToClanChat();
  });
}

function clubBtnStyle(color) {
  return `flex:1;background:rgba(255,255,255,0.05);color:${color};border:1px solid ${color}55;
    border-radius:10px;font-size:11px;font-weight:700;padding:9px 4px;cursor:pointer;font-family:inherit`;
}

// ── من برا: تصفّح وإنشاء نادي ──
function renderClubsBrowser(sec) {
  sec.innerHTML = `
    <div style="padding:14px;color:white;height:calc(100vh - 70px);overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h2 style="margin:0;font-size:18px;color:#f0c040">🛡️ النوادي</h2>
        <button onclick="toggleCreateForm()"
          style="background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0800;border:none;border-radius:10px;
            padding:8px 14px;font-size:12px;font-weight:900;cursor:pointer">
          + إنشاء نادي
        </button>
      </div>

      <div id="create-clan-form"
        style="display:none;background:rgba(14,11,4,0.85);border-radius:14px;
          border:1px solid rgba(200,169,64,0.3);padding:14px;margin-bottom:14px">
        <h4 style="margin:0 0 10px;color:#f0c040;font-size:14px">إنشاء نادي جديد</h4>
        <input type="text" id="new-clan-name" placeholder="اسم النادي (3-20 حرف)..."
          class="input-field" style="margin-bottom:6px;width:100%;box-sizing:border-box">
        <div id="clan-name-status" style="font-size:10px;color:#555;margin-bottom:10px;min-height:14px"></div>
        <div style="font-size:12px;color:#aaa;margin-bottom:8px">نوع الانضمام:</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
          ${Object.entries(CLUB_TYPES).map(([key, t]) => `
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:white">
              <input type="radio" name="clan-type" value="${key}" ${key==='open'?'checked':''}>
              ${t.icon} ${t.label} — ${t.desc}
            </label>`).join('')}
        </div>
        <button onclick="createClan()"
          style="width:100%;padding:10px;background:linear-gradient(135deg,#c8a940,#f0c040);color:#1a0800;
            border:none;border-radius:10px;font-weight:900;font-size:13px;cursor:pointer">
          تأسيس النادي 🛡️
        </button>
      </div>

      <input type="text" id="clan-search-input" placeholder="🔍 ابحث عن نادي..."
        class="input-field" style="width:100%;box-sizing:border-box;margin-bottom:12px"
        oninput="searchClansList(this.value)">

      <div id="clans-list">
        <div style="text-align:center;color:#666;padding:30px">جاري التحميل...</div>
      </div>
    </div>`;
  loadClansList();
}

function toggleCreateForm() {
  const f = document.getElementById('create-clan-form');
  if (!f) return;
  const isOpen = f.style.display !== 'none';
  f.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) document.getElementById('new-clan-name')?.focus();
}

let _allClansCache = [];

function loadClansList() {
  const d = document.getElementById('clans-list');
  if (!d) return;

  db.ref('clans').once('value', snap => {
    const clans = snap.val();
    _allClansCache = clans ? Object.entries(clans).map(([id, c]) => ({ id, ...c })) : [];
    renderClansListItems(_allClansCache);
  });
}

function searchClansList(query) {
  const q = normalizeClubName(query || '');
  const filtered = q ? _allClansCache.filter(c => normalizeClubName(c.name).includes(q)) : _allClansCache;
  renderClansListItems(filtered);
}

function renderClansListItems(clans) {
  const d = document.getElementById('clans-list');
  if (!d) return;

  if (!clans.length) {
    d.innerHTML = '<div style="text-align:center;color:#666;padding:40px">🛡️<br>لا توجد نوادي</div>';
    return;
  }

  d.innerHTML = clans.map(c => {
    const type  = CLUB_TYPES[c.type] || CLUB_TYPES.open;
    const lvl   = getClubLevelInfo(c.totalXp || 0);
    const photo = c.photoURL
      ? `<img src="${c.photoURL}" style="width:100%;height:100%;object-fit:cover">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px">🛡️</div>`;
    const full  = (c.memberCount || 1) >= lvl.maxMembers;

    return `
      <div style="background:rgba(14,11,4,0.7);border-radius:12px;border:1px solid rgba(200,169,64,0.18);
        padding:11px;margin-bottom:8px;display:flex;align-items:center;gap:10px">
        <div style="width:42px;height:42px;border-radius:11px;overflow:hidden;flex-shrink:0;
          background:rgba(200,169,64,0.1);border:1px solid rgba(200,169,64,0.25)">${photo}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:800;color:#f0e8d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            [ ${escapeHTML(c.name)} ]
          </div>
          <div style="font-size:10px;color:#888;margin-top:2px">
            👥 ${c.memberCount||1}/${lvl.maxMembers} · ${type.icon} ${type.label} · ⭐ ${lvl.level}
          </div>
        </div>
        ${full ? '<span style="font-size:10px;color:#ff4757;font-weight:700;flex-shrink:0">مكتمل</span>'
          : c.type === 'open'
          ? `<button onclick="joinClan('${c.id}','${jsAttrEscape(c.name)}')" style="${clubJoinBtn('#2ed573','black')}">انضمام</button>`
          : c.type === 'closed'
          ? `<button onclick="requestJoinClan('${c.id}','${jsAttrEscape(c.name)}')" style="${clubJoinBtn('#6c63ff','white')}">طلب انضمام</button>`
          : '<span style="font-size:10px;color:#ff4757;flex-shrink:0">🔒 خاص</span>'}
      </div>`;
  }).join('');
}

function clubJoinBtn(bg, color) {
  return `background:${bg};color:${color};border:none;border-radius:8px;
    padding:7px 12px;font-size:11px;font-weight:900;cursor:pointer;flex-shrink:0;font-family:inherit`;
}

// ============================================================
//  إنشاء نادي — مع منع التكرار (حتى لو نفس الاسم بأحرف مختلفة/مسافات)
// ============================================================
function createClan() {
  const user   = auth.currentUser; if (!user) return;
  const name   = (document.getElementById('new-clan-name')?.value || '').trim();
  const typeEl = document.querySelector('input[name="clan-type"]:checked');
  const type   = typeEl ? typeEl.value : 'open';

  if (name.length < 3 || name.length > 20) { Toast.show('اسم النادي بين 3 و20 حرفاً', 'error'); return; }

  const nameKey = normalizeClubName(name);
  db.ref('clanNamesLower/' + encodeURIComponent(nameKey)).once('value', snap => {
    if (snap.exists()) { Toast.show('هذا الاسم مأخوذ بالفعل', 'error'); return; }

    const clanId = db.ref('clans').push().key;
    const updates = {};
    updates['clans/' + clanId] = {
      name, type, ownerId: user.uid, ownerName: currentUsername,
      photoURL: null, totalXp: 0, createdAt: Date.now(), memberCount: 1,
      members: { [user.uid]: { username: currentUsername, role: 'owner', joinedAt: Date.now() } },
    };
    updates['clanNamesLower/' + encodeURIComponent(nameKey)] = clanId;
    updates['users/' + user.uid + '/clan']   = name;
    updates['users/' + user.uid + '/clanId'] = clanId;

    db.ref().update(updates, err => {
      if (err) { Toast.show('حدث خطأ، حاول مرة أخرى', 'error'); return; }
      currentClan = name; currentClanId = clanId;
      Toast.show(`🎉 تم تأسيس نادي [ ${name} ]!`, 'gold');
      Sounds.play('success'); Haptic.success();
      renderClan();
    });
  });
}

// ============================================================
//  الانضمام / طلب الانضمام / المغادرة
// ============================================================
function joinClan(clanId, clanName) {
  const user = auth.currentUser; if (!user) return;
  if (currentClanId) { Toast.show('أنت بالفعل عضو بنادٍ، غادره أولاً', 'error'); return; }

  db.ref('clans/' + clanId).once('value', snap => {
    const clan = snap.val(); if (!clan) return;
    const lvl = getClubLevelInfo(clan.totalXp || 0);
    if ((clan.memberCount || 1) >= lvl.maxMembers) { Toast.show('النادي مكتمل العدد!', 'error'); return; }

    const updates = {};
    updates['clans/' + clanId + '/members/' + user.uid] = { username: currentUsername, role: 'member', joinedAt: Date.now() };
    updates['users/' + user.uid + '/clan']   = clanName;
    updates['users/' + user.uid + '/clanId'] = clanId;
    db.ref().update(updates, err => {
      if (err) return;
      db.ref('clans/' + clanId + '/memberCount').transaction(n => (n || 1) + 1);
      currentClan = clanName; currentClanId = clanId;
      Toast.show(`انضممت لـ [ ${clanName} ]!`, 'success'); Sounds.play('success'); Haptic.success();
      renderClan();
    });
  });
}

function requestJoinClan(clanId, clanName) {
  const user = auth.currentUser; if (!user) return;
  if (currentClanId) { Toast.show('أنت بالفعل عضو بنادٍ، غادره أولاً', 'error'); return; }

  db.ref('clans/' + clanId + '/pendingRequests/' + user.uid).once('value', snap => {
    if (snap.exists()) { Toast.show('أرسلت طلباً بالفعل!', 'error'); return; }
    db.ref('clans/' + clanId + '/pendingRequests/' + user.uid).set(
      { username: currentUsername, requestedAt: Date.now() },
      () => Toast.show(`تم إرسال طلب الانضمام لـ [ ${clanName} ]`, 'success')
    );
  });
}

function leaveClan() {
  const user = auth.currentUser; if (!user || !currentClanId) return;

  db.ref('clans/' + currentClanId + '/members/' + user.uid + '/role').once('value', snap => {
    if (snap.val() === 'owner') {
      Toast.show('أنت مالك النادي — حلّ النادي أو حوّل الملكية أولاً من الأعضاء', 'error');
      return;
    }
    const updates = {};
    updates['clans/' + currentClanId + '/members/' + user.uid] = null;
    updates['clans/' + currentClanId + '/modPerms/' + user.uid] = null;
    updates['users/' + user.uid + '/clan']   = '';
    updates['users/' + user.uid + '/clanId'] = '';
    db.ref().update(updates, () => {
      db.ref('clans/' + currentClanId + '/memberCount').transaction(n => Math.max(0, (n || 1) - 1));
      currentClan = ''; currentClanId = '';
      Toast.show('غادرت النادي.', 'info'); Sounds.play('click');
      renderClan();
    });
  });
}

// ============================================================
//  إعدادات النادي — صورة، نوع، مشرفين وصلاحياتهم (مالك فقط)
// ============================================================
function showClanSettings() {
  const panel   = document.getElementById('clan-settings-panel');
  const content = document.getElementById('clan-settings-content');
  if (!panel || !content) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (isOpen) return;

  const user = auth.currentUser; if (!user) return;

  db.ref('clans/' + currentClanId).once('value', snap => {
    const clan = snap.val(); if (!clan) return;
    const lvl = getClubLevelInfo(clan.totalXp || 0);
    const canChangePhoto = lvl.level >= 2;
    const members = clan.members ? Object.entries(clan.members) : [];
    const others  = members.filter(([uid]) => uid !== user.uid);

    content.innerHTML = `
      <div style="text-align:right">
        <div style="font-size:12px;color:#a78bfa;font-weight:800;margin-bottom:10px">⚙️ إعدادات النادي</div>

        <div style="margin-bottom:12px">
          <div style="font-size:11px;color:#888;margin-bottom:6px">
            🖼️ صورة النادي ${!canChangePhoto ? '<span style="color:#ff4757">(يتطلب مستوى 2)</span>' : ''}
          </div>
          ${canChangePhoto ? `
            <input type="file" id="clan-photo-input" accept="image/*" style="display:none" onchange="handleClanPhotoUpload(this)">
            <button onclick="document.getElementById('clan-photo-input').click()"
              style="padding:7px 14px;background:rgba(200,169,64,0.12);color:#f0c040;
                border:1px solid rgba(200,169,64,0.3);border-radius:8px;font-size:11px;cursor:pointer;font-family:inherit">
              📷 تغيير الصورة
            </button>
            <span id="clan-photo-status" style="font-size:10px;color:#888;margin-right:6px"></span>
          ` : ''}
        </div>

        <div style="margin-bottom:12px">
          <div style="font-size:11px;color:#888;margin-bottom:6px">نوع النادي</div>
          <div style="display:flex;gap:6px">
            ${Object.entries(CLUB_TYPES).map(([key, t]) => `
              <button onclick="changeClanType('${currentClanId}','${key}')"
                style="flex:1;padding:7px 4px;border-radius:8px;font-size:10px;cursor:pointer;font-family:inherit;
                  background:${clan.type===key?'rgba(200,169,64,0.2)':'rgba(255,255,255,0.05)'};
                  color:${clan.type===key?'#f0c040':'#888'};
                  border:1px solid ${clan.type===key?'rgba(200,169,64,0.4)':'rgba(255,255,255,0.1)'}">
                ${t.icon} ${t.label}
              </button>`).join('')}
          </div>
        </div>

        ${(clan.pendingRequests && Object.keys(clan.pendingRequests).length) ? `
          <div style="margin-bottom:12px">
            <div style="font-size:11px;color:#888;margin-bottom:6px">طلبات الانضمام (${Object.keys(clan.pendingRequests).length})</div>
            ${Object.entries(clan.pendingRequests).map(([uid, r]) => `
              <div style="display:flex;align-items:center;gap:8px;padding:7px;background:rgba(255,255,255,0.04);
                border-radius:8px;margin-bottom:5px">
                <span style="flex:1;font-size:12px;color:#f0e8d0">${escapeHTML(r.username||'لاعب')}</span>
                <button onclick="acceptRequest('${currentClanId}','${uid}','${jsAttrEscape(r.username||'')}')"
                  style="background:#2ed573;color:black;border:none;border-radius:6px;font-size:10px;padding:5px 9px;cursor:pointer;font-family:inherit">قبول</button>
                <button onclick="rejectRequest('${currentClanId}','${uid}')"
                  style="background:#ff4757;color:white;border:none;border-radius:6px;font-size:10px;padding:5px 9px;cursor:pointer;font-family:inherit">رفض</button>
              </div>`).join('')}
          </div>` : ''}

        <div>
          <div style="font-size:11px;color:#888;margin-bottom:6px">المشرفون وصلاحياتهم</div>
          ${others.map(([uid, m]) => {
            const isMod = m.role === 'moderator';
            const p = (clan.modPerms && clan.modPerms[uid]) || {};
            return `
              <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:9px;margin-bottom:6px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:${isMod?'6px':'0'}">
                  <span style="flex:1;font-size:12px;color:#f0e8d0">${escapeHTML(m.username||'عضو')}</span>
                  ${!isMod
                    ? `<button onclick="promoteToModerator('${currentClanId}','${uid}')" style="background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);border-radius:6px;font-size:9px;padding:4px 8px;cursor:pointer;font-family:inherit">ترقية لمشرف 🛡️</button>`
                    : `<button onclick="demoteModerator('${currentClanId}','${uid}')" style="background:rgba(168,85,247,0.15);color:#a78bfa;border:1px solid rgba(168,85,247,0.3);border-radius:6px;font-size:9px;padding:4px 8px;cursor:pointer;font-family:inherit">تخفيض</button>`}
                </div>
                ${isMod ? `
                  <div style="display:flex;flex-wrap:wrap;gap:4px">
                    ${[['notify','📢 إشعارات'],['createGames','🃏 جلسات'],['acceptMembers','✅ قبول أعضاء'],['kickMembers','🚫 طرد أعضاء']].map(([perm,label]) => `
                      <button onclick="toggleModPerm('${currentClanId}','${uid}','${perm}',${!p[perm]})"
                        style="font-size:9px;padding:4px 7px;border-radius:6px;cursor:pointer;font-family:inherit;
                          background:${p[perm]?'rgba(46,213,115,0.15)':'rgba(255,255,255,0.04)'};
                          color:${p[perm]?'#2ed573':'#666'};
                          border:1px solid ${p[perm]?'rgba(46,213,115,0.3)':'rgba(255,255,255,0.08)'}">
                        ${label} ${p[perm]?'✓':''}
                      </button>`).join('')}
                  </div>` : ''}
              </div>`;
          }).join('') || '<div style="font-size:11px;color:#555;text-align:center;padding:8px">لا يوجد أعضاء آخرين بعد</div>'}
        </div>

        <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.07)">
          <button onclick="confirmDisbandClan('${currentClanId}')"
            style="width:100%;padding:9px;background:rgba(255,71,87,0.1);color:#ff4757;
              border:1px solid rgba(255,71,87,0.3);border-radius:10px;font-size:11px;
              cursor:pointer;font-weight:700;font-family:inherit">
            🗑️ حل النادي نهائياً
          </button>
        </div>
      </div>`;
  });
}

// صورة النادي — نفس نمط رفع صورة البروفايل (ضغط + رفع لـ Storage)، مالك فقط + مستوى 2+
function handleClanPhotoUpload(input) {
  const file = input.files[0];
  if (!file || !file.type.startsWith('image/')) { Toast.show('يرجى اختيار صورة', 'error'); return; }
  const status = document.getElementById('clan-photo-status');
  if (status) status.textContent = '⏳ جاري الرفع...';

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 240; canvas.height = 240;
      const ctx = canvas.getContext('2d');
      const size = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width-size)/2, (img.height-size)/2, size, size, 0, 0, 240, 240);
      canvas.toBlob(blob => {
        firebase.storage().ref('clubs/' + currentClanId + '.jpg').put(blob, { contentType: 'image/jpeg' })
          .then(s => s.ref.getDownloadURL())
          .then(url => {
            db.ref('clans/' + currentClanId + '/photoURL').set(url, () => {
              if (status) status.textContent = '✅ تم';
              Toast.show('تم تحديث صورة النادي', 'success');
              renderClan();
            });
          })
          .catch(() => { if (status) status.textContent = '❌ فشل الرفع'; });
      }, 'image/jpeg', 0.8);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function changeClanType(clanId, newType) {
  db.ref('clans/' + clanId + '/type').set(newType, err => {
    if (!err) { Toast.show(`تم التغيير إلى: ${CLUB_TYPES[newType].label}`, 'success'); showClanSettings(); showClanSettings(); renderClan(); }
  });
}

function acceptRequest(clanId, uid, username) {
  db.ref('clans/' + clanId).once('value', snap => {
    const clan = snap.val(); if (!clan) return;
    const lvl = getClubLevelInfo(clan.totalXp || 0);
    if ((clan.memberCount||1) >= lvl.maxMembers) { Toast.show('النادي مكتمل العدد!', 'error'); return; }

    const updates = {};
    updates['clans/' + clanId + '/members/' + uid] = { username, role: 'member', joinedAt: Date.now() };
    updates['clans/' + clanId + '/pendingRequests/' + uid] = null;
    updates['users/' + uid + '/clan']   = clan.name;
    updates['users/' + uid + '/clanId'] = clanId;
    db.ref().update(updates, () => {
      db.ref('clans/' + clanId + '/memberCount').transaction(n => (n||1)+1);
      if (typeof sendNotification === 'function') sendNotification(uid, 'system', '🛡️ تم قبولك بالنادي', `أنت الآن عضو في [ ${clan.name} ]`);
      Toast.show(`تم قبول ${username}!`, 'success');
      showClanSettings(); showClanSettings();
    });
  });
}

function rejectRequest(clanId, uid) {
  db.ref('clans/' + clanId + '/pendingRequests/' + uid).remove(() => {
    Toast.show('تم رفض الطلب.', 'info');
    showClanSettings(); showClanSettings();
  });
}

function promoteToModerator(clanId, uid) {
  db.ref('clans/' + clanId + '/members/' + uid + '/role').set('moderator', () => {
    Toast.show('تمت الترقية لمشرف 🛡️', 'success');
    showClanSettings(); showClanSettings();
  });
}

function demoteModerator(clanId, uid) {
  const updates = {};
  updates['clans/' + clanId + '/members/' + uid + '/role'] = 'member';
  updates['clans/' + clanId + '/modPerms/' + uid] = null;
  db.ref().update(updates, () => {
    Toast.show('تم تخفيض الرتبة', 'info');
    showClanSettings(); showClanSettings();
  });
}

function toggleModPerm(clanId, uid, perm, value) {
  db.ref('clans/' + clanId + '/modPerms/' + uid + '/' + perm).set(value, () => {
    showClanSettings(); showClanSettings();
  });
}

// ============================================================
//  شات النادي + الإعلانات (صلاحية notify)
// ============================================================
function listenToClanChat() {
  if (clanChatListener) { clanChatListener.off(); clanChatListener = null; }
  if (!currentClanId) return;

  const box = document.getElementById('clan-chat-messages');
  clanChatListener = db.ref('clan_chat/' + currentClanId).limitToLast(50);
  clanChatListener.on('child_added', snap => {
    const msg = snap.val(); if (!msg || !box) return;
    const isAnnounce = msg.type === 'announcement';
    const bubble = document.createElement('div');
    if (isAnnounce) {
      bubble.style.cssText = 'background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.35);border-radius:10px;padding:8px 10px;font-size:12px;color:#d8c8ff';
      bubble.innerHTML = `<b>📢 ${escapeHTML(msg.sender||'')}:</b> ${escapeHTML(msg.text||'')}`;
    } else {
      bubble.style.cssText = 'background:rgba(255,255,255,0.05);border-radius:10px;padding:7px 10px;font-size:12px;color:#f0e8d0';
      bubble.innerHTML = `<b style="color:#f0c040">${escapeHTML(msg.sender||'')}:</b> ${escapeHTML(msg.text||'')}`;
    }
    box.appendChild(bubble);
    box.scrollTop = box.scrollHeight;
  });
}

function sendClanMessage() {
  const input = document.getElementById('clan-chat-input');
  const user  = auth.currentUser;
  if (!user || !input || !currentClanId) return;
  const text = input.value.trim(); if (!text) return;
  input.value = '';
  db.ref('clan_chat/' + currentClanId).push({ sender: currentUsername, text, timestamp: firebase.database.ServerValue.TIMESTAMP });
}

function openClanAnnouncementBox() {
  const text = prompt('نص الإعلان لكل أعضاء النادي:');
  if (!text || !text.trim()) return;
  db.ref('clan_chat/' + currentClanId).push({
    sender: currentUsername, text: text.trim(), type: 'announcement',
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
}

// زر "ابدأ جلسة" — يفتح مليون عادي وينادي بإعلان بالشات (مو تكامل غرف عميق، بس دعوة فعلية)
function startClubGameSession(clanId) {
  db.ref('clan_chat/' + clanId).push({
    sender: currentUsername, text: '🃏 ابدأ جلسة مليون، انضموا!', type: 'announcement',
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  if (typeof showFriendlyGamePopup === 'function') showFriendlyGamePopup('million');
}

// ============================================================
//  إضافة خبرة للنادي (تُستدعى من أي مكان، مثل بعد فوز بمليون)
// ============================================================
function addClubXP(amount) {
  if (!currentClanId || !amount) return;
  db.ref('clans/' + currentClanId + '/totalXp').transaction(xp => (xp || 0) + amount);
}

// ============================================================
//  قائمة الأعضاء — مع شارات الرتب وحالة الأونلاين وصلاحيات الإدارة
// ============================================================
function showClanMembers() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  resetModalStack();
  modal.style.display = 'flex';
  content.innerHTML = '<div style="color:#888;text-align:center;padding:20px">جاري التحميل...</div>';

  const user = auth.currentUser; if (!user || !currentClanId) return;

  db.ref('clans/' + currentClanId).once('value', cSnap => {
    const clan = cSnap.val(); if (!clan) return;
    const perms   = getMyClubPerms(clan, user.uid);
    const members = clan.members ? Object.entries(clan.members) : [];
    const roleRank = { owner: 3, moderator: 2, member: 1 };
    members.sort((a, b) => (roleRank[b[1].role]||1) - (roleRank[a[1].role]||1));

    const roleBadge = { owner: ['👑','المالك','#f0c040'], moderator: ['🛡️','مشرف','#a78bfa'], member: ['','عضو','#888'] };

    content.innerHTML = `
      <div style="text-align:right">
        <h3 style="margin:0 0 12px;color:#f0c040;font-size:15px">
          🛡️ أعضاء [ ${escapeHTML(clan.name)} ]
          <span style="font-size:11px;color:#888;font-weight:400">(${members.length})</span>
        </h3>
        <div style="display:flex;flex-direction:column;gap:6px" id="clan-members-list"></div>
      </div>`;

    const list = document.getElementById('clan-members-list');
    members.forEach(([uid, m]) => {
      const [icon, label, color] = roleBadge[m.role] || roleBadge.member;
      const isMe = uid === user.uid;
      const canKick = perms.kickMembers && !isMe && m.role !== 'owner';

      const row = document.createElement('div');
      row.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px;
        background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
        border-radius:12px;${isMe?'border-color:rgba(200,169,64,0.3)':''}`;

      const av = renderAvatarHTML({ username: m.username, photoURL: m.photoURL }, 36);

      row.innerHTML = `
        ${av}
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#f0e8d0">
            ${escapeHTML(m.username||'عضو')} ${isMe ? '<span style="font-size:9px;color:#c8a940">(أنت)</span>' : ''}
          </div>
          <div style="font-size:11px;margin-top:1px;color:${color}">${icon} ${label}</div>
        </div>
        ${canKick ? `<button onclick="kickMember('${currentClanId}','${uid}','${jsAttrEscape(m.username||'')}')"
          style="background:rgba(255,71,87,0.15);color:#ff4757;border:1px solid rgba(255,71,87,0.3);
            border-radius:6px;font-size:9px;padding:4px 8px;cursor:pointer;font-family:inherit;flex-shrink:0">طرد</button>` : ''}`;
      list.appendChild(row);
    });
  });
}

function kickMember(clanId, uid, username) {
  if (!confirm(`طرد ${username} من النادي؟`)) return;
  const updates = {};
  updates['clans/' + clanId + '/members/' + uid] = null;
  updates['clans/' + clanId + '/modPerms/' + uid] = null;
  updates['users/' + uid + '/clan']   = '';
  updates['users/' + uid + '/clanId'] = '';
  db.ref().update(updates, () => {
    db.ref('clans/' + clanId + '/memberCount').transaction(n => Math.max(0, (n||1)-1));
    Toast.show(`تم طرد ${username}`, 'info');
    showClanMembers();
  });
}

function confirmDisbandClan(clanId) {
  if (!confirm('هل أنت متأكد؟ سيتم حل النادي وطرد جميع الأعضاء نهائياً!')) return;
  if (!confirm('هذا الإجراء لا يمكن التراجع عنه. تأكيد نهائي؟')) return;

  db.ref('clans/' + clanId).once('value', snap => {
    const clan = snap.val(); if (!clan) return;
    const members = clan.members || {};
    const updates = {};
    Object.keys(members).forEach(uid => {
      updates['users/' + uid + '/clan']   = '';
      updates['users/' + uid + '/clanId'] = '';
    });
    updates['clanNamesLower/' + encodeURIComponent(normalizeClubName(clan.name))] = null;

    db.ref().update(updates).then(() => {
      db.ref('clans/' + clanId).remove();
      if (clanChatListener) { clanChatListener.off(); clanChatListener = null; }
      currentClan = ''; currentClanId = '';
      Toast.show('تم حل النادي', 'info');
      closeProfileModal();
      renderClan();
    });
  });
}

// ============================================================
//  إعادة تصفير كاملة (مرة واحدة فقط) — تحذف كل النوادي الحالية
//  وتزيل عضوية كل لاعب منها، للبدء من جديد بالنظام الجديد.
//
//  مهم: هذا إجراء مدمّر ولا يمكن التراجع عنه. يُستدعى يدوياً
//  من لوحة الإدارة (admin.js) من حساب مشرف فقط.
// ============================================================
function adminWipeAllClans() {
  if (!isAdmin) { Toast.show('للمشرفين فقط', 'error'); return; }
  if (!confirm('⚠️ سيُحذف كل نادٍ موجود وتُزال عضوية كل لاعب منه نهائياً. متأكد؟')) return;
  if (prompt('اكتب "حذف" بالضبط للتأكيد النهائي:') !== 'حذف') { Toast.show('تم الإلغاء', 'info'); return; }

  // 1) نظّف حقل النادي من كل المستخدمين (شبكة أمان حتى لو فيه بيانات غير متّسقة)
  db.ref('users').once('value', snap => {
    const updates = {};
    snap.forEach(s => {
      updates['users/' + s.key + '/clan']   = '';
      updates['users/' + s.key + '/clanId'] = '';
    });
    // 2) احذف كل النوادي وفهرس الأسماء
    updates['clans'] = null;
    updates['clanNamesLower'] = null;
    db.ref().update(updates, err => {
      if (err) { Toast.show('فشل التصفير: ' + err.message, 'error'); return; }
      Toast.show('✅ تم تصفير كل النوادي بنجاح', 'success');
    });
  });
}
