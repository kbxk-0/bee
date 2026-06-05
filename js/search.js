// ============================================================
//  js/search.js — bee platform
//  البحث العام: لاعبين + كلانات
// ============================================================

function openSearch() {
  document.getElementById('search-panel')?.remove();

  const panel = document.createElement('div');
  panel.id    = 'search-panel';
  panel.style.cssText = `
    position:fixed;inset:0;z-index:8500;background:#0a0a14;
    display:flex;flex-direction:column;font-family:inherit;direction:rtl;
  `;

  panel.innerHTML = `
    <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.07);
      display:flex;gap:10px;align-items:center;flex-shrink:0">
      <button onclick="document.getElementById('search-panel').remove()"
        style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:36px;height:36px;color:#aaa;cursor:pointer;font-size:16px;flex-shrink:0">
        ←
      </button>
      <div style="flex:1;position:relative">
        <input type="text" id="global-search-input"
          placeholder="ابحث عن لاعب أو كلان..."
          autofocus
          oninput="handleGlobalSearch(this.value)"
          style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
            color:white;border-radius:12px;padding:10px 40px 10px 12px;
            font-family:inherit;font-size:14px;box-sizing:border-box;outline:none">
        <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
          color:#555;font-size:16px;pointer-events:none">🔍</span>
      </div>
    </div>

    <!-- فلاتر -->
    <div style="display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0">
      <button id="filter-all"     onclick="setSearchFilter('all')"
        style="${filterBtnStyle(true)}">الكل</button>
      <button id="filter-players" onclick="setSearchFilter('players')"
        style="${filterBtnStyle(false)}">👤 لاعبين</button>
      <button id="filter-clans"   onclick="setSearchFilter('clans')"
        style="${filterBtnStyle(false)}">⚔️ كلانات</button>
    </div>

    <!-- النتائج -->
    <div id="search-results" style="flex:1;overflow-y:auto;padding:10px 14px">
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:48px;margin-bottom:12px">🔍</div>
        <div style="color:#555;font-size:13px">ابحث عن أي شخص أو كلان</div>
      </div>
    </div>`;

  document.body.appendChild(panel);
  setTimeout(() => document.getElementById('global-search-input')?.focus(), 100);
}

let searchFilter = 'all';
let searchTimer  = null;

function filterBtnStyle(active) {
  return `padding:6px 14px;border-radius:20px;font-size:12px;cursor:pointer;
    font-family:inherit;font-weight:700;border:1px solid ${active ? 'var(--accent,#c8a940)' : '#2a2a3f'};
    background:${active ? 'rgba(200,169,64,0.15)' : '#1a1a28'};
    color:${active ? '#c8a940' : '#888'}`;
}

function setSearchFilter(filter) {
  searchFilter = filter;
  ['all','players','clans'].forEach(f => {
    const btn = document.getElementById('filter-' + f);
    if (btn) btn.style.cssText = filterBtnStyle(f === filter);
  });
  const inp = document.getElementById('global-search-input');
  if (inp?.value.trim().length >= 2) handleGlobalSearch(inp.value);
}

function handleGlobalSearch(val) {
  clearTimeout(searchTimer);
  const q = val.trim();
  if (q.length < 2) {
    document.getElementById('search-results').innerHTML = `
      <div style="text-align:center;padding:40px;color:#555;font-size:12px">
        اكتب حرفين على الأقل للبحث
      </div>`;
    return;
  }
  const res = document.getElementById('search-results');
  res.innerHTML = '<div style="text-align:center;color:#555;padding:30px;font-size:12px">جاري البحث...</div>';
  searchTimer = setTimeout(() => runSearch(q), 350);
}

function runSearch(q) {
  const res = document.getElementById('search-results');
  if (!res) return;

  const results = { players: [], clans: [] };
  let done = 0;
  const needed = (searchFilter === 'all') ? 2 : 1;

  const finish = () => {
    done++;
    if (done < needed) return;
    renderSearchResults(results, q);
  };

  if (searchFilter === 'all' || searchFilter === 'players') {
    db.ref('users').orderByChild('username')
      .startAt(q).endAt(q + '\uf8ff').limitToFirst(8)
      .once('value', snap => {
        snap.forEach(s => results.players.push({ uid: s.key, ...s.val() }));
        finish();
      });
  }

  if (searchFilter === 'all' || searchFilter === 'clans') {
    db.ref('clans').orderByChild('name')
      .startAt(q).endAt(q + '\uf8ff').limitToFirst(6)
      .once('value', snap => {
        snap.forEach(s => results.clans.push({ id: s.key, ...s.val() }));
        finish();
      });
  }
}

function renderSearchResults(results, q) {
  const res = document.getElementById('search-results');
  if (!res) return;

  const { players, clans } = results;
  const myUid = auth.currentUser?.uid;

  if (!players.length && !clans.length) {
    res.innerHTML = `
      <div style="text-align:center;padding:50px 20px">
        <div style="font-size:36px;margin-bottom:10px">😕</div>
        <div style="color:#555;font-size:13px">لا نتائج لـ "${escapeHTML(q)}"</div>
      </div>`;
    return;
  }

  let html = '';

  // ── اللاعبون ──
  if (players.length) {
    html += `<div style="font-size:11px;color:#705030;margin-bottom:8px;font-weight:700">
      👤 لاعبون (${players.length})</div>`;

    html += players.map(p => {
      const isMe = p.uid === myUid;
      const av   = p.photoURL
        ? `<img src="${p.photoURL}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid rgba(200,169,64,0.3)">`
        : `<div style="width:44px;height:44px;border-radius:50%;background:${getAvatarColor(p.username||'?')};
            display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:white;flex-shrink:0">
            ${(p.username||'?').charAt(0).toUpperCase()}</div>`;

      // هايلايت الحروف المطابقة
      const name = escapeHTML(p.username || 'لاعب');
      const highlighted = name.replace(
        new RegExp(escapeHTML(q), 'gi'),
        m => `<span style="color:#c8a940;font-weight:900">${m}</span>`
      );

      return `
        <div onclick="${isMe ? "openSettings()" : `viewProfile('${p.uid}')`}"
          style="display:flex;align-items:center;gap:12px;padding:12px;
            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
            border-radius:14px;margin-bottom:8px;cursor:pointer">
          ${av}
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700;color:#f0e8d0">
              ${highlighted}
              ${isMe ? '<span style="font-size:9px;color:#c8a940">(أنت)</span>' : ''}
              ${p.isVIP ? '<span style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1a0800;font-size:8px;padding:1px 5px;border-radius:6px;font-weight:900;margin-right:3px">VIP</span>' : ''}
            </div>
            <div style="font-size:11px;color:#555;margin-top:2px">
              ⭐ Lv.${p.level||1}
              ${p.clan ? ` · ⚔️ ${escapeHTML(p.clan)}` : ''}
              · 🪙 ${(p.coins||0).toLocaleString('ar')}
            </div>
          </div>
          <span style="color:#444;font-size:14px">←</span>
        </div>`;
    }).join('');
  }

  // ── الكلانات ──
  if (clans.length) {
    if (players.length) html += `<div style="height:8px"></div>`;
    html += `<div style="font-size:11px;color:#705030;margin-bottom:8px;font-weight:700">
      ⚔️ كلانات (${clans.length})</div>`;

    const typeIcons = { open: '🔓', request: '📋', closed: '🔒' };
    const typeNames = { open: 'مفتوح', request: 'بطلب', closed: 'مغلق' };

    html += clans.map(c => {
      const name        = escapeHTML(c.name || 'كلان');
      const highlighted = name.replace(
        new RegExp(escapeHTML(q), 'gi'),
        m => `<span style="color:#c8a940;font-weight:900">${m}</span>`
      );
      const alreadyIn = currentClan === c.name;

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;
          background:rgba(255,255,255,0.04);border:1px solid ${alreadyIn ? 'rgba(46,213,115,0.3)' : 'rgba(255,255,255,0.07)'};
          border-radius:14px;margin-bottom:8px">
          <div style="width:44px;height:44px;border-radius:12px;
            background:linear-gradient(135deg,rgba(108,99,255,0.3),rgba(168,85,247,0.2));
            display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">
            ⚔️
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700;color:#f0e8d0">[ ${highlighted} ]</div>
            <div style="font-size:11px;color:#555;margin-top:2px">
              👥 ${c.memberCount||1} عضو
              · ${typeIcons[c.type]||'🔓'} ${typeNames[c.type]||'مفتوح'}
            </div>
          </div>
          ${alreadyIn
            ? '<span style="font-size:11px;color:#2ed573;font-weight:700">كلانك ✓</span>'
            : currentClan
            ? '<span style="font-size:11px;color:#555">في كلان</span>'
            : c.type === 'open'
            ? `<button onclick="joinClanFromSearch('${c.id}','${escapeHTML(c.name)}')"
                style="background:#2ed573;color:black;border:none;border-radius:8px;
                  font-size:11px;padding:7px 12px;cursor:pointer;font-weight:900;font-family:inherit">
                انضمام
              </button>`
            : c.type === 'request'
            ? `<button onclick="requestJoinClan('${c.id}','${escapeHTML(c.name)}')"
                style="background:#6c63ff;color:white;border:none;border-radius:8px;
                  font-size:11px;padding:7px 12px;cursor:pointer;font-weight:900;font-family:inherit">
                طلب
              </button>`
            : '<span style="font-size:11px;color:#ff4757">🔒</span>'}
        </div>`;
    }).join('');
  }

  res.innerHTML = html;
}

function joinClanFromSearch(clanId, clanName) {
  if (typeof joinClan === 'function') {
    joinClan(clanId, clanName);
    document.getElementById('search-panel')?.remove();
  }
}
