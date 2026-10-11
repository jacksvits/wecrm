import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface Tenant {
  id: string
  name: string
  slug: string
  dbName: string
  adminEmail: string
  status: string // pending | active | suspended
  plan: string
  paidUntil?: string | null
  createdAt: string
  activatedAt?: string | null
}

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  pending: { text: 'Ожидает оплаты', color: '#92400e', bg: '#fef3c7' },
  active: { text: 'Активна', color: '#166534', bg: '#dcfce7' },
  suspended: { text: 'Приостановлена', color: '#991b1b', bg: '#fee2e2' },
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU')
}

/** Админка платформы: управление организациями (только главный домен, роль admin) */
export function TenantsAdmin() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const baseHost = window.location.hostname.replace(/^www\./, '')

  const load = () => {
    setLoading(true)
    api.platform.tenants()
      .then(setTenants)
      .catch((e: any) => setError(e.message || 'Не удалось загрузить организации'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const act = (fn: () => Promise<any>) => {
    setActionId('wait')
    fn().catch((e: any) => setError(e.message || 'Ошибка')).finally(() => { setActionId(null); load() })
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12,
    padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
  }
  const btn = (color: string): React.CSSProperties => ({
    padding: '7px 12px', borderRadius: 8, border: `1px solid ${color}`, background: 'transparent',
    color, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Организации платформы</h1>
        <a href="/platform/tickets" style={{ fontSize: 14 }}>Запросы организаций →</a>
        <button onClick={load} style={btn('var(--text-secondary)')}>Обновить</button>
      </div>
      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {loading && <div>Загрузка...</div>}
      {!loading && tenants.length === 0 && (
        <div style={{ color: 'var(--text-secondary)' }}>
          Пока нет зарегистрированных организаций. Публичная регистрация — на странице{' '}
          <a href="/register" target="_blank" rel="noreferrer">/register</a>.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {tenants.map((t) => {
          const st = STATUS_LABEL[t.status] || STATUS_LABEL.pending
          const busy = actionId !== null
          return (
            <div key={t.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                  <a href={`https://${t.slug}.${baseHost}`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                    {t.slug}.{baseHost}
                  </a>
                </div>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                  {st.text}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span>Админ: {t.adminEmail}</span>
                <span>Тариф: {t.plan}</span>
                <span>Оплачено по: <b>{fmtDate(t.paidUntil)}</b></span>
                <span>Регистрация: {fmtDate(t.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {t.status !== 'active' && (
                  <button disabled={busy} style={btn('#16a34a')} onClick={() => act(() => api.platform.activate(t.id))}>
                    Активировать (+30 дней)
                  </button>
                )}
                {t.status === 'active' && (
                  <button disabled={busy} style={btn('#16a34a')} onClick={() => act(() => api.platform.extend(t.id))}>
                    Продлить (+30 дней)
                  </button>
                )}
                {t.status === 'active' && (
                  <button disabled={busy} style={btn('#d97706')} onClick={() => act(() => api.platform.suspend(t.id))}>
                    Приостановить
                  </button>
                )}
                {t.status === 'suspended' && (
                  <button disabled={busy} style={btn('#16a34a')} onClick={() => act(() => api.platform.resume(t.id))}>
                    Возобновить
                  </button>
                )}
                <button
                  disabled={busy} style={btn('#dc2626')}
                  onClick={() => {
                    const pwd = window.prompt(`Новый пароль администратора ${t.adminEmail} (минимум 8 символов):`)
                    if (pwd && pwd.length >= 8) act(() => api.platform.resetPassword(t.id, pwd))
                    else if (pwd) window.alert('Пароль должен быть не короче 8 символов')
                  }}
                >
                  Сброс пароля
                </button>
                <button
                  disabled={busy} style={btn('#991b1b')}
                  onClick={() => {
                    if (window.confirm(`Удалить организацию «${t.name}» ВМЕСТЕ С БАЗОЙ ДАННЫХ? Действие необратимо.`)) {
                      const confirmSlug = window.prompt(`Введите поддомен «${t.slug}» для подтверждения удаления:`)
                      if (confirmSlug === t.slug) act(() => api.platform.deleteTenant(t.id, t.slug))
                    }
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
