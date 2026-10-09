import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { Task, FileAttachment } from '../types';
import { Avatar } from './Avatar';
import { FileUpload, AttachmentList } from './FileUpload';

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Страница «Тех. поддержка»: персональный чат пользователя с поддержкой (в стиле общего чата).
// Первое сообщение создаёт задачу-обращение; вся переписка дублируется в обсуждение задачи.
// Для staff (admin/developer) — список обращений всех пользователей.
export function SupportChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'admin' || user?.role === 'developer';
  // Просмотр и ответы на все запросы: admin/developer или роль с опцией «Видит все запросы тех. поддержки»
  const seesAllTickets = isStaff || user?.canSeeAllSupportTickets === true;
  // Ссылка на задачу-обращение — только у кого включена опция «Видит все запросы тех. поддержки»
  // (admin/developer видят все запросы всегда — кнопка у них остаётся)
  const canAccess = isStaff || user?.canAccessSupportChat === true;

  const [view, setView] = useState<'list' | 'chat'>(seesAllTickets ? 'list' : 'chat');
  const [task, setTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Task[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  // Формат даты и времени сообщения в стиле проекта: «09.09.2026 23:24»
  const formatTime = (date: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('ru')} ${d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const STATUS_LABELS: Record<string, string> = {
    open: 'Открыта', in_progress: 'В работе', load: 'В работе', win: 'Выполнена', cancelled: 'Отменена',
  };
  const STATUS_COLORS: Record<string, string> = {
    open: '#e67e22', in_progress: '#3498db', load: '#3498db', win: '#27ae60', cancelled: '#95a5a6',
  };

  const loadMy = async (silent = false) => {
    try {
      const res = await api.supportChat.my();
      setTask(res.task);
      setMessages(res.messages);
    } catch { /* ошибка загрузки */ }
    finally { if (!silent) setLoading(false); }
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
      setMessages(res.messages);
      stickToBottomRef.current = true;
      setView('chat');
    } catch (err: any) {
      alert(err.message || 'Ошибка открытия обращения');
    }
  };

  useEffect(() => {
    setIsDark(localStorage.getItem('darkTheme') === 'true');
    if (!canAccess) return;
    if (seesAllTickets) { loadTickets(); setLoading(false); } else { loadMy(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Опрос новых сообщений каждые 5 секунд
  useEffect(() => {
    if (!canAccess) return;
    const timer = setInterval(() => {
      if (seesAllTickets) {
        if (view === 'list') loadTickets();
        else if (task?.id) {
          api.supportChat.taskMessages(task.id).then(res => setMessages(res.messages)).catch(() => {});
        }
      } else {
        loadMy(true);
      }
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seesAllTickets, view, task?.id]);

  // Скролл: держим низ чата при новых сообщениях
  useEffect(() => {
    const el = containerRef.current;
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const plain = stripHtml(text);
    if ((!plain && pendingAttachments.length === 0) || sending) return;
    const content = plain ? text.trim() : `📎 ${pendingAttachments.length} файл(ов)`;
    const attachmentIds = pendingAttachments.length ? pendingAttachments.map(a => a.id) : undefined;
    setSending(true);
    try {
      stickToBottomRef.current = true;
      const res = seesAllTickets && task
        ? await api.supportChat.reply(task.id, content, attachmentIds)
        : await api.supportChat.send(content, attachmentIds);
      setTask(res.task);
      setMessages(prev => prev.some(m => m.id === res.message.id) ? prev : [...prev, res.message]);
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

  // ── Список обращений (staff) ──
  if (seesAllTickets && view === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div
          ref={containerRef}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 8px', minHeight: 0 }}
          className="no-scrollbar"
        >
          {tickets.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 120 }}>Обращений пока нет</div>
          )}
          {tickets.map(t => {
            const last = (t as any).comments?.[0];
            return (
              <div
                key={t.id}
                onClick={() => openTicket(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 16,
                  cursor: 'pointer', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <Avatar name={(t as any).supportOwner?.name || '?'} avatar={(t as any).supportOwner?.avatar} size={40} style={{ border: '2px solid var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Шапка чата */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        flexShrink: 0,
      }}>
        {seesAllTickets && (
          <button onClick={() => { setView('list'); setTask(null); setMessages([]); loadTickets(); }} style={{
            border: 'none', background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
            borderRadius: 10, padding: '5px 10px', cursor: 'pointer',
            color: isDark ? '#fff' : '#1c1c1e', fontSize: 13, fontWeight: 500,
          }}>←</button>
        )}
        <div style={{ fontSize: 15, fontWeight: 700 }}>Тех. поддержка</div>
        {task && seesAllTickets && (
          <>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 10, marginLeft: 4,
              background: (STATUS_COLORS[(task as any).status] || '#95a5a6') + '22',
              color: STATUS_COLORS[(task as any).status] || '#95a5a6',
            }}>{STATUS_LABELS[(task as any).status] || (task as any).status}</span>
            <button onClick={() => navigate(`/tasks/${task.id}`)} style={{
              marginLeft: 'auto', border: 'none',
              background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
              borderRadius: 10, padding: '5px 10px', cursor: 'pointer',
              color: isDark ? '#fff' : '#1c1c1e', fontSize: 12, fontWeight: 500,
            }}>Задача №{(task as any).ticketNumber ?? ''} →</button>
          </>
        )}
      </div>

      {/* Сообщения */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column',
          gap: 8, padding: '12px 8px', minHeight: 0,
        }}
        className="no-scrollbar"
      >
        {messages.length > 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: '2px 0 6px', opacity: 0.7 }}>
            Начало переписки
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 120 }}>Загрузка...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 120, lineHeight: 1.6 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Чат с технической поддержкой</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Опишите вашу проблему — первое сообщение создаст обращение</div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.author?.id === user?.id;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].author?.id !== msg.author?.id);
            return (
              <div
                key={msg.id}
                style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%', padding: '2px 10px', position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '85%' }}>
                  {!isMe && (
                    <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 4 }}>
                      {showAvatar ? (
                        <Avatar name={msg.author?.name || '??'} avatar={msg.author?.avatar} size={32} style={{ border: '2px solid var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                      ) : (
                        <div style={{ width: 32 }} />
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {!isMe && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 2, marginBottom: 1 }}>
                        {msg.author?.name || '??'}
                      </span>
                    )}
                    <div style={{
                      maxWidth: '100%', minWidth: 48, padding: '12px 16px',
                      borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
                      fontSize: 15, lineHeight: 1.45, wordBreak: 'break-word',
                      position: 'relative', overflow: 'hidden',
                      background: isMe
                        ? 'linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)'
                        : 'linear-gradient(135deg, rgb(10, 136, 0) 0%, rgb(51, 194, 120) 50%, rgb(4, 110, 0) 100%)',
                      color: '#fff',
                      boxShadow: isMe
                        ? '0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)'
                        : 'rgba(8, 255, 0, 0.35) 0px 4px 20px, rgba(255, 255, 255, 0.25) 0px 1px 0px inset',
                      border: isMe
                        ? '1px solid rgba(120,180,255,0.40)'
                        : '1px solid rgba(120, 255, 122, 0.4)',
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                        borderRadius: '22px 22px 0 0',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none',
                      }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ marginBottom: 4 }}>
                          {/<[a-z][\s\S]*>/i.test(msg.content)
                            ? <div className="rich-text" style={{ color: 'inherit' }} dangerouslySetInnerHTML={{ __html: msg.content }} />
                            : msg.content}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: 10, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {msg.attachments.map((a: FileAttachment) => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : '';
                            const previewUrl = a.path.startsWith('http') ? a.path : `${origin}${a.path}`;
                            const isImage = a.mimeType?.startsWith('image/');
                            if (isImage) {
                              return (
                                <a key={a.id} href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                                  <img src={previewUrl} alt={a.originalName} style={{
                                    maxWidth: 220, maxHeight: 180, borderRadius: 14, objectFit: 'cover', display: 'block',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                                  }} />
                                </a>
                              );
                            }
                            return (
                              <a key={a.id} href={previewUrl} download={a.originalName} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, textDecoration: 'none',
                                border: '1px solid rgba(255,255,255,0.20)', backdropFilter: 'blur(10px)', cursor: 'pointer', maxWidth: '100%',
                              }}>
                                <span style={{ fontSize: 16 }}>📎</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{a.originalName}</span>
                                <span style={{ fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap' }}>({(a.size / 1024).toFixed(1)} KB)</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingAttachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 12px' }}>
          {pendingAttachments.map((att) => (
            <div key={att.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10,
              background: 'var(--bg-input)', fontSize: 13, color: 'var(--text-secondary)',
            }}>
              <span>📎 {att.originalName}</span>
              <button onClick={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 0,
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Панель ввода */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '0 0 env(safe-area-inset-bottom, 0)', flexShrink: 0 }}>
        <FileUpload entityType="comment" entityId="pending" onUpload={a => setPendingAttachments(prev => [...prev, a])} isDark={isDark} variant="button" multiple={true} />
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение..."
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: 22,
            border: 'none',
            background: isDark ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.03)',
            color: 'var(--text-primary)',
            fontSize: 15,
            outline: 'none',
            minWidth: 0,
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || (!stripHtml(text) && pendingAttachments.length === 0)}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: (stripHtml(text) || pendingAttachments.length)
              ? 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)'
              : 'rgba(142,142,147,0.30)',
            color: '#fff', fontSize: 20,
            cursor: (stripHtml(text) || pendingAttachments.length) ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: stripHtml(text) ? '0 4px 16px rgba(0,122,255,0.40)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >↑</button>
      </div>
    </div>
  );
}
