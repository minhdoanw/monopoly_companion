const CACHE_NAME = 'monopoly-companion-v9';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'board.html',
  'style.css',
  'monopoly.js',
  'test.html',
  'manifest.json',
  'icon.svg'
];

// Install Event - Pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching App Shell and Assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve from Cache, Fallback to Network
self.addEventListener('fetch', event => {
  // Only intercept HTTP/HTTPS requests (avoid chrome-extension://, etc.)
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('https://fonts.googleapis.com') && !event.request.url.startsWith('https://fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache immediately
          return cachedResponse;
        }

        // Otherwise fetch from network and cache
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              // Return response directly if invalid/external
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Offline failure case
            console.warn('[Service Worker] Network request failed and no cache hit.');
          });
      })
  );
});
