import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Link } from 'react-router-dom'
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Tenant {
  id: string
  name: string
  slug: string
  dbName: string
  adminEmail: string
  status: string
  plan: string
  planProductId?: string | null
  paidUntil?: string | null
  createdAt: string
  usersCount?: number | null
  dbSizeBytes?: number | null
  filesSizeBytes?: number | null
}

interface MainInfo {
  slug: string
  name: string
  domain: string
  usersCount?: number | null
  dbSizeBytes?: number | null
  filesSizeBytes?: number | null
  system?: SystemInfo
}

interface SystemInfo {
  os?: string
  nfsMounts?: string[]
  diskFreeBytes?: number | null
  diskTotalBytes?: number | null
  loadAvg?: number[]
  cpus?: number
  memFreeBytes?: number
  memTotalBytes?: number
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

function fmtSize(bytes?: number | null) {
  if (bytes == null) return '—'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' КБ'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' МБ'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' ГБ'
}

function toDateInput(d?: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

/** Админка платформы: главная организация + организации (сетка/список) */
export function TenantsAdmin() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [main, setMain] = useState<MainInfo | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [tariffs, setTariffs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [editPlan, setEditPlan] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editPaymentInfo, setEditPaymentInfo] = useState('')
  const baseHost = window.location.hostname.replace(/^www\./, '')

  const load = () => {
    setLoading(true)
    api.platform.tenants()
      .then((d: any) => {
        setTenants(Array.isArray(d) ? d : (d?.tenants || []))
        setMain(d?.main || null)
      })
      .catch((e: any) => setError(e.message || 'Не удалось загрузить организации'))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    load()
    fetch('/api/platform/tariffs').then((r) => (r.ok ? r.json() : [])).then((l) => setTariffs(Array.isArray(l) ? l : [])).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const act = (fn: () => Promise<any>) => {
    setActionId('wait')
    fn().catch((e: any) => setError(e.message || 'Ошибка')).finally(() => { setActionId(null); load() })
  }

  const openEdit = (t: Tenant) => {
    setEditing(t)
    setEditPlan(t.planProductId || '')
    setEditDate(toDateInput(t.paidUntil))
    setEditPaymentInfo((t as any).paymentInfo || '')
    setError('')
  }

  const saveEdit = () => {
    if (!editing) return
    const body: any = {}
    if (editPlan !== (editing.planProductId || '')) body.planProductId = editPlan || null
    if (editDate !== toDateInput(editing.paidUntil)) body.paidUntil = editDate ? new Date(editDate + 'T23:59:59').toISOString() : null
    if (editPaymentInfo !== ((editing as any).paymentInfo || '')) body.paymentInfo = editPaymentInfo
    if (!Object.keys(body).length) { setEditing(null); return }
    act(() => api.platform.updateTenant(editing.id, body).then(() => setEditing(null)))
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12,
    padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
  }
  const btn = (color: string): React.CSSProperties => ({
    padding: '7px 12px', borderRadius: 8, border: `1px solid ${color}`, background: 'transparent',
    color, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
  })
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
    border: '1px solid var(--border-color)', background: 'var(--bg-input, var(--bg-secondary))', color: 'var(--text-primary)',
  }

  const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', padding: '8px 10px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid var(--border-color)' }

  const actions = (t: Tenant) => {
    const busy = actionId !== null
    const ib = (key: string, icon: string, title: string, fn: () => void) => (
      <button
        key={key}
        disabled={busy}
        title={title}
        onClick={fn}
        style={{
          width: 30, height: 30, borderRadius: 8, cursor: busy ? 'default' : 'pointer',
          border: '1px solid var(--border-color)', background: 'transparent',
          fontSize: 14, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          opacity: busy ? 0.5 : 1,
        }}
      >{icon}</button>
    )
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {ib('edit', '✎', 'Редактировать', () => openEdit(t))}
        {t.status !== 'active' && ib('activate', '✔', 'Активировать (+30 дней)', () => act(() => api.platform.activate(t.id)))}
        {t.status === 'active' && ib('extend', '⟳', 'Продлить (+30 дней)', () => act(() => api.platform.extend(t.id)))}
        {t.status === 'active' && ib('suspend', '⏸', 'Приостановить', () => act(() => api.platform.suspend(t.id)))}
        {t.status === 'suspended' && ib('resume', '▶', 'Возобновить', () => act(() => api.platform.resume(t.id)))}
        {ib('pwd', '🔑', 'Сброс пароля администратора', () => {
          const pwd = window.prompt(`Новый пароль администратора ${t.adminEmail} (минимум 8 символов):`)
          if (pwd && pwd.length >= 8) act(() => api.platform.resetPassword(t.id, pwd))
          else if (pwd) window.alert('Пароль должен быть не короче 8 символов')
        })}
        {ib('del', '🗑', 'Удалить организацию с базой данных', () => {
          if (window.confirm(`Удалить организацию «${t.name}» ВМЕСТЕ С БАЗОЙ ДАННЫХ? Действие необратимо.`)) {
            const confirmSlug = window.prompt(`Введите поддомен «${t.slug}» для подтверждения удаления:`)
            if (confirmSlug === t.slug) act(() => api.platform.deleteTenant(t.id, t.slug))
          }
        })}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>      {main && (
        <div style={{ ...card, marginBottom: 18, border: '2px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>★ {main.name}</div>
              <a href={`https://${main.domain}`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>{main.domain}</a>
            </div>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#166534', whiteSpace: 'nowrap' }}>Активна (платформа)</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <span>Пользователей: <b>{main.usersCount ?? '—'}</b></span>
            <span>База данных: <b>{fmtSize(main.dbSizeBytes)}</b></span>
            <span>Файлы: <b>{fmtSize(main.filesSizeBytes)}</b></span>
          </div>
          {main.system && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'monospace' }}>
              <span>ОС: {main.system.os}</span>
              <span>NFS: {(main.system.nfsMounts || []).length > 0 ? (main.system.nfsMounts || []).join(', ') : '—'}</span>
              <span>Диск: свободно <b style={{ color: 'var(--text-primary)' }}>{fmtSize(main.system.diskFreeBytes)}</b> из {fmtSize(main.system.diskTotalBytes)}</span>
              <span>CPU: нагрузка {(main.system.loadAvg || []).map((x: number) => x.toFixed(2)).join(' / ')} ({main.system.cpus ?? '—'} ядер)</span>
              <span>RAM: свободно <b style={{ color: 'var(--text-primary)' }}>{fmtSize(main.system.memFreeBytes)}</b> из {fmtSize(main.system.memTotalBytes)}</span>
            </div>
          )}
        </div>
      )}


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Организации платформы</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/platform/tickets" style={{ fontSize: 14 }}>Запросы организаций →</a>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setView('grid')} style={{ padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 13, background: view === 'grid' ? '#16a34a' : 'transparent', color: view === 'grid' ? '#ffffff' : 'var(--text-secondary)' }}>▦ Сетка</button>
            <button onClick={() => setView('list')} style={{ padding: '7px 14px', border: 'none', borderLeft: '1px solid var(--border-color)', cursor: 'pointer', fontSize: 13, background: view === 'list' ? '#16a34a' : 'transparent', color: view === 'list' ? '#ffffff' : 'var(--text-secondary)' }}>☰ Список</button>
          </div>
          <button onClick={load} style={btn('var(--text-secondary)')}>Обновить</button>
        </div>
      </div>
      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}

      {loading && <div>Загрузка...</div>}
      {!loading && tenants.length === 0 && (
        <div style={{ color: 'var(--text-secondary)' }}>
          Пока нет зарегистрированных организаций. Публичная регистрация — на странице{' '}
          <a href="/register" target="_blank" rel="noreferrer">/register</a>.
        </div>
      )}

      {!loading && view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {tenants.map((t) => {
            const st = STATUS_LABEL[t.status] || STATUS_LABEL.pending
            return (
              <div key={t.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                    <a href={`https://${t.slug}.${baseHost}`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                      {t.slug}.{baseHost}
                    </a>
                  </div>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.text}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span>Админ: {t.adminEmail}</span>
                  <span>Тариф: <b>{t.plan}</b></span>
                  <span>Оплачено по: <b>{fmtDate(t.paidUntil)}</b></span>
                  <span>Пользователей в CRM: <b>{t.usersCount ?? '—'}</b></span>
                  <span>База данных: <b>{fmtSize(t.dbSizeBytes)}</b></span>
                  <span>Файлы: <b>{fmtSize(t.filesSizeBytes)}</b></span>
                  <span>Регистрация: {fmtDate(t.createdAt)}</span>
                </div>
                {actions(t)}
              </div>
            )
          })}
        </div>
      )}

      {!loading && view === 'list' && tenants.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <thead>
              <tr>
                <th style={th}>Организация</th>
                <th style={th}>Статус</th>
                <th style={th}>Админ</th>
                <th style={th}>Тариф</th>
                <th style={th}>Оплачено по</th>
                <th style={th}>Польз.</th>
                <th style={th}>БД</th>
                <th style={th}>Файлы</th>
                <th style={th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const st = STATUS_LABEL[t.status] || STATUS_LABEL.pending
                return (
                  <tr key={t.id}>
                    <td style={td}>
                      <b>{t.name}</b><br />
                      <a href={`https://${t.slug}.${baseHost}`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>{t.slug}.{baseHost}</a>
                    </td>
                    <td style={td}><span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.text}</span></td>
                    <td style={td}>{t.adminEmail}</td>
                    <td style={td}>{t.plan}</td>
                    <td style={td}>{fmtDate(t.paidUntil)}</td>
                    <td style={td}>{t.usersCount ?? '—'}</td>
                    <td style={td}>{fmtSize(t.dbSizeBytes)}</td>
                    <td style={td}>{fmtSize(t.filesSizeBytes)}</td>
                    <td style={td}>{actions(t)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div style={overlay} onClick={() => setEditing(null)}>
          <div style={{ ...card, width: '100%', maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Редактирование: {editing.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {editing.slug}.{baseHost}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Тариф</label>
                <select style={inputStyle} value={editPlan} onChange={(e) => setEditPlan(e.target.value)}>
                  <option value="">— без привязки к товару (текущее: {editing.plan}) —</option>
                  {tariffs.map((x) => (
                    <option key={x.productId} value={x.productId}>
                      {x.name}{x.price != null ? ` — ${Number(x.price).toLocaleString('ru-RU')} ₽` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Дата окончания подписки
                </label>
                <input type="date" style={inputStyle} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Реквизиты / инструкция оплаты (показываются организации при оплате)
                </label>
                <ReactQuill theme='snow' value={editPaymentInfo} onChange={setEditPaymentInfo} style={{ background: 'var(--bg-primary)' }} />
              </div>
              {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button style={{ ...btn('var(--text-secondary)') }} onClick={() => setEditing(null)}>Отмена</button>
                <button
                  style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, cursor: 'pointer' }}
                  onClick={saveEdit}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
