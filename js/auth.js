// ============================================================
//  js/auth.js — bee platform
//  تسجيل الدخول، إنشاء حساب، ومراقبة حالة المستخدم
//  هذا الملف يُحمَّل آخراً لأنه يعتمد على كل الملفات الأخرى
// ============================================================

// ===== تسجيل الدخول =====
async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;

  if (!email || !pass) { Toast.show("يرجى تعبئة البريد وكلمة المرور", 'error'); return; }

  try {
    await auth.signInWithEmailAndPassword(email, pass);
    document.getElementById('auth-overlay').style.display = 'none';
  } catch (err) {
    // ترجمة أخطاء Firebase الشائعة للعربي
    const errors = {
      'auth/user-not-found':    'البريد الإلكتروني غير مسجل',
      'auth/wrong-password':    'كلمة المرور غير صحيحة',
      'auth/invalid-email':     'البريد الإلكتروني غير صحيح',
      'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً'
    };
    Toast.show(errors[err.code] || 'خطأ: ' + err.message, 'error');
  }
}

// ===== إنشاء حساب جديد =====
async function doRegister() {
  const email    = document.getElementById('l-email').value.trim();
  const pass     = document.getElementById('l-pass').value;
  const username = document.getElementById('l-username')?.value.trim();

  if (!email || !pass) { Toast.show("يرجى تعبئة جميع الحقول", 'error'); return; }
  if (pass.length < 6) { Toast.show("كلمة المرور يجب أن تكون 6 أحرف على الأقل", 'error'); return; }
  if (username && (username.length < 3 || username.length > 15)) {
    Toast.show("اسم المستخدم بين 3 و15 حرفاً", 'error'); return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const uid  = cred.user.uid;
    const name = username || email.split('@')[0];

    // إنشاء بيانات المستخدم في قاعدة البيانات
    await db.ref('users/' + uid).set({
      username:   name,
      email:      email,
      level:      1,
      xp:         0,
      coins:      100,       // هدية ترحيبية
      isVIP:      false,
      isAdmin:    false,
      isMuted:    false,
      clan:       '',
      title:      '',
      titleColor: '',
      createdAt:  Date.now()
    });

    document.getElementById('auth-overlay').style.display = 'none';
    const refCode = document.getElementById('l-refcode')?.value?.trim();
    if (refCode && typeof applyReferralOnRegister === 'function')
      applyReferralOnRegister(uid, name, refCode);
    Toast.show(`مرحباً ${name}! تم إنشاء حسابك وحصلت على 100 🪙 هدية ترحيبية!`, 'gold');
  } catch (err) {
    const errors = {
      'auth/email-already-in-use': 'هذا البريد مسجل بالفعل',
      'auth/invalid-email':        'البريد الإلكتروني غير صحيح',
      'auth/weak-password':        'كلمة المرور ضعيفة جداً'
    };
    Toast.show(errors[err.code] || 'خطأ: ' + err.message, 'error');
  }
}

// ===== التبديل بين تسجيل الدخول وإنشاء حساب =====
function toggleAuthMode() {
  const overlay  = document.getElementById('auth-overlay');
  const isLogin  = overlay.dataset.mode !== 'register';
  overlay.dataset.mode = isLogin ? 'register' : 'login';

  const btn = overlay.querySelector('.auth-btn');
  const sw  = overlay.querySelector('.auth-switch');
  const unf = document.getElementById('l-username');

  if (btn) { btn.textContent = isLogin ? 'إنشاء الحساب' : 'دخول اللعبة'; btn.onclick = isLogin ? doRegister : doLogin; }
  if (sw)  sw.innerHTML = isLogin ? 'لديك حساب؟ <span>سجّل دخولك</span>' : 'ليس لديك حساب؟ <span>أنشئ واحداً</span>';
  if (unf) unf.style.display = isLogin ? 'block' : 'none';
  const rfc = document.getElementById('l-refcode');
  if (rfc) rfc.style.display = isLogin ? 'block' : 'none';
}

// ===== سلسلة تسجيل الدخول اليومي + مكافآت متصاعدة (7 أيام، تتكرر) =====
const DAILY_LOGIN_REWARDS = [20, 30, 40, 60, 80, 120, 200];

function checkDailyLogin(uid) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let grantedReward = 0, grantedStreak = 0;

  db.ref('users/' + uid).transaction(u => {
    if (!u) return u;
    if (u.lastLoginDate === todayStr) { grantedReward = 0; return u; } // دخل اليوم خلاص، ما نكرر المكافأة

    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const continued = u.lastLoginDate === yesterdayStr;
    const newStreak  = continued ? (u.dailyStreak || 0) + 1 : 1;
    const reward     = DAILY_LOGIN_REWARDS[(newStreak - 1) % DAILY_LOGIN_REWARDS.length];

    u.lastLoginDate = todayStr;
    u.dailyStreak   = newStreak;
    u.coins         = (u.coins || 0) + reward;

    grantedReward = reward;
    grantedStreak = newStreak;
    return u;
  }, (err, committed) => {
    if (!err && committed && grantedReward > 0) {
      if (typeof showDailyLoginPopup === 'function') showDailyLoginPopup(grantedStreak, grantedReward);
      Sounds.play('coins'); Haptic.success();
    }
  });
}

// ===== مراقبة حالة تسجيل الدخول =====
// هذه الدالة تُشغَّل تلقائياً عند:
//   - فتح التطبيق (لو كان المستخدم مسجلاً)
//   - تسجيل الدخول
//   - تسجيل الخروج
let _appSoundPlayed = false;
auth.onAuthStateChanged((user) => {
  const overlay = document.getElementById('auth-overlay');

  if (user) {
    if (!_appSoundPlayed) { _appSoundPlayed = true; setTimeout(() => Sounds.play('appOpen'), 600); }
    if (overlay) overlay.style.display = 'none';
    if (typeof checkForUpdate === 'function') checkForUpdate();
    checkDailyLogin(user.uid);

    // ===== مستمع التحويلات الواردة =====
    db.ref('transfers/' + user.uid).on('child_added', snap => {
      const t = snap.val();
      if (!t) return;
      if (t.amount > 0) db.ref('users/' + user.uid + '/coins').transaction(c => (c || 0) + t.amount);
      snap.ref.remove();
      if (typeof showToastTransfer === 'function' && t.amount > 0) showToastTransfer(t.from, t.amount);
      if (typeof sendNotification === 'function' && t.amount > 0)
        sendNotification(user.uid, 'transfer', 'تحويل كوينز', `استلمت ${t.amount} 🪙 من ${t.from}`);
      if (typeof sendNotification === 'function' && t.type === 'gift')
        sendNotification(user.uid, 'gift', 'هدية جديدة!', `${t.from} أرسل لك ${t.giftEmoji} ${t.giftName}`);
    });

    // اشترك في تغييرات بيانات المستخدم في real-time
    db.ref('users/' + user.uid).on('value', (snapshot) => {
      const val = snapshot.val() || {};

      // تحديث المتغيرات العامة
      const prevLevel   = currentLevel; // نحفظ المستوى القديم للمقارنة
      currentUsername   = val.username   || user.email.split('@')[0];
      currentLevel      = val.level      || 1;
      currentXP         = val.xp         || 0;
      currentCoins      = val.coins      || 0;
      isVIP             = val.isVIP      || false;
      currentClan       = val.clan       || '';
      currentClanId     = val.clanId     || '';
      currentTitle      = val.title      || '';
      currentTitleColor = val.titleColor || '';
      isAdmin           = val.isAdmin    || false;
      isChatMod         = val.isChatMod  || false;
      isMuted           = val.isMuted    || false;
      isChatMod         = val.isChatMod  || false;
      savedAvatarColor  = val.avatarColor || '';

      // كشف الترقي — نتجاهل أول تحميل (prevLevel === 1 والمستوى ما تغير)
      if (prevLevel > 1 && currentLevel > prevLevel) {
        if (typeof showLevelUpPopup === 'function') showLevelUpPopup(currentLevel);
        Sounds.play('levelUp'); Haptic.success();
        // مكافأة الترقي
        const rewards = [50,75,100,125,150,200,250,300,400,500];
        const bonus   = rewards[Math.min(currentLevel - 2, rewards.length - 1)] || 50;
        db.ref('users/' + user.uid + '/coins').transaction(c => (c || 0) + bonus);
      }

      // ابدأ نظام الإشعارات والشارات
      initBadges();
      if (typeof initNotificationBell === 'function') initNotificationBell();
      // أظهر زر الإعدادات
      const settingsBtn = document.getElementById('settings-btn');
      if (settingsBtn) settingsBtn.style.display = 'block';
      const searchBtn = document.getElementById('search-btn');
      if (searchBtn) searchBtn.style.display = 'block';
      const inboxBtn = document.getElementById('inbox-btn');
      if (inboxBtn) inboxBtn.style.display = 'block';
      const tournBtn = document.getElementById('tourn-btn');
      if (tournBtn) tournBtn.style.display = 'block';
      // مراقبة الرسائل غير المقروءة
      db.ref('conversations').orderByChild('participants/' + user.uid).equalTo(true)
        .on('value', snap => {
          let total = 0;
          snap.forEach(s => { total += (s.val().unread?.[user.uid] || 0); });
          const dot = document.getElementById('inbox-dot');
          if (dot) dot.style.display = total > 0 ? 'block' : 'none';
        });

      // تتبع الحضور أونلاين
      const connRef  = db.ref('.info/connected');
      const onlineRef = db.ref('online/' + user.uid);
      connRef.on('value', snap => {
        if (snap.val()) {
          onlineRef.set({ username: currentUsername, since: Date.now() });
          onlineRef.onDisconnect().remove();
        }
      });

      const quests      = val.quests     || {};
      questChat         = quests.chatProgress || 0;
      questFlip         = quests.flipProgress || 0;
      claimedChatQuest  = quests.chatClaimed  || false;
      claimedFlipQuest  = quests.flipClaimed  || false;

      // أظهر زر الإدارة في الشريط لو كان مشرفاً
      const adminBtn = document.getElementById('admin-sidebar-btn');
      if (adminBtn) adminBtn.style.display = isAdmin ? 'block' : 'none';

      // ابدأ المستمعين مرة واحدة فقط (config.js يتحكم في المنع)
      listenToGlobalChat();
      listenToPrivateMessages();
// ===== أعد رسم الصفحة النشطة حالياً فقط وبأمان =====
      const pages = ['home', 'chat', 'games', 'clan', 'store', 'leaderboard', 'inventory', 'admin-panel'];
      let pageRendered = false;

      for (const pid of pages) {
        const el = document.getElementById(pid);
        if (el && el.style.display !== 'none') {
          if (pid === 'home' && typeof renderHome === 'function') { renderHome(); pageRendered = true; }
          else if (pid === 'store' && typeof renderStore === 'function') { renderStore(); pageRendered = true; }
          else if (pid === 'games' && typeof renderGames === 'function') { renderGames(); pageRendered = true; }
          else if (pid === 'leaderboard' && typeof renderLeaderboard === 'function') { renderLeaderboard(); pageRendered = true; }
          else if (pid === 'inventory' && typeof renderInventory === 'function') { renderInventory(); pageRendered = true; }
          else if (pid === 'admin-panel' && typeof renderAdminPanelPage === 'function') { renderAdminPanelPage(); pageRendered = true; }
          else if (pid === 'chat' && typeof renderAdminChatPanel === 'function') { renderAdminChatPanel(); pageRendered = true; }
          break; // نكتفي بتحديث الصفحة الظاهرة فقط ونخرج من الحلقة
        }
      }

      // إذا لم تكن هناك أي صفحة نشطة مفتوحة (عند أول دخول مثلاً)، ارسم الرئيسية كخيار افتراضي
      if (!pageRendered && typeof renderHome === 'function') {
        renderHome();
      }
      // فحص الإنجازات
      if (typeof checkAchievements === 'function') checkAchievements(val);
      // فحص انتهاء VIP
      if (typeof checkVIPExpiry === 'function') checkVIPExpiry(val);
    });

  } else {
    // ❌ المستخدم غير مسجل — أظهر شاشة الدخول
    if (overlay) overlay.style.display = 'flex';

    // أوقف مستمعي Firebase عند تسجيل الخروج لمنع استهلاك البيانات
    if (chatListener)     { chatListener.off();     chatListener = null; }
    if (pmListener)       { pmListener.off();       pmListener   = null; }
    if (clanChatListener) { clanChatListener.off(); clanChatListener = null; }
    if (notifListener)    { notifListener.off();    notifListener = null; }
  }
});