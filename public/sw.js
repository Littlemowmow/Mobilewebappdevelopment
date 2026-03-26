// Self-destruct: unregister this service worker and clear all caches
// This fixes the white screen caused by cached stale content
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
  // Unregister self
  self.registration.unregister();
});
