import { useState } from 'react'
import { useBrandLogo } from '../lib/branding'

/**
 * Публичная регистрация организации на платформе (только главный домен).
 * Создаёт tenant'а: отдельную БД, администратора организации.
 * Организация активируется после оплаты подписки администратором платформы.
 */
export function Register() {
  const brandLogo = useBrandLogo(false)
  const mainHost = window.location.hostname === 'welans.cc' || window.location.hostname === 'www.welans.cc'
  const baseHost = window.location.hostname.replace(/^www\./, '')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ subdomain: string; message: string } | null>(null)

  const slugValid = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(slug)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!slugValid) { setError('Поддомен: 3–32 символа — строчные латинские буквы, цифры и дефис'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/platform/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, adminName, adminEmail, adminPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`)
      setDone({ subdomain: data.subdomain, message: data.message || '' })
    } catch (err: any) {
      setError(err.message || 'Не удалось зарегистрировать организацию')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15,
    border: '1px solid var(--border-color)', background: 'var(--bg-input, var(--bg-secondary))',
    color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }

  return (
    <div className="login-split">
      <div className="login-form-side">
        <div className="login-form-wrap" style={{ maxWidth: 480 }}>
          <div className="login-form-content">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              {brandLogo
                ? <img src={brandLogo} alt="WeCRM" style={{ height: 44 }} />
                : <h1 style={{ margin: 0, fontSize: 26 }}>WeCRM</h1>}
            </div>

            {!mainHost && !done && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                Регистрация организаций доступна на основном сайте платформы.<br />
                <a href={`https://welans.cc/register`}>Перейти на welans.cc →</a>
              </div>
            )}

            {mainHost && !done && (
              <>
                <h1 style={{ textAlign: 'center', fontSize: 22, margin: '0 0 6px' }}>Регистрация организации</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 22px' }}>
                  Получите свою CRM на отдельном поддомене со своими данными
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Название организации</label>
                    <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} placeholder='ООО «Ромашка»' />
                  </div>
                  <div>
                    <label style={labelStyle}>Адрес вашей CRM (поддомен)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <input
                        style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0, fontFamily: 'monospace' }}
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        required pattern="[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])"
                        placeholder='romashka'
                      />
                      <span style={{ padding: '12px 12px', border: '1px solid var(--border-color)', borderLeft: 'none', borderTopRightRadius: 10, borderBottomRightRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 14, whiteSpace: 'nowrap' }}>
                        .{baseHost}
                      </span>
                    </div>
                    {slug && !slugValid && <div className="login-error" style={{ marginTop: 4 }}>3–32 символа, начинается и заканчивается на букву или цифру</div>}
                    {slug && slugValid && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>Ваша CRM: https://{slug}.{baseHost}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Имя администратора</label>
                    <input style={inputStyle} value={adminName} onChange={(e) => setAdminName(e.target.value)} required minLength={2} maxLength={80} placeholder='Иван Петров' />
                  </div>
                  <div>
                    <label style={labelStyle}>Email администратора</label>
                    <input style={inputStyle} type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required placeholder='admin@romashka.ru' />
                  </div>
                  <div>
                    <label style={labelStyle}>Пароль администратора</label>
                    <input style={inputStyle} type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={8} maxLength={100} placeholder='Минимум 8 символов' autoComplete="new-password" />
                  </div>
                  {error && <div className="login-error">{error}</div>}
                  <button type="submit" className="login-btn-primary" disabled={loading || !slugValid} style={{ width: '100%', padding: '13px', fontSize: 15, border: 'none', cursor: 'pointer' }}>
                    {loading ? 'Создаём организацию...' : 'Зарегистрировать организацию'}
                  </button>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                    После регистрации организация будет активирована после оплаты подписки.
                    По вопросам оплаты: <a href="mailto:info@welans.ru">info@welans.ru</a>
                  </p>
                </form>
                <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16 }}>
                  <a href="/">← На страницу входа</a>
                </p>
              </>
            )}

            {done && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
                <h1 style={{ fontSize: 20, margin: '0 0 10px' }}>Организация создана</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                  {done.message}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Адрес входа: <a href={`https://${done.subdomain}.${baseHost}`}>https://{done.subdomain}.{baseHost}</a>
                </p>
                <p style={{ marginTop: 18 }}>
                  <a href="/">← На страницу входа</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
