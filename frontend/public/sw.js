const CACHE_NAME = 'wecrm-v3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.error('[SW] Install cache failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // API and uploads — always network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return;
  }

  // index.html — always network first (NEVER cache)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.ok) return res;
          throw new Error('Network failed for index.html');
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets (JS/CSS from Vite) — network first with cache fallback
  if (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(networkFirstWithCacheFallback(event.request));
    return;
  }

  // Other static files — cache first
  event.respondWith(cacheFirstWithNetworkFallback(event.request));
});

async function networkFirstWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      try {
        const clone = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, clone);
      } catch (e) {
        console.warn('[SW] Cache put failed:', e.message);
      }
      return networkResponse;
    }
    throw new Error('Network response not ok: ' + networkResponse.status);
  } catch (err) {
    console.warn('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;
    console.error('[SW] No cache fallback for:', request.url);
    throw err;
  }
}

async function cacheFirstWithNetworkFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      try {
        const clone = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, clone);
      } catch (e) {
        console.warn('[SW] Cache put failed:', e.message);
      }
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (err) {
    console.error('[SW] Both cache and network failed:', request.url);
    throw err;
  }
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'WeCRM', {
      body: data.body || '',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.url || 'default',
      data: { url: data.url || '/' },
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client)
            return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});


// Handle subscription change (browser rotates keys)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Subscription changed, re-subscribing...');
  event.waitUntil(
    fetch('/api/push/vapid-public-key')
      .then(r => r.json())
      .then(data => {
        if (!data.publicKey) throw new Error('No VAPID key available');
        const padding = '='.repeat((4 - (data.publicKey.length % 4)) % 4);
        const base64 = (data.publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = self.atob(base64);
        const key = Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
      })
      .then((newSubscription) => {
        const p256dh = self.btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey('p256dh'))));
        const auth = self.btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey('auth'))));
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: newSubscription.endpoint,
            keys: { p256dh, auth },
          }),
        });
      })
      .then(() => console.log('[SW] Re-subscribed successfully'))
      .catch(err => console.error('[SW] Re-subscribe failed:', err))
  );
});
