import { useEffect, useState } from 'react'
import { useBrandLogo } from '../lib/branding'

/**
 * Страница «Войти в свою CRM» (welans.cc/org-login): пользователь вводит
 * поддомен организации и переходит на её страницу входа.
 */
export function OrgLogin() {
  const brandLogo = useBrandLogo(false)
  const baseHost = window.location.hostname.replace(/^www\./, '')
  const [slug, setSlug] = useState('')
  const [info, setInfo] = useState<{ exists: boolean; name?: string; status?: string } | null>(null)
  const [checking, setChecking] = useState(false)

  const slugValid = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(slug)

  useEffect(() => {
    if (!slugValid) { setInfo(null); return }
    setChecking(true)
    const t = setTimeout(() => {
      fetch(`/api/platform/check-slug?slug=${encodeURIComponent(slug)}`)
        .then((r) => (r.ok ? r.json() : { exists: false }))
        .then((d) => setInfo(d))
        .catch(() => setInfo(null))
        .finally(() => setChecking(false))
    }, 350)
    return () => clearTimeout(t)
  }, [slug, slugValid])

  const go = () => {
    if (slugValid) window.location.href = `https://${slug}.${baseHost}`
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15, boxSizing: 'border-box',
    border: '1px solid var(--border-color)', background: 'var(--bg-input, var(--bg-secondary))', color: 'var(--text-primary)',
    outline: 'none',
  }

  return (
    <div className="login-split">
      <div className="login-form-side">
        <div className="login-form-wrap" style={{ maxWidth: 460 }}>
          <div className="login-form-content">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              {brandLogo
                ? <img src={brandLogo} alt="WeCRM" style={{ height: 44 }} />
                : <h1 style={{ margin: 0, fontSize: 26 }}>WeCRM</h1>}
            </div>
            <h1 style={{ textAlign: 'center', fontSize: 22, margin: '0 0 6px' }}>Войти в свою CRM</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 22px' }}>
              Введите адрес, который вы получили при регистрации организации
            </p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0, fontFamily: 'monospace' }}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder='romashka'
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') go() }}
              />
              <span style={{ padding: '12px 12px', border: '1px solid var(--border-color)', borderLeft: 'none', borderTopRightRadius: 10, borderBottomRightRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 14, whiteSpace: 'nowrap' }}>
                .{baseHost}
              </span>
            </div>
            <div style={{ minHeight: 22, marginTop: 6, fontSize: 13 }}>
              {slug && !slugValid && <span style={{ color: '#dc2626' }}>3–32 символа: строчные латинские буквы, цифры и дефис</span>}
              {slugValid && checking && <span style={{ color: 'var(--text-secondary)' }}>Проверяем...</span>}
              {slugValid && !checking && info && (info.exists
                ? <span style={{ color: '#16a34a' }}>Организация «{info.name}» найдена → https://{slug}.{baseHost}</span>
                : <span style={{ color: '#d97706' }}>Организация с таким адресом не найдена — проверьте написание</span>)}
            </div>
            <button
              onClick={go}
              disabled={!slugValid}
              className="login-btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 6 }}
            >
              Перейти ко входу
            </button>
            <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16 }}>
              <a href="/">← На страницу входа</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
