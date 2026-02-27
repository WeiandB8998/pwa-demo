// ==========================================
// SERVICE WORKER - Handles caching and offline support
// ==========================================

const CACHE_NAME = 'pwa-demo-cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/images/icon-192.png',
    '/images/icon-512.png'
];

// ==========================================
// INSTALL EVENT - Cache resources
// ==========================================
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Caching app shell and assets');
            return cache.addAll(urlsToCache).catch((error) => {
                console.warn('⚠️ Some resources failed to cache (this is okay):', error);
                // Continue even if some resources fail to cache
                return cache.addAll(urlsToCache.filter(url => 
                    !url.includes('icon') && url !== 'images/icon-512.png'
                ));
            });
        })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// ==========================================
// ACTIVATE EVENT - Clean up old caches
// ==========================================
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim all clients immediately
    self.clients.claim();
});

// ==========================================
// FETCH EVENT - Serve from cache, fallback to network
// ==========================================
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response if available
            if (response) {
                console.log('📦 Serving from cache:', event.request.url);
                return response;
            }

            // Otherwise fetch from network
            return fetch(event.request).then((response) => {
                // Don't cache if not a success response
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clone the response for caching
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch((error) => {
                console.log('❌ Network request failed, serving offline page:', error);
                // Return cached version or offline page
                return caches.match(event.request) || 
                    caches.match('/') ||
                    new Response('Offline - please check your connection', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    });
            });
        })
    );
});

// ==========================================
// MESSAGE EVENT - Handle messages from the app
// ==========================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        console.log('📲 Showing notification from message');
        self.registration.showNotification(event.data.title, event.data.options);
    }
});

// ==========================================
// NOTIFICATION CLICK EVENT
// ==========================================
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notification clicked:', event.action);
    event.notification.close();

    // Handle action buttons
    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // If app window exists, focus it
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// ==========================================
// NOTIFICATION CLOSE EVENT
// ==========================================
self.addEventListener('notificationclose', (event) => {
    console.log('✖️ Notification closed');
});

console.log('✅ Service Worker script loaded');
