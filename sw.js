// BloodLink Pro — Service Worker v2 (Phase 12: Performance)
const CACHE = 'blp-v3';
const OFFLINE_URL = 'offline.html';
const ASSETS = [
  'index.html', 'search.html', 'donor.html', 'login.html',
  'register.html', 'banks.html', 'dashboard.html', 'about.html',
  'pricing.html', 'emergency.html', 'profile.html',
  'style.css', 'script.js', 'offline.html', 'manifest.json',
  'firebase-config.js', 'firebase-db.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS.map(function(u){try{return new Request(u);}catch(x){return null;}}).filter(Boolean)); }).catch(function(){})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function(res) {
      var clone = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
      return res;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match(OFFLINE_URL);
      });
    })
  );
});
