// ============================================================
//  js/config.js — bee platform
//  إعدادات Firebase + المتغيرات العامة للتطبيق
//  هذا الملف يُحمَّل أولاً قبل أي ملف آخر
// ============================================================

// ===== إعدادات Firebase =====
const firebaseConfig = {
  apiKey:            "AIzaSyAL5WoxOv0aVh9knoUEVduVt6E5IPmADos",
  authDomain:        "zero-reality.firebaseapp.com",
  databaseURL:       "https://zero-reality-default-rtdb.firebaseio.com",
  projectId:         "zero-reality",
  storageBucket:     "zero-reality.firebasestorage.app",
  messagingSenderId: "238024144517",
  appId:             "1:238024144517:web:1b75964bb68b424b4ddbec",
  measurementId:     "G-VKW4FR2ZTT"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.database();

// ===== متغيرات حالة المستخدم الحالي =====
// كل هذه القيم تُحدَّث تلقائياً عند تسجيل الدخول (في auth.js)
let currentUsername   = "لاعب";
let currentLevel      = 1;
let currentCoins      = 0;
let currentXP         = 0;
let isVIP             = false;
let currentClan       = "";
let currentTitle      = "";
let currentTitleColor = "";
let isAdmin           = false;
let isMuted           = false;

// ===== متغيرات المهام اليومية =====
let questChat        = 0;
let questFlip        = 0;
let claimedChatQuest = false;
let claimedFlipQuest = false;

// ===== متغيرات المستمعين (لمنع تكرار الرسائل) =====
// نحفظ كل مستمع في متغير — لو المتغير مش null معناه المستمع شغّال
let chatListener     = null;   // مستمع الشات العام
let pmListener       = null;   // مستمع الرسائل الخاصة
let clanChatListener = null;   // مستمع شات الكلان

// ===== دالة مساعدة: تنظيف النصوص من HTML للحماية من الهجمات =====
function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    "'": '&#39;',  '"': '&quot;'
  }[tag] || tag));
}

// ===== دالة التنقل بين الصفحات =====
function showSection(id) {
  document.querySelectorAll('.page').forEach(p => { p.style.display = 'none'; });
  const target = document.getElementById(id);
  if (target) target.style.display = id === 'chat' ? 'flex' : 'block';

  document.querySelectorAll('#navbar button').forEach(btn => {
    btn.removeAttribute('data-active');
    if (btn.dataset.section === id) btn.setAttribute('data-active','true');
  });

  if (id === 'chat')        { triggerMarquee("القوانين تطبق على الجميع!"); listenToGlobalChat(); renderAdminChatPanel(); }
  if (id === 'store')       renderStore();
  if (id === 'home')        renderHome();
  if (id === 'games')       renderGames();
  if (id === 'clan')        renderClan();
  if (id === 'leaderboard') renderLeaderboard();
  if (id === 'inventory')   renderInventory();
  if (id === 'admin-panel') renderAdminPanelPage();
}
