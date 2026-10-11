import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface BrandingData {
  splashEnabled?: boolean
  splashUrl?: string | null
}

/**
 * Заставка при запуске приложения (брендинг организации):
 * показывает splash-изображение организации, пока идёт инициализация
 * (загрузка сессии /me). Брендинг текущего tenant'а — на поддомене
 * организации заставка будет её собственная.
 */
export function SplashScreen() {
  const { loading } = useAuth() as any
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setBranding(d) })
      .catch(() => {})
  }, [])

  const show = !!branding?.splashEnabled && !!branding?.splashUrl

  useEffect(() => {
    if (show && loading) {
      setVisible(true)
      setFading(false)
    } else if (visible) {
      setFading(true)
      const t = setTimeout(() => setVisible(false), 350)
      return () => clearTimeout(t)
    }
  }, [show, loading, visible])

  if (!visible || !branding?.splashUrl) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'var(--bg-primary, #fff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fading ? 0 : 1, transition: 'opacity 0.35s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <img
        src={branding.splashUrl}
        alt=""
        style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
      />
    </div>
  )
}
