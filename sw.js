const CACHE = 'kmap-solver-cache';
const ASSETS = ['.','index.html','styles.css','kmap-interface.js','kmap-solver.js','info.md'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(a => c.add(new Request(a))))));
});

self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !['http:', 'https:'].includes(new URL(e.request.url).protocol)) return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networked = fetch(e.request, {cache: 'no-store'})
        .then(r => {
          if (r && r.status === 200) {
            const clone = r.clone();
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
