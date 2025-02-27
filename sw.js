const CACHE = 'kmap-solver-cache';
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'kmap-interface.js',
  'kmap-solver.js',
  'markdown.js',
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
      // Always try network first for HTML files to ensure latest version
      const isHtmlRequest = e.request.url.endsWith('.html') || e.request.url.endsWith('/');
      
      // Network-first approach for HTML files
      if (isHtmlRequest) {
        return fetch(e.request, {cache: 'no-store'})
          .then(response => {
            if (response && response.status === 200) {
              const clonedResponse = response.clone();
              caches.open(CACHE).then(cache => cache.put(e.request, clonedResponse));
            }
            return response;
          })
          .catch(() => cached || Response.error());
      }
      
      // Cache-first with background update for other assets
      const networked = fetch(e.request, {cache: 'no-store'})
        .then(response => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            
            // If we have a cached version, compare it with the network version
            if (cached) {
              Promise.all([clonedResponse.clone().text(), cached.clone().text()])
                .then(([newContent, cachedContent]) => {
                  if (newContent !== cachedContent) {
                    // Notify all clients about update
                    clients.matchAll().then(clients => {
                      clients.forEach(client => {
                        client.postMessage({ 
                          type: 'UPDATE_AVAILABLE',
                          url: e.request.url
                        });
                      });
                    });
                    
                    // Update the cache
                    caches.open(CACHE)
                      .then(cache => cache.put(e.request, clonedResponse.clone()));
                  }
                });
            } else {
              // If no cached version exists, just cache it
              caches.open(CACHE)
                .then(cache => cache.put(e.request, clonedResponse));
            }
          }
          return response;
        })
        .catch(() => cached);
        
      return cached || networked;
    })
  );
});
