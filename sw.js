// sw.js
const CACHE_VERSION = 'legendary-umbrella-v4'; // ← bump this when you deploy
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './icon-512.png',
  './icon-192 (1).png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_VERSION ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkRes => {
        if (req.method === 'GET' && networkRes && networkRes.status === 200) {
          const copy = networkRes.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
        }
        return networkRes;
      }).catch(() => cached || Promise.reject('offline and not cached'));
      return cached || fetchPromise;
    })
  );
});
