const CACHE_NAME = 'monopoly-companion-v20';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'board.html',
  'style.css',
  'monopoly.js',
  'ui.js',
  'board_ui.js',
  'test.html',
  'manifest.json',
  'icon.svg',
  'templates/style.css'
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

// Fetch Event - Stale-While-Revalidate Strategy for local/font resources
self.addEventListener('fetch', event => {
  // Only intercept HTTP/HTTPS requests (avoid chrome-extension://, etc.)
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://fonts.googleapis.com') && 
      !event.request.url.startsWith('https://fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Offline/Network fail - ignore and fallback to cache
        });
        
        return cachedResponse || fetchPromise;
      });
    })
  );
});
