// Bounty Bear Service Worker - Enables offline PWA support
const CACHE_NAME = 'bounty-bear-v3';
const urlsToCache = [
  '/web-demo/bounty-bear.html',
  '/web-demo/prophecy.html',
  '/web-demo/index.html',
  '/manifest.json'
];

// Install event - cache assets and activate immediately
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate new SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Bounty Bear: Caching assets');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - NETWORK FIRST, fallback to cache for offline
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update the cache with the fresh response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        // Network failed - serve from cache (offline mode)
        return caches.match(event.request);
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
