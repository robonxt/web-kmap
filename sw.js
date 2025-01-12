if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .catch(error => console.error('Service Worker registration failed:', error));
    });
}

const CACHE_NAME = 'kmap-solver-cache';

const ASSETS_TO_CACHE = [
  '',
  'index.html',
  'styles.css',
  'kmap-interface.js',
  'kmap-solver.js',
  'info.md'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(
          ASSETS_TO_CACHE.map(asset => 
            cache.add(new Request(asset))
          )
        );
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Only handle http and https requests
  const url = new URL(event.request.url);
  if (!['http:', 'https:'].includes(url.protocol)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the fresh response
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        // Offline fallback - use cached response
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no cache found, return a basic offline page or error
            return new Response('Offline - Content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
