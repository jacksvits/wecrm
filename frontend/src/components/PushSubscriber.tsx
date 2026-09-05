import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

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

export function PushSubscriber() {
  const { user } = useAuth()
  const [vapidKey, setVapidKey] = useState<string>('')

  useEffect(() => {
    if (!user) return
    const ok = 'serviceWorker' in navigator && 'PushManager' in window
    if (!ok) return

    // Load VAPID key from backend API instead of hardcoded value
    fetch('/api/push/vapid-public-key')
      .then(r => r.json())
      .then(data => {
        if (data.publicKey) {
          setVapidKey(data.publicKey)
          console.log('[PushSubscriber] VAPID key loaded from API')
        }
      })
      .catch(err => {
        console.error('[PushSubscriber] Failed to load VAPID key:', err)
      })
  }, [user])

  useEffect(() => {
    if (!user || !vapidKey) return
    const ok = 'serviceWorker' in navigator && 'PushManager' in window
    if (!ok) return

    navigator.serviceWorker.register('/sw.js')
      .then(reg => reg.pushManager.getSubscription())
      .then(async (sub) => {
        if (sub) {
          console.log('[PushSubscriber] Already subscribed')
          return
        }
        const reg = await navigator.serviceWorker.ready
        const newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
        const p256dh = arrayBufferToBase64(newSub.getKey('p256dh'))
        const auth = arrayBufferToBase64(newSub.getKey('auth'))
        const token = localStorage.getItem('token')
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
          body: JSON.stringify({ endpoint: newSub.endpoint, keys: { p256dh, auth } }),
        })
        console.log('[PushSubscriber] Auto-subscribed successfully')
      })
      .catch(err => {
        console.error('[PushSubscriber] Auto-subscribe error:', err)
      })
  }, [user, vapidKey])

  return null
}
