import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'

interface Msg { id: string; authorRole: string; authorName: string; body: string; createdAt: string }
interface Ticket {
  id: string; subject: string; status: string; tenantSlug: string; tenantName: string
  authorName: string; authorEmail: string; createdAt: string; updatedAt: string
  messages?: Msg[]
}

const STATUS: Record<string, { text: string; color: string; bg: string }> = {
  open: { text: 'Открыт', color: '#92400e', bg: '#fef3c7' },
  answered: { text: 'Есть ответ', color: '#1e40af', bg: '#dbeafe' },
  closed: { text: 'Закрыт', color: '#666', bg: '#eee' },
}
const FILTERS = [['', 'Все'], ['open', 'Открытые'], ['answered', 'С ответом'], ['closed', 'Закрытые']] as const

const fmt = (d?: string) => (d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')

/** Запросы организаций в поддержку платформы (только welans.cc, admin) */
export function TenantTicketsAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const navigate = useNavigate()

  const load = (f = filter) => {
    setLoading(true)
    api.tenantSupport.adminList(f || undefined)
      .then((list) => setTickets(list as Ticket[]))
      .catch((e: any) => setError(e.message || 'Не удалось загрузить запросы'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load('') /* eslint-disable-line */ }, [])

  const openTicket = (id: string) => {
    api.tenantSupport.adminGet(id).then((t) => { setSelected(t as Ticket); setReply('') }).catch(() => {})
  }

  const sendReply = () => {
    if (!selected || !reply.trim()) return
    api.tenantSupport.adminReply(selected.id, reply.trim())
      .then((t) => { setSelected(t as Ticket); setReply(''); load() })
      .catch((e: any) => setError(e.message || 'Не удалось отправить'))
  }

  const setStatus = (status: string) => {
    if (!selected) return
    api.tenantSupport.adminStatus(selected.id, status)
      .then(() => { setSelected({ ...selected, status } as Ticket); load() })
      .catch((e: any) => setError(e.message || 'Не удалось сменить статус'))
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
    border: '1px solid var(--border-color)', background: 'var(--bg-input, var(--bg-secondary))', color: 'var(--text-primary)',
  }
  const btn = (bg: string): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: 8, border: 'none', background: bg, color: '#fff', fontSize: 14, cursor: 'pointer',
  })

  if (selected) {
    const st = STATUS[selected.status] || STATUS.open
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        <button onClick={() => { setSelected(null); load() }} style={{ ...btn('transparent'), color: 'var(--text-secondary)', paddingLeft: 0, marginBottom: 10 }}>
          ← Назад к запросам
        </button>
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{selected.subject}</h2>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.text}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            Организация: <b>{selected.tenantName}</b> ({selected.tenantSlug}) · Автор: {selected.authorName} ({selected.authorEmail}) · {fmt(selected.createdAt)}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selected.status !== 'closed' && <button style={{ ...btn('#991b1b') }} onClick={() => setStatus('closed')}>Закрыть запрос</button>}
            {selected.status === 'closed' && <button style={{ ...btn('#16a34a') }} onClick={() => setStatus('open')}>Открыть заново</button>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {(selected.messages || []).map((m) => (
            <div key={m.id} style={{
              ...card, padding: 12,
              borderLeft: `4px solid ${m.authorRole === 'platform' ? '#16a34a' : '#d97706'}`,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <b>{m.authorName}</b> · {m.authorRole === 'platform' ? 'Поддержка платформы' : 'Организация'} · {fmt(m.createdAt)}
              </div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.body}</div>
            </div>
          ))}
        </div>
        {selected.status !== 'closed' && (
          <div style={card}>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Ответ поддержки..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div style={{ marginTop: 10 }}>
              <button style={btn('#16a34a')} onClick={sendReply} disabled={!reply.trim()}>Отправить ответ</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Запросы организаций</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button style={{ ...btn('transparent'), color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/help')}>
            <img src="/mascot/mascot_point.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            Справка
          </button>
          <Link to="/platform" style={{ fontSize: 14 }}>← Организации платформы</Link>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(([val, label]) => (
          <button
            key={val}
            onClick={() => { setFilter(val); load(val) }}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: filter === val ? '#16a34a' : 'transparent',
              color: filter === val ? '#ffffff' : 'var(--text-secondary)',
            }}
          >{label}</button>
        ))}
      </div>
      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {loading && <div>Загрузка...</div>}
      {!loading && tickets.length === 0 && (
        <div style={{ ...card, color: 'var(--text-secondary)', textAlign: 'center', padding: 30 }}>
          Запросов нет.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tickets.map((t) => {
          const st = STATUS[t.status] || STATUS.open
          const last = t.messages && t.messages[0]
          return (
            <div key={t.id} style={{ ...card, cursor: 'pointer' }} onClick={() => openTicket(t.id)}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <b style={{ fontSize: 15 }}>{t.subject}</b>

                <span style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.text}</span>
                <span
                  role="button" title="Удалить запрос"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Удалить запрос навсегда?')) {
                      setLoading(true); api.tenantSupport.adminDelete(t.id).catch((err2: any) => setError(err2.message || 'Ошибка')).finally(() => { setLoading(false); load(); });
                    }
                  }}
                  style={{ fontSize: 16, color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1, padding: '2px 6px' }}
                >✕</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                Организация: <b>{t.tenantName}</b> ({t.tenantSlug}) · Автор: {t.authorName} · Обновлён {fmt(t.updatedAt)}
              </div>
              {last && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last.body}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
