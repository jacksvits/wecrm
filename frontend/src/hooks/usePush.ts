import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { markPushWorks, markPushMissing } from '../lib/appInstall';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function usePush() {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vapidKey, setVapidKey] = useState<string>('');

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(ok);
    if (!ok) {
      console.log('[Push] Not supported');
      return;
    }

    // Load VAPID key from backend API instead of hardcoded value
    fetch('/api/push/vapid-public-key')
      .then(r => r.json())
      .then(data => {
        if (data.publicKey) {
          setVapidKey(data.publicKey);
          console.log('[Push] VAPID key loaded from API');
        } else {
          throw new Error('Empty public key from API');
        }
      })
      .catch(err => {
        console.error('[Push] Failed to load VAPID key:', err);
        setError('Failed to load VAPID key');
      });

    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[Push] SW registered:', reg.scope);
        return reg.pushManager.getSubscription();
      })
      .then(sub => {
        console.log('[Push] Existing subscription:', !!sub);
        if (sub) markPushWorks(); // push-подписка живая → Google-сервисы есть
        setSubscribed(!!sub);
      })
      .catch(err => {
        console.error('[Push] SW registration failed:', err);
        setError('Service Worker registration failed: ' + err.message);
      });
  }, []);

  const subscribe = async () => {
    setError(null);
    if (!vapidKey) {
      setError('VAPID key not loaded yet');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      console.log('[Push] SW ready');

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      console.log('[Push] Subscribed:', sub.endpoint);

      const p256dh = arrayBufferToBase64(sub.getKey('p256dh'));
      const auth = arrayBufferToBase64(sub.getKey('auth'));
      console.log('[Push] Keys:', { p256dh: p256dh.slice(0, 10) + '...', auth: auth.slice(0, 10) + '...' });

      await api.push.subscribe({
        endpoint: sub.endpoint,
        keys: { p256dh, auth },
      });
      console.log('[Push] Saved to server');
      markPushWorks();
      setSubscribed(true);
    } catch (err: any) {
      console.error('[Push] Subscribe error:', err);
      // «push service error»/«unavailable» на Android = нет Google-сервисов (FCM)
      if (/push service|unavailable|network/i.test(err?.message || '')) markPushMissing();
      setError(err.message || 'Failed to subscribe');
    }
  };

  const unsubscribe = async () => {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.push.unsubscribe({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err: any) {
      console.error('[Push] Unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe');
    }
  };

  return { supported, subscribed, subscribe, unsubscribe, error };
}
