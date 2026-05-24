var CACHE_NAME = 'minesweeper-v1';
var ASSETS = [
    './',
    './index.html',
    './css/main.css',
    './css/board.css',
    './css/themes.css',
    './css/responsive.css',
    './js/namespace.js',
    './js/config.js',
    './js/engine.js',
    './js/sound.js',
    './js/storage.js',
    './js/timer.js',
    './js/renderer.js',
    './js/input.js',
    './js/endless.js',
    './js/achievements.js',
    './js/stats.js',
    './js/themes.js',
    './js/app.js',
    './manifest.json'
];

// Install: pre-cache all assets
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate: clean old caches
self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        })
    );
});

// Fetch: cache-first, fallback to network
self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            return cached || fetch(e.request);
        })
    );
});
