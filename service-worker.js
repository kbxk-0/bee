// ============================================================
//  Service Worker — bee
//  يخلّي التطبيق يشتغل offline ويحفظ الملفات محلياً
// ============================================================

const CACHE_NAME = 'tadakhul-v1';

// الملفات اللي نحفظها في الكاش (تغير اسم الـ HTML لو غير الاسم)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700;900&display=swap',
  // Firebase SDKs
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js',
];

// ===== INSTALL: حفظ الملفات الأساسية =====
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      // نحفظ كل ملف بشكل منفصل حتى لو فشل واحد ما يوقف الباقي
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('[SW] Could not cache:', url, err.message);
        }))
      );
    }).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE: حذف الكاشات القديمة =====
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ===== FETCH: استراتيجية Network First مع Fallback للكاش =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // تجاهل طلبات Firebase (الداتا دايماً من الشبكة)
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('firebaseio') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebasestorage')) {
    return; // اتركها تمشي عادي بدون تدخل
  }

  // بالنسبة لباقي الطلبات: حاول من الشبكة أولاً، وإلا رجع الكاش
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // لو الطلب نجح، حدّث الكاش
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // الشبكة فاشلة؟ رجّع من الكاش
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // لو ما فيه كاش، رجّع صفحة الـ index
          return caches.match('/index.html');
        });
      })
  );
});

// ===== PUSH NOTIFICATIONS (جاهز للمستقبل) =====
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'إشعار جديد', body: '' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'ar'
    })
  );
});
