const CACHE = 'kmap-solver-cache';
const ASSETS = [
  '.',
  './assets/icons/android-chrome-192.png',
  './assets/icons/android-chrome-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.ico',
  './assets/icons/favicon.svg',
  './assets/icons/mstile.png',
  './index.html',
  './kmap-interface.js',
  './kmap-solver.js',
  './manifest.json',
  './pwa-check.html',
  './styles.css',
  './sw.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(a => c.add(new Request(a))))));
});

self.addEventListener('activate', e => {
  // Clean up old caches
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !['http:', 'https:'].includes(new URL(e.request.url).protocol)) return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networked = fetch(e.request, {cache: 'no-store'})
        .then(r => {
          if (r && r.status === 200) {
            // Create a clone for caching
            const cacheClone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, cacheClone));

            // Create another clone for comparison
            if (cached) {
              const compareClone = r.clone();
              const cachedClone = cached.clone();
              Promise.all([compareClone.text(), cachedClone.text()]).then(([newContent, cachedContent]) => {
                if (newContent !== cachedContent && clients) {
                  clients.matchAll().then(clients => {
                    clients.forEach(client => {
                      if (client.url.includes('pwa-check.html')) {
                        client.postMessage({ 
                          type: 'UPDATE_AVAILABLE',
                          url: e.request.url
                        });
                      }
                    });
                  });
                }
              });
            }
          }
          return r;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
