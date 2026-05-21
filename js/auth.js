// ============================================================
//  js/auth.js — bee platform
//  تسجيل الدخول، إنشاء حساب، ومراقبة حالة المستخدم
//  هذا الملف يُحمَّل آخراً لأنه يعتمد على كل الملفات الأخرى
// ============================================================

// ===== تسجيل الدخول =====
async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;

  if (!email || !pass) { alert("يرجى تعبئة البريد وكلمة المرور"); return; }

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
    alert(errors[err.code] || 'خطأ: ' + err.message);
  }
}

// ===== إنشاء حساب جديد =====
async function doRegister() {
  const email    = document.getElementById('l-email').value.trim();
  const pass     = document.getElementById('l-pass').value;
  const username = document.getElementById('l-username')?.value.trim();

  if (!email || !pass) { alert("يرجى تعبئة جميع الحقول"); return; }
  if (pass.length < 6) { alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
  if (username && (username.length < 3 || username.length > 15)) {
    alert("اسم المستخدم بين 3 و15 حرفاً"); return;
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
    alert(`مرحباً ${name}! تم إنشاء حسابك وحصلت على 100 🪙 هدية ترحيبية!`);
  } catch (err) {
    const errors = {
      'auth/email-already-in-use': 'هذا البريد مسجل بالفعل',
      'auth/invalid-email':        'البريد الإلكتروني غير صحيح',
      'auth/weak-password':        'كلمة المرور ضعيفة جداً'
    };
    alert(errors[err.code] || 'خطأ: ' + err.message);
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
}

// ===== مراقبة حالة تسجيل الدخول =====
// هذه الدالة تُشغَّل تلقائياً عند:
//   - فتح التطبيق (لو كان المستخدم مسجلاً)
//   - تسجيل الدخول
//   - تسجيل الخروج
auth.onAuthStateChanged((user) => {
  const overlay = document.getElementById('auth-overlay');

  if (user) {
    if (overlay) overlay.style.display = 'none';

    // اشترك في تغييرات بيانات المستخدم في real-time
    db.ref('users/' + user.uid).on('value', (snapshot) => {
      const val = snapshot.val() || {};

      // تحديث المتغيرات العامة
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
      isMuted           = val.isMuted    || false;
      savedAvatarColor  = val.avatarColor || '';

      // ابدأ نظام الإشعارات والشارات
      initBadges();

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

      // أعد رسم الصفحة الحالية
      const pages = ['home','chat','games','clan','store','leaderboard','inventory','admin-panel'];
      for (const pid of pages) {
        const el = document.getElementById(pid);
        if (el && el.style.display !== 'none') {
          if (pid === 'home')        renderHome();
          if (pid === 'store')       renderStore();
          if (pid === 'games')       renderGames();
          if (pid === 'leaderboard') renderLeaderboard();
          if (pid === 'inventory')   renderInventory();
          if (pid === 'admin-panel') renderAdminPanelPage();
          if (pid === 'chat')        renderAdminChatPanel();
          break;
        }
      }
      renderHome();
    });

  } else {
    // ❌ المستخدم غير مسجل — أظهر شاشة الدخول
    if (overlay) overlay.style.display = 'flex';

    // أوقف المستمعين عند الخروج
    if (chatListener)     { chatListener.off();     chatListener = null; }
    if (pmListener)       { pmListener.off();       pmListener   = null; }
    if (clanChatListener) { clanChatListener.off(); clanChatListener = null; }
    if (notifListener)    { notifListener.off();    notifListener = null; }
    if (overlay) overlay.style.display = 'flex';
  }
});
