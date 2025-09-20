// sw.js — force refresh of cached files
const CACHE = 'cge-weather-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin === location.origin) {
    event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
  }
});
