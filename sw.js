const CACHE_NAME = 'dlbc-roster-v3';
const urlsToCache = ['./', './index.html', './app.js', './schedules.js', './manifest.json', './pastor.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).then(r => { 
    const rc = r.clone(); 
    caches.open(CACHE_NAME).then(c => c.put(e.request, rc)); 
    return r; 
  }).catch(() => caches.match(e.request)));
});
