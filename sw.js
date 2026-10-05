'use strict';

// Offline support for the published site. scripts/stage.cjs fills in VERSION (a hash of the
// files) and PRECACHE (every page, script, style, font and icon) when it builds _site/; the
// source pages never register it, so local development is never served from a cache.
//
// Network first, always: script and style names carry no content hash, so serving them from
// a cache while the HTML comes fresh could mix two deploys. The cache only answers when the
// network does not, which is exactly the offline case.
const VERSION = 'dev';
const PRECACHE = [];
const CACHE = 'tmhs-' + VERSION;
const SCOPE = new URL(self.registration.scope).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tmhs-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(SCOPE)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      // Keep the cache current, but not one copy per shared link (?tool=...)
      if (response.ok && !url.search) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
      }
      return response;
    } catch (error) {
      // Offline: a shared link opens the cached page, which reads its numbers from the URL
      const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
      if (cached) return cached;
      throw error;
    }
  })());
});
