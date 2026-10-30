const CACHE_NAME = 'filosofia-cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('filosofia-cache-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache API, Firebase, authentication, or non-GET requests.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isPage = request.mode === 'navigate';
  const isStaticAsset = /\.(?:css|js|mjs|woff2?|ttf|otf|png|jpe?g|gif|webp|svg|ico)$/i.test(url.pathname);
  if (!isPage && !isStaticAsset) return;

  const updatePromise = caches.open(CACHE_NAME).then(cache =>
    fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
  );
  event.waitUntil(updatePromise.then(() => {}, () => {}));

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      return await updatePromise;
    } catch (error) {
      if (isPage) {
        const fallback = await cache.match('./');
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
