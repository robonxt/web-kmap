const CACHE_NAME = 'kmap-solver-cache';

const ASSETS_TO_CACHE = [
  '.',
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
              .catch(error => console.error(`Failed to cache ${asset}:`, error))
          )
        );
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Handle navigation requests differently
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, {cache: "no-store"})
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request, {cache: "no-store"})
      .then(response => {
        // Validate the response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone)
              .catch(error => console.error('Cache put error:', error));
          })
          .catch(error => console.error('Cache open error:', error));

        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Return a more user-friendly offline response
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(
                '<html><body><h1>Offline</h1><p>This content is not available offline.</p></body></html>',
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
            
            return new Response('Offline - Content not available');
          });
      })
  );
});
