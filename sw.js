'use strict';

// Offline support for the published site. scripts/stage.cjs fills in VERSION (a hash of the
// site's files) when it builds _site/; the source pages never register it, so local
// development is never served from a cache.
//
// Nothing is downloaded up front. Each page, once it has loaded, tells the worker which
// files it used (js/main.js) and the worker keeps copies of those, which the browser
// usually still holds in its HTTP cache. So a first visit costs no more than the page
// itself, and every page a visitor has opened works offline afterwards.
//
// Network first, always: script and style names carry no content hash, so serving them from
// a cache while the HTML comes fresh could mix two deploys. The cache answers only when the
// network does not, which is exactly the offline case.
const VERSION = 'dev';
const CACHE = 'tmhs-' + VERSION;
const SCOPE = new URL(self.registration.scope).pathname;
const inScope = (url) => url.origin === location.origin && url.pathname.startsWith(SCOPE);

self.addEventListener('install', () => self.skipWaiting());

// A new deploy: re-fetch what the visitor had kept from the previous one, so offline copies
// always come from a single deploy, then drop the old cache
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter((k) => k.startsWith('tmhs-') && k !== CACHE);
    const cache = await caches.open(CACHE);
    for (const name of old) {
      const keys = await (await caches.open(name)).keys();
      await Promise.all(keys.map((req) => cache.add(req.url).catch(() => {})));
      await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

// "Keep what this page used": its own address (without any ?tool= numbers) and its files
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'tmhs:keep' || !Array.isArray(event.data.urls)) return;
  const urls = [...new Set(event.data.urls.map((u) => {
    try {
      const url = new URL(u, location.href);
      url.search = '';
      url.hash = '';
      return inScope(url) ? url.href : null;
    } catch {
      return null;
    }
  }).filter(Boolean))];
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(urls.map(async (url) => {
    if (!(await cache.match(url))) await cache.add(url).catch(() => {});
  }))));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !inScope(url)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      // Keep copies current, for files already kept (not one copy per shared link)
      if (response.ok && !url.search) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(async (cache) => { if (await cache.match(request)) await cache.put(request, copy); }));
      }
      return response;
    } catch (error) {
      // Offline: a shared link opens the kept page, which reads its numbers from the URL
      const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
      if (cached) return cached;
      throw error;
    }
  })());
});
