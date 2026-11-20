const CACHE = 'ot-calc-en-test-v17';
const FILES = ['./', './index.html', './app.js', './engine.js', './holidays.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './forms/gen35-front.png', './forms/gen35-back.png', './forms/gen35a-1.png', './forms/gen35a-2.png', './fonts/FreeSerif-si.woff', './fonts/FreeSerifBold-si.woff', './i18n.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((r) => {
        if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('./'))));
});
