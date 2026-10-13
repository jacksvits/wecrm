import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { SupportAttachPicker, SupportAttachments, SupFile } from './supportFiles'

interface Msg { id: string; authorRole: string; authorName: string; body: string; createdAt: string; attachments?: SupFile[] }
interface Ticket {
  id: string; subject: string; status: string; authorName: string; createdAt: string; updatedAt: string
  messages?: Msg[]
}

const STATUS: Record<string, { text: string; color: string; bg: string }> = {
  open: { text: 'Открыт', color: '#92400e', bg: '#fef3c7' },
  answered: { text: 'Есть ответ', color: '#1e40af', bg: '#dbeafe' },
  closed: { text: 'Закрыт', color: '#666', bg: '#eee' },
}

const fmt = (d?: string) => (d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')

/** Поддержка (только для организаций на поддоменах) */
export function TenantSupport() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [drafts, setDrafts] = useState<SupFile[]>([])        // файлы нового запроса
  const [replyDrafts, setReplyDrafts] = useState<SupFile[]>([]) // файлы ответа в переписке

  const load = () => {
    setLoading(true)
    api.tenantSupport.list()
      .then((list) => setTickets(list as Ticket[]))
      .catch((e: any) => setError(e.message || 'Не удалось загрузить запросы'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openTicket = (id: string) => {
    api.tenantSupport.get(id).then((t) => { setSelected(t as Ticket); setReply(''); setReplyDrafts([]) }).catch(() => {})
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true); setError('')
    api.tenantSupport.create({ subject, message, attachmentIds: drafts.map((d) => d.id) })
      .then(() => { setShowForm(false); setSubject(''); setMessage(''); setDrafts([]); load() })
      .catch((e: any) => setError(e.message || 'Не удалось отправить запрос'))
      .finally(() => setSending(false))
  }

  const sendReply = () => {
    if (!selected || !reply.trim()) return
    api.tenantSupport.reply(selected.id, reply.trim(), replyDrafts.map((d) => d.id))
      .then((t) => { setSelected(t as Ticket); setReply(''); setReplyDrafts([]); load() })
      .catch((e: any) => setError(e.message || 'Не удалось отправить'))
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
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>
        <button onClick={() => { setSelected(null); load() }} style={{ ...btn('transparent'), color: 'var(--text-secondary)', paddingLeft: 0, marginBottom: 10 }}>
          ← Назад к запросам
        </button>
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{selected.subject}</h2>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.text}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Создан {fmt(selected.createdAt)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {(selected.messages || []).map((m) => (
            <div key={m.id} style={{
              ...card, padding: 12,
              borderLeft: `4px solid ${m.authorRole === 'platform' ? '#16a34a' : 'var(--border-color)'}`,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <b>{m.authorName}</b> · {m.authorRole === 'platform' ? 'Поддержка WeCRM' : 'Вы'} · {fmt(m.createdAt)}
              </div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.body}</div>
              <SupportAttachments items={m.attachments} />
            </div>
          ))}
        </div>
        {selected.status !== 'closed' && (
          <div style={card}>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Ваш ответ..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div style={{ marginTop: 10 }}>
              <SupportAttachPicker files={replyDrafts} onChange={setReplyDrafts} />
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button style={btn('#16a34a')} onClick={sendReply} disabled={!reply.trim()}>Отправить</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Поддержка</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ ...btn('transparent'), color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/help')}>
            <img src="/mascot/mascot_point.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            Справка
          </button>
          <button style={btn('#16a34a')} onClick={() => setShowForm(true)}>Оформить запрос</button>
        </div>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 16px' }}>
        Запросы уходят в техподдержку платформы WeCRM (welans.cc). Ответ появится в этой переписке.
      </p>
      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {loading && <div>Загрузка...</div>}
      {!loading && tickets.length === 0 && !showForm && (
        <div style={{ ...card, color: 'var(--text-secondary)', textAlign: 'center', padding: 30 }}>
          Запросов пока нет. Нажмите «Оформить запрос», если нужна помощь платформы.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tickets.map((t) => {
          const st = STATUS[t.status] || STATUS.open
          const last = t.messages && t.messages[0]
          return (
            <div key={t.id} style={{ ...card, cursor: 'pointer' }} onClick={() => openTicket(t.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <b style={{ fontSize: 15 }}>{t.subject}</b>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.text}</span>
              </div>
              {last && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last.body}</div>}
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Обновлён {fmt(t.updatedAt)}</div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setShowForm(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ ...card, width: '100%', maxWidth: 520 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>Оформить запрос</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputStyle} placeholder="Тема запроса" value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} maxLength={200} />
              <textarea
                style={{ ...inputStyle, minHeight: 130, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Опишите вопрос или проблему..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required minLength={3}
              />
              <SupportAttachPicker files={drafts} onChange={setDrafts} disabled={sending} />
              {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" style={{ ...btn('transparent'), color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }} onClick={() => setShowForm(false)}>Отмена</button>
                <button type="submit" style={btn('#16a34a')} disabled={sending}>{sending ? 'Отправка...' : 'Отправить запрос'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
