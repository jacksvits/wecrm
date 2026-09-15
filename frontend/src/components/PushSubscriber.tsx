import { useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { markPushWorks, markPushMissing } from '../lib/appInstall'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

function arrayBufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

async function saveSubscription(sub: PushSubscription) {
  const p256dh = arrayBufferToBase64(sub.getKey('p256dh'))
  const auth = arrayBufferToBase64(sub.getKey('auth'))
  const token = localStorage.getItem('token')
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh, auth } }),
  })
}

export function PushSubscriber() {
  const { user } = useAuth()
  const vapidKeyRef = useRef<string>('')

  useEffect(() => {
    if (!user) return
    const ok = 'serviceWorker' in navigator && 'PushManager' in window
    if (!ok) return

    let cancelled = false

    // VAPID ключ нужен, чтобы создать подписку, если её нет — грузим заранее
    fetch('/api/push/vapid-public-key')
      .then(r => r.json())
      .then(data => {
        if (data.publicKey) {
          vapidKeyRef.current = data.publicKey
          console.log('[PushSubscriber] VAPID key loaded from API')
        }
      })
      .catch(err => {
        console.error('[PushSubscriber] Failed to load VAPID key:', err)
      })

    // Проверяет подписку и приводит её в соответствие с сервером:
    // - подписка есть → переотправляем на сервер (upsert, лечит рассинхрон
    //   после смены SW — Safari инвалидирует старую молча, не уведомляя);
    // - подписки нет → создаём и сохраняем.
    const ensureSubscription = async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        if (cancelled) return
        const sub = await reg.pushManager.getSubscription()
        if (cancelled) return
        if (sub) {
          await saveSubscription(sub)
          markPushWorks()
          console.log('[PushSubscriber] Subscription synced to server')
          return
        }
        if (!vapidKeyRef.current) {
          console.warn('[PushSubscriber] VAPID key not loaded yet, skipping subscribe')
          return
        }
        const newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKeyRef.current),
        })
        if (cancelled) {
          await newSub.unsubscribe().catch(() => {})
          return
        }
        await saveSubscription(newSub)
        markPushWorks() // авто-подписка прошла → Google-сервисы есть
        console.log('[PushSubscriber] Auto-subscribed successfully')
      } catch (err: any) {
        console.error('[PushSubscriber] Auto-subscribe error:', err)
        // «push service error»/«unavailable» на Android = нет Google-сервисов (FCM)
        if (/push service|unavailable|network/i.test(err?.message || '')) markPushMissing()
      }
    }

    // Первичная проверка на загрузке приложения
    ensureSubscription()

    // Новый SW взял управление (например, после деплоя) — Safari мог
    // инвалидировать push-подписку вместе со старым SW, проверяем заново
    const onControllerChange = () => {
      console.log('[PushSubscriber] Controller changed, re-checking subscription')
      ensureSubscription()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    // SW сам просит переподписаться (pushsubscriptionchange — браузер сменил ключи)
    const onSwMessage = (evt: MessageEvent) => {
      if (evt.data?.type === 'wecrm-resubscribe') {
        console.log('[PushSubscriber] Re-subscribe requested by SW')
        ensureSubscription()
      }
    }
    navigator.serviceWorker.addEventListener('message', onSwMessage)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      navigator.serviceWorker.removeEventListener('message', onSwMessage)
    }
  }, [user])

  return null
}
