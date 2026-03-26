// Bounty Bear Service Worker - Enables offline PWA support
const CACHE_NAME = 'bounty-bear-v1';
const urlsToCache = [
  '/web-demo/bounty-bear.html',
  '/web-demo/prophecy.html',
  '/web-demo/index.html',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Bounty Bear: Caching assets');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Bounty Bear: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
