const CACHE_NAME = 'kmap-solver-cache';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/kmap-interface.js',
  '/kmap-solver.js',
  '/info.md'
];

// Install service worker and cache all assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Error during cache.addAll():', error);
      })
  );
});

// Take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Network-first strategy with cache fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone the response and update cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone))
          .catch(error => console.error('Cache update failed:', error));

        return response;
      })
      .catch(() => {
        // Only use cache if network fails
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            console.error('No cached response for:', event.request.url);
            throw new Error('No cached version available');
          });
      })
  );
});
