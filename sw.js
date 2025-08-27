const CACHE = 'kmap-solver-cache';
const ASSETS = [
  '.',
  './assets/icon/android-chrome-192.png',
  './assets/icon/android-chrome-512.png',
  './assets/icon/apple-touch-icon.png',
  './assets/icon/favicon.ico',
  './assets/icon/favicon.svg',
  './assets/icon/icon-close.svg',
  './assets/icon/icon-menu.svg',
  './assets/icon/icon-hide-zeros.svg',
  './assets/icon/icon-sun.svg',
  './assets/icon/icon-moon.svg',
  './assets/icon/icon-info.svg',
  './assets/icon/icon-copy.svg',
  './assets/icon/icon-layout-diagonal-a.svg',
  './assets/icon/icon-layout-diagonal-b.svg',
  './assets/icon/icon-check.svg',
  './assets/icon/icon-refresh.svg',
  './assets/icon/icon-trash.svg',
  './assets/icon/icon-settings.svg',
  './assets/icon/mstile.png',
  './index.html',
  './kmap-interface.js',
  './kmap-solver.js',
  './manifest.json',
  './styles.css',
  './sw.js'
];

// Install event: Triggered when the service worker is installed
// This caches all the assets defined in the ASSETS array
self.addEventListener('install', e => {
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();
  // Wait until all assets are cached before completing installation
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(a => c.add(new Request(a))))));
});

// Activate event: Triggered when the service worker is activated
// This cleans up any old caches from previous service worker versions
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete any cache that doesn't match our current cache name
          if (cacheName !== CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    // Take control of all clients/pages under this service worker's scope
    }).then(() => clients.claim())
  );
});

// Fetch event: Triggered when the browser makes a network request
// This implements a cache-first strategy with network update
self.addEventListener('fetch', e => {
  // Only handle GET requests with http/https protocols
  if (e.request.method !== 'GET' || !['http:', 'https:'].includes(new URL(e.request.url).protocol)) return;
  
  e.respondWith(
    // Check if the request is in our cache
    caches.match(e.request).then(cached => {
      // Make a network request regardless of cache status
      const networked = fetch(e.request, {cache: 'no-store'})
        .then(r => {
          if (r && r.status === 200) {
            // Clone the response to cache it (streams can only be consumed once)
            const cacheClone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, cacheClone));

            // If we have a cached version, compare it with new version
            if (cached) {
              const compareClone = r.clone();
              const cachedClone = cached.clone();
              // Compare the text content of both responses
              Promise.all([compareClone.text(), cachedClone.text()]).then(([newContent, cachedContent]) => {
                // If content has changed, notify clients on the pwa-check page
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
        // If network request fails, fall back to cached version
        .catch(() => cached);
      
      // Return cached response immediately if available, otherwise wait for network
      return cached || networked;
    })
  );
});
