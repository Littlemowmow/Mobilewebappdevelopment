const CACHE_NAME = 'weventr-v1';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for navigation requests (HTML routes) — critical for Vercel SPA rewrites
  // to work correctly on hard reloads and direct URL visits.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Network-first strategy for API/Supabase calls
  if (event.request.url.includes('/rest/') || event.request.url.includes('supabase')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
