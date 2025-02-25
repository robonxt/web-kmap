const CACHE = 'kmap-solver-cache';
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'kmap-interface.js',
  'kmap-solver.js',
  'info.md',
  'manifest.json',
  'assets/icons/favicon.ico',
  'assets/icons/android-chrome-192.png',
  'assets/icons/android-chrome-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/mstile.png'
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
            const clone = r.clone();
            
            // If we have a cached version, compare it with the network version
            if (cached) {
              Promise.all([clone.text(), cached.text()]).then(([newContent, cachedContent]) => {
                if (newContent !== cachedContent) {
                  // Only notify PWA check page about updates
                  clients.matchAll().then(clients => {
                    clients.forEach(client => {
                      // Only send update message to the PWA check page
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
            
            caches.open(CACHE)
              .then(c => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
