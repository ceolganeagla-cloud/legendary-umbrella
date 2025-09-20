const CACHE = 'cge-weather-v11';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.mode === 'navigate' ||
      (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r;
    }).catch(() => caches.match(req)));
  } else {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(r => {
        const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r;
      }))
    );
  }
});
