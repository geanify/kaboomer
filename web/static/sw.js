const CACHE_NAME = 'kaboomer-v1';
const urlsToCache = [
  '/',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Network first for API, Cache first for static assets
  if (event.request.url.includes('/api/')) {
      event.respondWith(fetch(event.request));
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});


