// ============================================================
//  js/achievements.js — bee platform
//  نظام الإنجازات — شارات تُفتح تلقائياً
// ============================================================

const ACHIEVEMENTS = [
  // ── المستوى ──
  { id: 'lvl5',    icon: '🥉', name: 'ناشئ',       desc: 'بلغ المستوى 5',    check: u => (u.level||1) >= 5    },
  { id: 'lvl10',   icon: '🥈', name: 'محترف',      desc: 'بلغ المستوى 10',   check: u => (u.level||1) >= 10   },
  { id: 'lvl25',   icon: '🥇', name: 'خبير',       desc: 'بلغ المستوى 25',   check: u => (u.level||1) >= 25   },
  { id: 'lvl50',   icon: '💎', name: 'أسطوري',     desc: 'بلغ المستوى 50',   check: u => (u.level||1) >= 50   },

  // ── الكوينز ──
  { id: 'coins1k',  icon: '🪙', name: 'مدّخر',      desc: 'اجمع 1,000 كوينز',  check: u => (u.coins||0) >= 1000    },
  { id: 'coins10k', icon: '💰', name: 'ثري',        desc: 'اجمع 10,000 كوينز', check: u => (u.coins||0) >= 10000   },
  { id: 'coins50k', icon: '🏦', name: 'مليونير',    desc: 'اجمع 50,000 كوينز', check: u => (u.coins||0) >= 50000   },

  // ── الألعاب ──
  { id: 'win1',     icon: '🎮', name: 'أول فوز',   desc: 'فز في أي لعبة لأول مرة',  check: u => totalWins(u) >= 1    },
  { id: 'win10',    icon: '🏆', name: 'منافس',      desc: 'فز 10 مرات',               check: u => totalWins(u) >= 10   },
  { id: 'win50',    icon: '👑', name: 'بطل',        desc: 'فز 50 مرة',                check: u => totalWins(u) >= 50   },
  { id: 'win100',   icon: '🌟', name: 'أسطورة',     desc: 'فز 100 مرة',               check: u => totalWins(u) >= 100  },

  // ── الاجتماعية ──
  { id: 'friend1',  icon: '🤝', name: 'صديق',       desc: 'أضف أول صديق',     check: u => (u.friendsCount||0) >= 1   },
  { id: 'friend5',  icon: '👥', name: 'محبوب',      desc: 'اجمع 5 أصدقاء',    check: u => (u.friendsCount||0) >= 5   },
  { id: 'clan1',    icon: '⚔️', name: 'منتمي',      desc: 'انضم لكلان',        check: u => !!u.clan                   },
  { id: 'vip',      icon: '⭐', name: 'VIP',         desc: 'احصل على عضوية VIP', check: u => !!u.isVIP                 },

  // ── الحضور ──
  { id: 'streak3',  icon: '🔥', name: 'ملتزم',      desc: 'سلسلة 3 أيام',      check: u => (u.dailyStreak||0) >= 3   },
  { id: 'streak7',  icon: '⚡', name: 'دؤوب',       desc: 'سلسلة 7 أيام',      check: u => (u.dailyStreak||0) >= 7   },
  { id: 'streak30', icon: '🌙', name: 'أسطورة الحضور', desc: 'سلسلة 30 يوم',  check: u => (u.dailyStreak||0) >= 30  },

  // ── الشات ──
  { id: 'chat10',   icon: '💬', name: 'متحدث',      desc: 'أرسل 10 رسائل',    check: u => (u.totalMessages||0) >= 10   },
  { id: 'chat100',  icon: '📢', name: 'ناشط',        desc: 'أرسل 100 رسالة',   check: u => (u.totalMessages||0) >= 100  },
];

function totalWins(u) {
  if (!u.gameStats) return 0;
  return Object.values(u.gameStats).reduce((sum, g) => sum + (g.wins || 0), 0);
}

// ===== فحص وفتح الإنجازات =====
function checkAchievements(userData) {
  const user = auth.currentUser; if (!user) return;
  const unlocked = userData.achievements || {};

  const toUnlock = ACHIEVEMENTS.filter(a =>
    !unlocked[a.id] && a.check(userData)
  );

  if (!toUnlock.length) return;

  toUnlock.forEach((a, i) => {
    setTimeout(() => {
      // حفظ في Firebase
      db.ref('users/' + user.uid + '/achievements/' + a.id).set({
        unlockedAt: firebase.database.ServerValue.TIMESTAMP
      });
      // إظهار popup
      showAchievementPopup(a);
    }, i * 2500);
  });
}

// ===== popup الإنجاز =====
function showAchievementPopup(achievement) {
  const pop = document.createElement('div');
  pop.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(100px);
    z-index:99999;background:linear-gradient(135deg,#1c1500,#2d2200);
    border:1px solid rgba(200,169,64,0.6);border-radius:16px;
    padding:14px 20px;display:flex;align-items:center;gap:14px;
    box-shadow:0 8px 30px rgba(200,169,64,0.2);min-width:260px;
    transition:transform .4s cubic-bezier(0.34,1.56,0.64,1);
    font-family:inherit;direction:rtl;
  `;
  pop.innerHTML = `
    <div style="font-size:36px;filter:drop-shadow(0 0 10px rgba(200,169,64,0.6))">
      ${achievement.icon}
    </div>
    <div>
      <div style="font-size:10px;color:#c8a940;font-weight:700;letter-spacing:1px;margin-bottom:2px">
        🏅 إنجاز جديد!
      </div>
      <div style="font-size:15px;font-weight:900;color:#f0e8d0">${achievement.name}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">${achievement.desc}</div>
    </div>`;

  document.body.appendChild(pop);
  setTimeout(() => pop.style.transform = 'translateX(-50%) translateY(0)', 50);
  setTimeout(() => {
    pop.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(() => pop.remove(), 400);
  }, 4000);
}

// ===== عرض إنجازات لاعب =====
function showAchievements(uid) {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';
  content.innerHTML = '<div style="text-align:center;color:#888;padding:20px">جاري التحميل...</div>';

  db.ref('users/' + uid + '/achievements').once('value', snap => {
    const unlocked = snap.val() || {};
    const count    = Object.keys(unlocked).length;
    const total    = ACHIEVEMENTS.length;

    content.innerHTML = `
      <div style="text-align:right">
        <h3 style="margin:0 0 6px;color:#fbbf24;font-size:15px">🏅 الإنجازات</h3>
        <div style="font-size:12px;color:#888;margin-bottom:14px">
          ${count} / ${total} مكتملة
          <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:5px;
            overflow:hidden;margin-top:6px">
            <div style="height:100%;width:${Math.round(count/total*100)}%;
              background:linear-gradient(90deg,#c8a940,#f0c040);border-radius:10px"></div>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${ACHIEVEMENTS.map(a => {
            const done = !!unlocked[a.id];
            return `
              <div style="width:calc(50% - 4px);background:${done ? 'rgba(200,169,64,0.08)' : 'rgba(255,255,255,0.03)'};
                border:1px solid ${done ? 'rgba(200,169,64,0.3)' : 'rgba(255,255,255,0.06)'};
                border-radius:12px;padding:10px;display:flex;gap:8px;align-items:center;
                opacity:${done ? '1' : '0.4'}">
                <div style="font-size:24px">${done ? a.icon : '🔒'}</div>
                <div style="min-width:0">
                  <div style="font-size:11px;font-weight:700;color:${done?'#f0e8d0':'#666'}">
                    ${a.name}
                  </div>
                  <div style="font-size:9px;color:#555;margin-top:1px">${a.desc}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  });
}
