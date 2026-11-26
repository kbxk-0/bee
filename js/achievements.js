// ============================================================
//  js/achievements.js — bee platform
//  نظام الإنجازات — شارات تُفتح تلقائياً، بنظام درجات جواكر:
//  كل فئة فيها 4 درجات (برونزي ← فضي ← ذهبي ← ياقوتي)
//
//  مهم: كل الـIDs القديمة محفوظة بدون أي تغيير — أي إنجاز كان
//  مفتوح لأي لاعب يبقى مفتوح، ما يتأثر بإعادة التنظيم هذي.
// ============================================================

const TIER_STYLES = [
  { name: 'برونزي', color: '#cd7f32', glow: 'rgba(205,127,50,0.5)'  },
  { name: 'فضي',    color: '#c0c0c0', glow: 'rgba(192,192,192,0.5)' },
  { name: 'ذهبي',   color: '#ffd700', glow: 'rgba(255,215,0,0.5)'   },
  { name: 'ياقوتي', color: '#e0115f', glow: 'rgba(224,17,95,0.6)'   },
];

const ACHIEVEMENT_CATEGORIES = [
  {
    cat: 'level', name: 'المستوى', baseIcon: '⭐',
    tiers: [
      { id: 'lvl5',  name: 'ناشئ',   desc: 'بلغ المستوى 5',  check: u => (u.level||1) >= 5  },
      { id: 'lvl10', name: 'محترف',  desc: 'بلغ المستوى 10', check: u => (u.level||1) >= 10 },
      { id: 'lvl25', name: 'خبير',   desc: 'بلغ المستوى 25', check: u => (u.level||1) >= 25 },
      { id: 'lvl50', name: 'أسطوري', desc: 'بلغ المستوى 50', check: u => (u.level||1) >= 50 },
    ]
  },
  {
    cat: 'coins', name: 'الكوينز', baseIcon: '🪙',
    tiers: [
      { id: 'coins1k',   name: 'مدّخر',    desc: 'اجمع 1,000 كوينز',   check: u => (u.coins||0) >= 1000   },
      { id: 'coins10k',  name: 'ثري',      desc: 'اجمع 10,000 كوينز',  check: u => (u.coins||0) >= 10000  },
      { id: 'coins50k',  name: 'مليونير',  desc: 'اجمع 50,000 كوينز',  check: u => (u.coins||0) >= 50000  },
      { id: 'coins200k', name: 'إمبراطور', desc: 'اجمع 200,000 كوينز', check: u => (u.coins||0) >= 200000 },
    ]
  },
  {
    cat: 'wins', name: 'الفوز', baseIcon: '🏆',
    tiers: [
      { id: 'win1',   name: 'أول فوز', desc: 'فز في أي لعبة لأول مرة', check: u => totalWins(u) >= 1   },
      { id: 'win10',  name: 'منافس',   desc: 'فز 10 مرات',             check: u => totalWins(u) >= 10  },
      { id: 'win50',  name: 'بطل',     desc: 'فز 50 مرة',              check: u => totalWins(u) >= 50  },
      { id: 'win100', name: 'أسطورة',  desc: 'فز 100 مرة',             check: u => totalWins(u) >= 100 },
    ]
  },
  {
    cat: 'friends', name: 'الأصدقاء', baseIcon: '🤝',
    tiers: [
      { id: 'friend1',  name: 'صديق',    desc: 'أضف أول صديق',  check: u => (u.friendsCount||0) >= 1  },
      { id: 'friend5',  name: 'محبوب',   desc: 'اجمع 5 أصدقاء', check: u => (u.friendsCount||0) >= 5  },
      { id: 'friend15', name: 'اجتماعي', desc: 'اجمع 15 صديق',  check: u => (u.friendsCount||0) >= 15 },
      { id: 'friend30', name: 'مؤثر',    desc: 'اجمع 30 صديق',  check: u => (u.friendsCount||0) >= 30 },
    ]
  },
  {
    cat: 'streak', name: 'الحضور', baseIcon: '🔥',
    tiers: [
      { id: 'streak3',   name: 'ملتزم',         desc: 'سلسلة 3 أيام',  check: u => (u.dailyStreak||0) >= 3   },
      { id: 'streak7',   name: 'دؤوب',          desc: 'سلسلة 7 أيام',  check: u => (u.dailyStreak||0) >= 7   },
      { id: 'streak30',  name: 'أسطورة الحضور', desc: 'سلسلة 30 يوم',  check: u => (u.dailyStreak||0) >= 30  },
      { id: 'streak100', name: 'لا يُقهر',       desc: 'سلسلة 100 يوم', check: u => (u.dailyStreak||0) >= 100 },
    ]
  },
  {
    cat: 'chat', name: 'الشات', baseIcon: '💬',
    tiers: [
      { id: 'chat10',   name: 'متحدث',    desc: 'أرسل 10 رسائل',   check: u => (u.totalMessages||0) >= 10   },
      { id: 'chat100',  name: 'ناشط',     desc: 'أرسل 100 رسالة',  check: u => (u.totalMessages||0) >= 100  },
      { id: 'chat500',  name: 'مشهور',    desc: 'أرسل 500 رسالة',  check: u => (u.totalMessages||0) >= 500  },
      { id: 'chat2000', name: 'نجم الشات', desc: 'أرسل 2,000 رسالة', check: u => (u.totalMessages||0) >= 2000 },
    ]
  },
];

// شارات خاصة (مرة واحدة، بدون درجات) — زي شارات الانتماء/العضوية بجواكر
const SPECIAL_ACHIEVEMENTS = [
  { id: 'clan1', icon: '⚔️', name: 'منتمي', desc: 'انضم لكلان',         check: u => !!u.clan  },
  { id: 'vip',   icon: '⭐', name: 'VIP',   desc: 'احصل على عضوية VIP', check: u => !!u.isVIP },
];

// ===== القائمة المسطّحة (للتوافق الكامل مع باقي النظام: الحفظ، الفحص...) =====
const ACHIEVEMENTS = [];
ACHIEVEMENT_CATEGORIES.forEach(cat => {
  cat.tiers.forEach((tier, i) => {
    ACHIEVEMENTS.push({
      id: tier.id, name: tier.name, desc: tier.desc, check: tier.check,
      icon: cat.baseIcon, category: cat.name,
      tier: TIER_STYLES[i].name, tierColor: TIER_STYLES[i].color, tierGlow: TIER_STYLES[i].glow,
    });
  });
});
SPECIAL_ACHIEVEMENTS.forEach(a => ACHIEVEMENTS.push({ ...a, category: 'خاص', tier: null }));

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

// ===== popup الإنجاز — بتلوين الدرجة (برونزي/فضي/ذهبي/ياقوتي) =====
function showAchievementPopup(achievement) {
  Sounds.play('achievement');
  Haptic.success();

  const tierColor = achievement.tierColor || '#c8a940';
  const tierGlow  = achievement.tierGlow  || 'rgba(200,169,64,0.4)';

  const pop = document.createElement('div');
  pop.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(100px);
    z-index:99999;background:linear-gradient(135deg,#1c1500,#2d2200);
    border:1px solid ${tierColor};border-radius:16px;
    padding:14px 20px;display:flex;align-items:center;gap:14px;
    box-shadow:0 8px 30px ${tierGlow};min-width:260px;
    transition:transform .4s cubic-bezier(0.34,1.56,0.64,1);
    font-family:inherit;direction:rtl;
  `;
  pop.innerHTML = `
    <div style="width:52px;height:52px;border-radius:50%;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;font-size:30px;
      background:radial-gradient(circle,${tierColor}33,transparent);
      border:2px solid ${tierColor};filter:drop-shadow(0 0 10px ${tierGlow})">
      ${achievement.icon}
    </div>
    <div>
      <div style="font-size:10px;color:${tierColor};font-weight:700;letter-spacing:1px;margin-bottom:2px">
        🏅 ${achievement.tier ? achievement.tier + ' · ' : ''}إنجاز جديد!
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

// ===== عرض إنجازات لاعب — مجمّعة بفئات، كل فئة بدرجاتها الأربع الملوّنة =====
function showAchievements(uid) {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  saveModalSnapshot();
  modal.style.display = 'flex';
  content.innerHTML = '<div style="text-align:center;color:#888;padding:20px">جاري التحميل...</div>';

  db.ref('users/' + uid + '/achievements').once('value', snap => {
    const unlocked = snap.val() || {};
    const count    = Object.keys(unlocked).length;
    const total    = ACHIEVEMENTS.length;

    const groupsHTML = ACHIEVEMENT_CATEGORIES.map(cat => {
      const badgesHTML = cat.tiers.map((tier, i) => {
        const done  = !!unlocked[tier.id];
        const style = TIER_STYLES[i];
        return `
          <div style="flex:1;text-align:center;opacity:${done ? '1' : '0.4'}">
            <div style="width:46px;height:46px;margin:0 auto 4px;border-radius:50%;
              display:flex;align-items:center;justify-content:center;font-size:21px;
              background:${done ? `radial-gradient(circle,${style.color}33,transparent)` : 'rgba(255,255,255,0.04)'};
              border:2px solid ${done ? style.color : 'rgba(255,255,255,0.1)'}">
              ${done ? cat.baseIcon : '🔒'}
            </div>
            <div style="font-size:9px;color:${done ? style.color : '#555'};font-weight:700">${style.name}</div>
          </div>`;
      }).join('');
      return `
        <div style="margin-bottom:14px">
          <div style="font-size:12px;font-weight:800;color:#f0e8d0;margin-bottom:8px">${cat.baseIcon} ${cat.name}</div>
          <div style="display:flex;gap:6px;background:rgba(255,255,255,0.02);border-radius:12px;padding:10px">
            ${badgesHTML}
          </div>
        </div>`;
    }).join('');

    const specialHTML = `
      <div style="font-size:12px;font-weight:800;color:#f0e8d0;margin-bottom:8px">🎖️ شارات خاصة</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
        ${SPECIAL_ACHIEVEMENTS.map(a => {
          const done = !!unlocked[a.id];
          return `
            <div style="width:calc(50% - 4px);background:${done ? 'rgba(200,169,64,0.08)' : 'rgba(255,255,255,0.03)'};
              border:1px solid ${done ? 'rgba(200,169,64,0.3)' : 'rgba(255,255,255,0.06)'};
              border-radius:12px;padding:10px;display:flex;gap:8px;align-items:center;
              opacity:${done ? '1' : '0.4'}">
              <div style="font-size:24px">${done ? a.icon : '🔒'}</div>
              <div style="min-width:0">
                <div style="font-size:11px;font-weight:700;color:${done ? '#f0e8d0' : '#666'}">${a.name}</div>
                <div style="font-size:9px;color:#555;margin-top:1px">${a.desc}</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;

    content.innerHTML = `
      <div style="text-align:right">
        <h3 style="margin:0 0 6px;color:#fbbf24;font-size:15px">🏅 الإنجازات</h3>
        <div style="font-size:12px;color:#888;margin-bottom:14px">
          ${count} / ${total} مكتملة
          <div style="background:rgba(255,255,255,0.06);border-radius:10px;height:5px;
            overflow:hidden;margin-top:6px">
            <div style="height:100%;width:${Math.round(count/total*100)}%;
              background:linear-gradient(90deg,#cd7f32,#c0c0c0,#ffd700,#e0115f);border-radius:10px"></div>
          </div>
        </div>

        ${groupsHTML}
        ${specialHTML}
      </div>`;
  });
}
