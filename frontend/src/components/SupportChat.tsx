import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { Task, User, FileAttachment } from '../types';
import { Avatar } from './Avatar';
import { FileUpload, AttachmentList } from './FileUpload';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
  ],
};
const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const formatTime = (d?: string) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' +
    date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Открыта', in_progress: 'В работе', load: 'В работе', win: 'Выполнена', cancelled: 'Отменена',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#e67e22', in_progress: '#3498db', load: '#3498db', win: '#27ae60', cancelled: '#95a5a6',
};

interface SupportMessage {
  id: string;
  content: string;
  createdAt: string;
  isInternal?: boolean;
  author: { id: string; name: string; avatar?: string };
  attachments?: FileAttachment[];
}

// Страница «Тех. поддержка»: персональный чат пользователя с поддержкой.
// Первое сообщение создаёт задачу-обращение; вся переписка дублируется в обсуждение задачи.
// Для staff (admin/developer) — список обращений всех пользователей.
export function SupportChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'admin' || user?.role === 'developer';
  const canAccess = isStaff || user?.canAccessSupportChat === true;

  const [view, setView] = useState<'list' | 'chat'>(isStaff ? 'list' : 'chat');
  const [task, setTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [tickets, setTickets] = useState<Task[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const loadMy = async (silent = false) => {
    try {
      const res = await api.supportChat.my();
      setTask(res.task);
      setMessages(res.messages as SupportMessage[]);
      if (!silent) setLoading(false);
    } catch {
      if (!silent) setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      setTickets(await api.supportChat.tickets());
    } catch { /* staff only */ }
  };

  const openTicket = async (taskId: string) => {
    try {
      const res = await api.supportChat.taskMessages(taskId);
      setTask(res.task);
      setMessages(res.messages as SupportMessage[]);
      setView('chat');
    } catch (err: any) {
      alert(err.message || 'Ошибка открытия обращения');
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    if (isStaff) { loadTickets(); setLoading(false); } else { loadMy(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Опрос новых сообщений
  useEffect(() => {
    if (!canAccess) return;
    const timer = setInterval(() => {
      if (isStaff) {
        if (view === 'list') loadTickets();
        else if (task?.id) {
          api.supportChat.taskMessages(task.id).then(res => {
            const last = res.messages[res.messages.length - 1];
            if (!last || last.id !== lastMessageIdRef.current) {
              setMessages(res.messages as SupportMessage[]);
            }
          }).catch(() => {});
        }
      } else {
        loadMy(true);
      }
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, view, task?.id]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last) lastMessageIdRef.current = last.id;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const plain = stripHtml(text);
    if ((!plain && pendingAttachments.length === 0) || sending) return;
    const content = plain ? text : `📎 ${pendingAttachments.length} файл(ов)`;
    const attachmentIds = pendingAttachments.length ? pendingAttachments.map(a => a.id) : undefined;
    setSending(true);
    try {
      if (isStaff && task) {
        const res = await api.supportChat.reply(task.id, content, attachmentIds);
        setTask(res.task);
        setMessages(prev => [...prev, res.message as SupportMessage]);
      } else {
        const res = await api.supportChat.send(content, attachmentIds);
        setTask(res.task);
        setMessages(prev => [...prev, res.message as SupportMessage]);
      }
      setText('');
      setPendingAttachments([]);
    } catch (err: any) {
      alert(err.message || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  if (!canAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Доступ к тех. поддержке ограничен</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Обратитесь к администратору</div>
      </div>
    );
  }

  const bubble = (m: SupportMessage) => {
    const own = m.author.id === user?.id;
    return (
      <div key={m.id} style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: own ? 'flex-end' : 'flex-start' }}>
        {!own && <Avatar name={m.author.name} avatar={m.author.avatar} size={32} />}
        <div style={{ maxWidth: '75%' }}>
          {!own && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, paddingLeft: 4 }}>{m.author.name}</div>
          )}
          <div style={{
            background: own ? 'var(--accent, #4f8ef7)' : 'var(--bg-hover, rgba(0,0,0,0.05))',
            color: own ? '#fff' : 'var(--text-primary)',
            borderRadius: 12,
            borderTopRightRadius: own ? 4 : 12,
            borderTopLeftRadius: own ? 12 : 4,
            padding: '8px 12px',
            fontSize: 14,
            lineHeight: 1.45,
            wordBreak: 'break-word',
          }}>
            {/<[a-z][\s\S]*>/i.test(m.content)
              ? <div className="rich-text" style={{ color: 'inherit' }} dangerouslySetInnerHTML={{ __html: m.content }} />
              : m.content}
            {m.attachments && m.attachments.length > 0 && (
              <div onClick={e => e.stopPropagation()}>
                <AttachmentList attachments={m.attachments} isDark={own} />
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textAlign: own ? 'right' : 'left', paddingRight: 4, paddingLeft: 4 }}>
            {formatTime(m.createdAt)}
          </div>
        </div>
        {own && <Avatar name={m.author.name} avatar={m.author.avatar} size={32} />}
      </div>
    );
  };

  // ── Список обращений (staff) ──
  if (isStaff && view === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 18, fontWeight: 600 }}>
          Тех. поддержка
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {tickets.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>Обращений пока нет</div>
          )}
          {tickets.map(t => {
            const last = (t as any).comments?.[0];
            return (
              <div
                key={t.id}
                onClick={() => openTicket(t.id)}
                style={{
                  display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px',
                  borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                  background: 'var(--bg-hover, rgba(0,0,0,0.03))',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Avatar name={(t as any).supportOwner?.name || '?'} avatar={(t as any).supportOwner?.avatar} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{(t as any).supportOwner?.name || 'Пользователь'}</span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10,
                      background: (STATUS_COLORS[t.status] || '#95a5a6') + '22',
                      color: STATUS_COLORS[t.status] || '#95a5a6',
                    }}>{STATUS_LABELS[t.status] || t.status}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatTime((t as any).updatedAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  {last && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {last.author?.name}: {stripHtml(last.content).slice(0, 80) || 'вложение'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Чат ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
        {isStaff && (
          <button onClick={() => { setView('list'); setTask(null); setMessages([]); loadTickets(); }} style={{
            border: 'none', background: 'var(--bg-hover)', borderRadius: 8, padding: '6px 10px',
            cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13,
          }}>← Назад</button>
        )}
        <div style={{ fontSize: 17, fontWeight: 600 }}>Тех. поддержка</div>
        {task && (
          <button onClick={() => navigate(`/tasks/${task.id}`)} style={{
            marginLeft: 'auto', border: '1px solid var(--border-color)', background: 'transparent',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 12,
          }}>Задача №{(task as any).ticketNumber ?? ''} →</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>Загрузка...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, lineHeight: 1.6 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎧</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>Чат с технической поддержкой</div>
            <div style={{ fontSize: 13 }}>Опишите вашу проблему — первое сообщение создаст обращение</div>
          </div>
        ) : (
          messages.map(bubble)
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', padding: '10px 16px calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        {pendingAttachments.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <AttachmentList attachments={pendingAttachments} isDark onDelete={id => setPendingAttachments(prev => prev.filter(a => a.id !== id))} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ReactQuill
              theme="snow"
              value={text}
              onChange={setText}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Сообщение..."
            />
          </div>
          <FileUpload entityType="comment" entityId="pending" onUpload={a => setPendingAttachments(prev => [...prev, a])} isDark variant="button" multiple={true} />
          <button
            onClick={handleSend}
            disabled={sending || (!stripHtml(text) && pendingAttachments.length === 0)}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: sending || (!stripHtml(text) && pendingAttachments.length === 0) ? 'var(--bg-hover)' : 'var(--accent, #4f8ef7)',
              color: '#fff', fontSize: 17, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >➤</button>
        </div>
      </div>
    </div>
  );
}
