const CACHE_NAME = 'wecrm-v8';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icq-message.mp3',
  // Примечание: /splash.mp4 намеренно НЕ кешируется в SW — медиа-запросы с Range
  // некорректно обрабатываются Cache API в iOS Safari. Видео кешируется nginx (1 неделя).
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

  // Все SPA-навигации (/, /chat, /tasks/123, ...) — always network first (NEVER cache):
  // иначе SW отдаёт из cache-first устаревший index.html со старым бандлом,
  // и новые роуты (/chat) «не открываются» до истечения кэша
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) return res;
          throw new Error('Network failed for navigation');
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // index.html — always network first (NEVER cache)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) return res;
          throw new Error('Network failed for index.html');
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Splash video — обходим SW: video-элемент использует Range-запросы,
  // которые ломаются при отдаче полного ответа из Cache API (iOS Safari).
  // Кешированием занимается nginx (Cache-Control: public, max-age=604800).
  if (url.pathname === '/splash.mp4') {
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
    if (networkResponse && networkResponse.status === 200) {
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
    // Return empty fallback response to avoid "Failed to convert value to 'Response'"
    return new Response(null, { status: 404, statusText: 'Not Found' });
  }
}

async function cacheFirstWithNetworkFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
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
    // Return empty fallback response to avoid "Failed to convert value to 'Response'"
    return new Response(null, { status: 404, statusText: 'Not Found' });
  }
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  // Входящий аудио/видеозвонок: системное уведомление с кнопками действий.
  // WebRTC нельзя поднять из SW — кнопки открывают CRM (?call=<id> для
  // автопринятия, ?call=<id>&reject=1 для отклонения), звонок подхватывает
  // CallContext (уровень 1; полный ответ с экрана блокировки — нативный
  // Capacitor-клиент, уровень 2).
  if (data.kind === 'incoming-call' && data.callId) {
    event.waitUntil(
      self.registration.showNotification(data.title || 'Входящий звонок', {
        body: data.body || '',
        icon: data.icon || '/icon-192x192.png',
        badge: data.icon || '/icon-192x192.png',
        tag: 'call-' + data.callId,
        data: { kind: 'incoming-call', callId: data.callId },
        requireInteraction: true,
        renotify: true,
        silent: false,
        actions: [
          { action: 'accept', title: 'Принять' },
          { action: 'reject', title: 'Отклонить' },
        ],
      })
    );
    return;
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'WeCRM', {
      body: data.body || '',
      icon: data.icon || '/icon-192x192.png',
      badge: data.icon || '/icon-192x192.png',
      tag: data.url || 'default',
      data: { url: data.url || '/' },
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const nd = event.notification.data || {};
  // Клик по уведомлению о звонке: открываем CRM — CallContext сам ответит
  // на звонок (accept) или отклонит его (reject) по параметрам URL
  if (nd.kind === 'incoming-call' && nd.callId) {
    const url = event.action === 'reject'
      ? '/?call=' + encodeURIComponent(nd.callId) + '&reject=1'
      : '/?call=' + encodeURIComponent(nd.callId);
    event.waitUntil(openOrFocus(url));
    return;
  }
  const url = nd.url || '/';
  event.waitUntil(openOrFocus(url));
});

// Фокус существующей вкладки CRM с нужным URL или открытие новой
async function openOrFocus(url) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientList) {
    if (client.url.includes(url) && 'focus' in client) return client.focus();
  }
  if (self.clients.openWindow) return self.clients.openWindow(url);
}


// Handle subscription change (browser rotates keys / инвалидация при смене SW
// — фикс Safari, где пуши молча переставали отображаться после деплоя нового
// sw.js). Из SW нельзя достать JWT (localStorage недоступен), поэтому просим
// открытые вкладки CRM переподписаться — у них есть токен. Если вкладок нет,
// переподписка произойдёт при следующем открытии приложения (PushSubscriber
// проверяет подписку на загрузке и слушает это же сообщение).
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Subscription changed, asking clients to re-subscribe...');
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: 'wecrm-resubscribe' });
        }
        console.log('[SW] Re-subscribe request sent to', clientList.length, 'clients');
      })
      .catch((err) => console.error('[SW] Re-subscribe request failed:', err))
  );
});
