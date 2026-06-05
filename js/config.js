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
let currentUsername   = "لاعب";
let currentLevel      = 1;
let currentCoins      = 0;
let currentXP         = 0;
let isVIP             = false;
let currentClan       = "";
let currentClanId     = "";
let currentTitle      = "";
let currentTitleColor = "";
let isAdmin           = false;
let isChatMod         = false;
let isMuted           = false;

// ===== متغيرات المهام اليومية =====
let questChat        = 0;
let questFlip        = 0;
let claimedChatQuest = false;
let claimedFlipQuest = false;

// ===== متغيرات المستمعين (لمنع تكرار الرسائل) =====
let chatListener     = null;
let pmListener       = null;
let clanChatListener = null;
let notifListener    = null;

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
    if (btn.dataset.section === id) btn.setAttribute('data-active', 'true');
  });

  if (id === 'chat') {
    if (typeof triggerMarquee       === 'function') triggerMarquee("القوانين تطبق على الجميع!");
    if (typeof listenToGlobalChat   === 'function') listenToGlobalChat();
    if (typeof renderAdminChatPanel === 'function') renderAdminChatPanel();
  }
  if (id === 'home')        { if (typeof renderHome          === 'function') renderHome();          }
  if (id === 'store')       { if (typeof renderStore         === 'function') renderStore();         }
  if (id === 'games')       { if (typeof renderGames         === 'function') renderGames();         }
  if (id === 'clan')        { if (typeof renderClan          === 'function') renderClan();          }
  if (id === 'leaderboard') { if (typeof renderLeaderboard   === 'function') renderLeaderboard();   }
  if (id === 'inventory')   { if (typeof renderInventory     === 'function') renderInventory();     }
  if (id === 'admin-panel') { if (typeof renderAdminPanelPage === 'function') renderAdminPanelPage(); }
}
