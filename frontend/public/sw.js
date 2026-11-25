const CACHE_NAME = 'wecrm-v10';
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

  // Кэшируем и обрабатываем только same-origin запросы. Кросс-доменные
  // (метрика, чужие картинки в новостях, chrome-extension://) идут в сеть
  // напрямую без respondWith: Cache API для них падает с ошибками
  // и засоряет консоль («Cache put failed», «Both cache and network failed»)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Спекулятивный предзагрузчик Chrome (настройка «Предзагружать страницы», hover/paste) —
  // не перехватываем: браузер нередко обрывает такие запросы (AbortError в SW превращался
  // в фейковый пустой 404 и «Failed to load resource» в консоли). Реальный переход по
  // ссылке придёт отдельным запросом с mode: 'navigate' и пройдёт нормально.
  const purpose = (event.request.headers.get('Sec-Purpose') || event.request.headers.get('Purpose') || '').toLowerCase();
  if (purpose.includes('prefetch') || purpose.includes('prerender')) {
    return;
  }

  // API and uploads — always network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return;
  }

  // Все SPA-навигации (/, /chat, /tasks/123, ...) — always network first (NEVER cache):
  // иначе SW отдаёт из cache-first устаревший index.html со старым бандлом,
  // и новые роуты (/chat) «не открываются» до истечения кэша
  // Документные запросы: mode 'navigate' — обычные переходы, но Chrome присылает
  // prefetch/спекулятивный пререндер с destination 'document' / Accept: text/html
  // и mode != navigate — без этого они падали в «static files» и получали фейковый 404
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) return res;
          throw new Error('Network failed for navigation');
        })
        .catch(async () => {
          // ВАЖНО: respondWith не принимает undefined — иначе навигация
          // падает с «Failed to convert value to 'Response'» и вкладка
          // остаётся на «Загрузка…». Фолбэк — кэшированный index.html
          // (любой путь, т.к. SPA-роутинг разрулит внутри приложения).
          const cached = (await caches.match(event.request)) || (await caches.match('/index.html')) || (await caches.match('/'));
          if (cached) return cached;
          return new Response('Нет соединения с сервером. Проверьте интернет и обновите страницу.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
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
        .catch(async () => {
          // Тот же фолбэк: undefined в respondWith ломал загрузку страницы
          const cached = (await caches.match(event.request)) || (await caches.match('/index.html')) || (await caches.match('/'));
          if (cached) return cached;
          return new Response('Нет соединения с сервером. Проверьте интернет и обновите страницу.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
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
    // Документ без сети и кэша — отдаём кэш SPA
    if ((request.headers.get('accept') || '').includes('text/html') || request.destination === 'document' || request.mode === 'navigate') {
      const idx = (await caches.match('/index.html')) || (await caches.match('/'));
      if (idx) return idx;
      return new Response('Нет соединения с сервером. Проверьте интернет и обновите страницу.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    // Не подменяем сбой фейковым 404 (ложный «Failed to load resource» в консоли страницы)
    console.debug('[SW] asset failed (offline/blocked):', request.url);
    return Response.error();
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
    // Документ без сети и кэша — отдаём кэш SPA
    if ((request.headers.get('accept') || '').includes('text/html') || request.destination === 'document' || request.mode === 'navigate') {
      const cached = (await caches.match('/index.html')) || (await caches.match('/'));
      if (cached) return cached;
      return new Response('Нет соединения с сервером. Проверьте интернет и обновите страницу.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    // Не подменяем сбой (offline/блокировщик/abort) фейковым 404 — в консоли страницы
    // иначе появляется ложный «Failed to load resource: 404». Честная сетевая ошибка.
    console.debug('[SW] request failed (offline/blocked):', request.url);
    return Response.error();
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
