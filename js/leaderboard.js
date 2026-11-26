// ============================================================
//  js/leaderboard.js — bee platform
//  لوحة المتصدرين — تبويبين: الأغنى (كوينز) + مليون (فوز)
// ============================================================

let _lbTab = 'coins'; // 'coins' | 'million'

function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;

  // أزرار التبويب — تُضاف مرة وحدة فوق القائمة
  if (!document.getElementById('lb-tabs') && list.parentElement) {
    const tabs = document.createElement('div');
    tabs.id = 'lb-tabs';
    tabs.style.cssText = 'display:flex;gap:8px;margin-bottom:12px';
    tabs.innerHTML = `
      <button id="lb-tab-coins" onclick="switchLeaderboardTab('coins')"
        style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:800;
          cursor:pointer;font-family:inherit;border:1px solid">🪙 الأغنى</button>
      <button id="lb-tab-million" onclick="switchLeaderboardTab('million')"
        style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:800;
          cursor:pointer;font-family:inherit;border:1px solid">🃏 مليون</button>`;
    list.parentElement.insertBefore(tabs, list);
  }
  updateLeaderboardTabStyles();

  list.innerHTML = '<div style="text-align:center;color:#555577;padding:24px;font-size:13px">جاري التحميل...</div>';

  if (_lbTab === 'million') loadMillionLeaderboard(list);
  else loadCoinsLeaderboard(list);
}

function switchLeaderboardTab(tab) {
  _lbTab = tab;
  renderLeaderboard();
}

function updateLeaderboardTabStyles() {
  const coinsBtn   = document.getElementById('lb-tab-coins');
  const millionBtn = document.getElementById('lb-tab-million');
  if (!coinsBtn || !millionBtn) return;
  const active   = 'background:rgba(251,191,36,0.15);color:#fbbf24;border-color:rgba(251,191,36,0.3)';
  const inactive = 'background:rgba(255,255,255,0.04);color:#888;border-color:rgba(255,255,255,0.1)';
  coinsBtn.style.cssText   = `flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;border:1px solid;${_lbTab==='coins'   ? active : inactive}`;
  millionBtn.style.cssText = `flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;border:1px solid;${_lbTab==='million' ? active : inactive}`;
}

// ===== تبويب: الأغنى (كوينز) =====
function loadCoinsLeaderboard(list) {
  db.ref('users').orderByChild('coins').limitToLast(20).once('value', snap => {
    let players = [];
    snap.forEach(child => {
      const u = child.val();
      u.uid = child.key;
      if (!u.isAdmin) players.push(u);
    });
    players.reverse();
    renderLeaderboardRows(list, players, p => `🪙 ${(p.coins||0).toLocaleString('ar')}`);
  });
}

// ===== تبويب: مليون (الأكثر فوزاً) =====
function loadMillionLeaderboard(list) {
  db.ref('users').orderByChild('gameStats/million/wins').limitToLast(20).once('value', snap => {
    let players = [];
    snap.forEach(child => {
      const u = child.val();
      u.uid = child.key;
      const wins = (u.gameStats && u.gameStats.million && u.gameStats.million.wins) || 0;
      if (!u.isAdmin && wins > 0) players.push(u);
    });
    players.reverse();
    renderLeaderboardRows(list, players, p => {
      const wins   = (p.gameStats && p.gameStats.million && p.gameStats.million.wins)   || 0;
      const losses = (p.gameStats && p.gameStats.million && p.gameStats.million.losses) || 0;
      const total  = wins + losses;
      const rate   = total ? Math.round(wins / total * 100) : 0;
      return `🏆 ${wins} فوز <span style="color:#555577;font-size:10px">(${rate}%)</span>`;
    });
  });
}

// ===== رسم الصفوف (مشترك بين التبويبين) =====
function renderLeaderboardRows(list, players, scoreFn) {
  const medals = ['🥇','🥈','🥉'];
  const bgTop  = ['rgba(251,191,36,0.08)','rgba(168,85,247,0.06)','rgba(16,185,129,0.06)'];

  list.innerHTML = players.map((p, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;
      border-bottom:1px solid rgba(255,255,255,0.04);
      background:${i < 3 ? bgTop[i] : 'transparent'}">

      <div style="font-size:${i<3?22:13}px;width:28px;text-align:center;flex-shrink:0">
        ${medals[i] || `<span style="color:#555577">${i+1}</span>`}
      </div>

      ${renderAvatarHTML(p, 38, i===0 ? 'box-shadow:0 0 12px rgba(251,191,36,0.4)' : '')}

      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${escapeHTML(p.username||'لاعب')}
        </div>
        <div style="font-size:10px;color:#555577;margin-top:1px">
          ${p.clan ? `<span style="color:#10b981">[${p.clan}]</span> · ` : ''}
          <span>Lv.${p.level||1}</span>
        </div>
      </div>

      <div style="color:#fbbf24;font-weight:900;font-size:13px;flex-shrink:0;text-align:left">
        ${scoreFn(p)}
      </div>

      ${isAdmin ? `
        <button
          data-uid="${p.uid}"
          data-username="${escapeHTML(p.username||'')}"
          onclick="adminGiveCoinsToUser(this.dataset.uid, this.dataset.username)"
          style="background:rgba(239,68,68,0.15);color:#ef4444;
            border:1px solid rgba(239,68,68,0.3);border-radius:6px;
            font-size:9px;padding:3px 7px;cursor:pointer;font-family:inherit">
          منح
        </button>` : ''}
    </div>
  `).join('') || '<div style="text-align:center;color:#555577;padding:24px">لا يوجد لاعبون</div>';
}