// ============================================================
//  js/leaderboard.js — bee platform
//  لوحة المتصدرين
// ============================================================

function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;color:#555577;padding:24px;font-size:13px">جاري التحميل...</div>';

  db.ref('users').orderByChild('coins').limitToLast(20).once('value', snap => {
    let players = [];
    snap.forEach(child => {
      const u = child.val();
      u.uid = child.key;
      if (!u.isAdmin) players.push(u);
    });
    players.reverse();

    const medals = ['🥇','🥈','🥉'];
    const bgTop  = ['rgba(251,191,36,0.08)','rgba(168,85,247,0.06)','rgba(16,185,129,0.06)'];

    list.innerHTML = players.map((p, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;
        border-bottom:1px solid rgba(255,255,255,0.04);
        background:${i < 3 ? bgTop[i] : 'transparent'}">

        <div style="font-size:${i<3?22:13}px;width:28px;text-align:center;flex-shrink:0">
          ${medals[i] || `<span style="color:#555577">${i+1}</span>`}
        </div>

        <div style="width:38px;height:38px;border-radius:50%;
          background:${getAvatarColor(p.username||'؟')};
          display:flex;align-items:center;justify-content:center;
          font-size:16px;font-weight:900;color:white;flex-shrink:0;
          ${i===0?'box-shadow:0 0 12px rgba(251,191,36,0.4)':''}">
          ${(p.username||'؟').charAt(0).toUpperCase()}
        </div>

        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${escapeHTML(p.username||'لاعب')}
          </div>
          <div style="font-size:10px;color:#555577;margin-top:1px">
            ${p.clan ? `<span style="color:#10b981">[${p.clan}]</span> · ` : ''}
            <span>Lv.${p.level||1}</span>
          </div>
        </div>

        <div style="color:#fbbf24;font-weight:900;font-size:13px;flex-shrink:0">
          🪙 ${(p.coins||0).toLocaleString('ar')}
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
  });
}
