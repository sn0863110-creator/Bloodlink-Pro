// BloodLink Pro — Service Worker v1
const CACHE = 'blp-v1';
const OFFLINE_URL = 'offline.html';
const ASSETS = [
  '/BloodLink-Pro/',
  '/BloodLink-Pro/index.html',
  '/BloodLink-Pro/search.html',
  '/BloodLink-Pro/donor.html',
  '/BloodLink-Pro/login.html',
  '/BloodLink-Pro/register.html',
  '/BloodLink-Pro/banks.html',
  '/BloodLink-Pro/dashboard.html',
  '/BloodLink-Pro/about.html',
  '/BloodLink-Pro/pricing.html',
  '/BloodLink-Pro/style.css',
  '/BloodLink-Pro/script.js',
  '/BloodLink-Pro/offline.html'
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
