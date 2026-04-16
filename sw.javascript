// اسم ذاكرة التخزين المؤقت (يمكنك تغييره عند تحديث التطبيق)
const CACHE_NAME = 'sims-v1';

// قائمة الملفات الأساسية التي يجب تخزينها مؤقتاً
const urlsToCache = [
  '/SIMS_app/',
  '/SIMS_app/index.html',
  '/SIMS_app/style.css',
  '/SIMS_app/script.js',
  '/SIMS_app/manifest.json',
  // إذا وضعت أيقوناتك في مجلد icons، أضف المسار الصحيح هنا
  // '/SIMS_app/icons/icon-192x192.png',
  // '/SIMS_app/icons/icon-512x512.png'
];

// 1. تثبيت Service Worker وتخزين الملفات مؤقتاً
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تم فتح ذاكرة التخزين المؤقت');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('خطأ في التخزين المؤقت:', err))
  );
  // تفعيل Service Worker فوراً دون انتظار إعادة تحميل الصفحة
  self.skipWaiting();
});

// 2. اعتراض طلبات الشبكة وتقديم النسخة المخزنة مؤقتاً أولاً (استراتيجية Cache First)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجد الملف في الذاكرة المؤقتة، قدمه فوراً
        if (response) {
          return response;
        }
        // وإلا، انتقل إلى الشبكة لتحميله
        return fetch(event.request).then(
          networkResponse => {
            // اختياري: خزن الملف الجديد مؤقتاً للاستخدام المستقبلي
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          }
        ).catch(() => {
          // في حالة عدم وجود اتصال ولا ملف مخزن، يمكن إظهار صفحة Offline مخصصة
          // return caches.match('/SIMS_app/offline.html');
        });
      })
  );
});

// 3. تنشيط Service Worker وحذف الإصدارات القديمة من الذاكرة المؤقتة
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // السيطرة على جميع الصفحات المفتوحة فوراً
);