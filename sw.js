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

  event.respondWith(
    fetch(event.request)
      .then(response => {
        console.log('using network');
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              console.log('using cache');
              return response;
            }
            return new Response('Offline - Content not available');
          });
      })
  );
});
