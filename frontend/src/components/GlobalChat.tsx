import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { ChatMessage, FileAttachment, User } from '../types';
import { FileUpload } from './FileUpload';
import { LinkifyText } from './LinkifyText';
import { Avatar } from './Avatar';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function GlobalChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const latestIdRef = useRef<string | undefined>(undefined);
  const initialLoadRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/icq-message.mp3');
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setIsDark(localStorage.getItem('darkTheme') === 'true');
  }, []);

  useEffect(() => {
    latestIdRef.current = messages[messages.length - 1]?.id;
  }, [messages]);

  // Загружаем список пользователей
  useEffect(() => {
    api.users.list().then(all => {
      const assignable = all.filter(u => {
        if (u.id === user?.id) return false;
        const role = typeof u.role === 'string' ? null : u.role;
        return role?.isAssignable !== false;
      });
      setUsers(assignable);
      // По умолчанию режим "Всем" — recipientIds пустой
      setRecipientIds([]);
      setIsAllSelected(true);
    }).catch(() => {});
  }, [user?.id]);

  // SSE + fallback polling для получения новых сообщений в реальном времени
  useEffect(() => {
    api.chat.list().then(msgs => {
      setMessages(msgs);
      initialLoadRef.current = false;
    }).catch(() => {});

    // Подключаем SSE для канала chat
    let eventSource: EventSource | null = null;
    const token = localStorage.getItem('token');
    if (token) {
      eventSource = new EventSource(`/api/events?channels=chat&token=${encodeURIComponent(token)}`);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.channel === 'chat' && data.action === 'new_message' && data.message) {
            const msg = data.message;
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            if (!initialLoadRef.current && msg.authorId !== user?.id && audioRef.current && user?.soundEnabled) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          }
          if (data.channel === 'chat' && data.action === 'update_reaction' && data.message) {
            const msg = data.message;
            setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
          }
        } catch (err) {
          // ignore parse errors
        }
      };
      eventSource.onerror = () => {
        // SSE упал — ничего страшного, polling подхватит
      };
    }

    // Fallback polling каждые 5 секунд (реже, чем раньше, т.к. есть SSE)
    const interval = setInterval(async () => {
      try {
        const afterId = latestIdRef.current;
        const newMsgs = await api.chat.list(afterId);
        if (newMsgs.length > 0) {
          const hasOthersMessages = newMsgs.some(m => m.authorId !== user?.id);
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNew = newMsgs.filter(m => !existingIds.has(m.id));
            return [...prev, ...uniqueNew];
          });
          if (!initialLoadRef.current && hasOthersMessages && audioRef.current && user?.soundEnabled) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }
      } catch (e) {}
    }, 5000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [user?.id]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) { el.scrollTop = el.scrollHeight; }
  }, [messages]);

  const send = async () => {
    if ((!text.trim() && !pendingAttachments.length) || loading) return;
    setLoading(true);
    try {
      const content = text.trim() || (pendingAttachments.length ? `📎 ${pendingAttachments.length} файл(ов)` : '');
      const attachmentIds = pendingAttachments.length ? pendingAttachments.map(a => a.id) : undefined;
      const msg = await api.chat.send(
        content,
        replyTo?.id,
        recipientIds.length > 0 ? recipientIds : undefined,
        attachmentIds
      );
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setText('');
      setPendingAttachments([]);
      setReplyTo(null);
      // После отправки возвращаем режим "Всем" по умолчанию
      setRecipientIds([]);
      setIsAllSelected(true);
    } catch (e: any) {
      alert(e.message || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!confirm('Удалить сообщение?')) return;
    try {
      await api.chat.delete(msgId);
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, deletedAt: new Date().toISOString(), content: '[удалено]' } : m
      ));
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    try {
      const updated = await api.chat.react(msgId, emoji);
      setMessages(prev => prev.map(m => m.id === msgId ? updated : m));
      setShowReactionsFor(null);
    } catch (e) {
      alert('Ошибка реакции');
    }
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

  const handleFileUpload = async (attachment: FileAttachment) => {
    setPendingAttachments((prev) => [...prev, attachment]);
  };

  // Выбор конкретного получателя: снимаем режим "Всем", добавляем/убираем ID
  const toggleRecipient = (id: string) => {
    setIsAllSelected(false);
    setRecipientIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        // Если сняли последнюю галочку — вернуться в режим "Всем"
        if (next.length === 0) {
          setIsAllSelected(true);
        }
        return next;
      }
      return [...prev, id];
    });
  };

  // Выбор режима "Всем": сбрасываем все выбранные аватарки
  const handleSelectAll = () => {
    setIsAllSelected(true);
    setRecipientIds([]);
  };

  const getReactionGroups = (reactions?: Array<{ id: string; emoji: string; userId: string; user?: { name: string } }>) => {
    if (!reactions) return [];
    const groups: Record<string, { emoji: string; count: number; users: string[]; hasMine: boolean }> = {};
    reactions.forEach(r => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasMine: false };
      }
      groups[r.emoji].count++;
      groups[r.emoji].users.push(r.user?.name || '??');
      if (r.userId === user?.id) groups[r.emoji].hasMine = true;
    });
    return Object.values(groups);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '12px 8px',
          minHeight: 0,
        }}
        className="no-scrollbar"
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 120 }}>
            Нет сообщений. Напишите первое!
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.authorId === user?.id;
          const isDeleted = !!msg.deletedAt;
          const reactionGroups = getReactionGroups(msg.reactions as any);
          const recipientNames = msg.recipients?.map(r => r.user?.name).filter(Boolean) || [];
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].authorId !== msg.authorId);

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '100%',
                padding: '2px 10px',
                position: 'relative',
              }}
              onMouseEnter={() => setHoveredMsg(msg.id)}
              onMouseLeave={() => setHoveredMsg(null)}
            >
              {recipientNames.length > 0 && (
                <div style={{
                  fontSize: 11,
                  color: isMe ? 'rgba(255,255,255,0.7)' : '#007aff',
                  marginBottom: 2,
                  marginLeft: isMe ? 0 : 46,
                  marginRight: isMe ? 14 : 0,
                  fontWeight: 500,
                }}>
                  {isMe ? `→ ${recipientNames.join(', ')}` : `Лично для ${recipientNames.join(', ')}`}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '85%' }}>
                {!isMe && (
                  <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 4 }}>
                    {showAvatar ? (
                      <Avatar
                        name={msg.author?.name || '??'}
                        avatar={msg.author?.avatar}
                        size={32}
                        style={{ border: '2px solid var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                    ) : (
                      <div style={{ width: 32 }} />
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                  <div style={{
                    maxWidth: '100%',
                    minWidth: 48,
                    padding: '12px 16px',
                    borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
                    fontSize: 15,
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    position: 'relative',
                    overflow: 'hidden',
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
                    opacity: isDeleted ? 0.6 : 1,
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      borderRadius: '22px 22px 0 0',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
                      pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      {msg.replyTo && (
                        <div style={{
                          padding: '6px 10px',
                          marginBottom: 8,
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.18)',
                          border: '1px solid rgba(255,255,255,0.25)',
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.85)',
                          backdropFilter: 'blur(4px)',
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 2, opacity: 0.9 }}>
                            {msg.replyTo.author?.name || '??'}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            {msg.replyTo.content}
                          </div>
                        </div>
                      )}
                      <div style={{ marginBottom: 4 }}><LinkifyText text={msg.content} /></div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ marginTop: 10, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {msg.attachments.map(a => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          const previewUrl = a.path.startsWith('http') ? a.path : `${origin}${a.path}`;
                          const isImage = a.mimeType?.startsWith('image/');
                          if (isImage) {
                            return (
                              <a key={a.id} href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                                <img
                                  src={previewUrl}
                                  alt={a.originalName}
                                  style={{
                                    maxWidth: 220,
                                    maxHeight: 180,
                                    borderRadius: 14,
                                    objectFit: 'cover',
                                    display: 'block',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.20)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    cursor: 'pointer',
                                  }}
                                />
                              </a>
                            );
                          }
                          return (
                            <a
                              key={a.id}
                              href={previewUrl}
                              download={a.originalName}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.15)',
                                color: '#fff',
                                fontSize: 13,
                                textDecoration: 'none',
                                border: '1px solid rgba(255,255,255,0.20)',
                                backdropFilter: 'blur(10px)',
                                cursor: 'pointer',
                                maxWidth: '100%',
                              }}
                            >
                              <span style={{ fontSize: 16 }}>📎</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                {a.originalName}
                              </span>
                              <span style={{ fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap' }}>
                                ({(a.size / 1024).toFixed(1)} KB)
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {reactionGroups.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: 4,
                      marginTop: 4,
                      flexWrap: 'wrap',
                      marginRight: isMe ? 14 : 0,
                    }}>
                      {reactionGroups.map(g => (
                        <button
                          key={g.emoji}
                          onClick={() => !isDeleted && handleReact(msg.id, g.emoji)}
                          title={g.users.join(', ')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 8px',
                            borderRadius: 12,
                            border: 'none',
                            background: g.hasMine
                              ? (isDark ? 'rgba(0,122,255,0.35)' : 'rgba(0,122,255,0.15)')
                              : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'),
                            fontSize: 13,
                            cursor: isDeleted ? 'default' : 'pointer',
                            color: isDark ? '#fff' : '#1c1c1e',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{g.emoji}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{g.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {hoveredMsg === msg.id && !isDeleted && (
                    <div style={{
                      display: 'flex',
                      gap: 4,
                      marginTop: 4,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      marginRight: isMe ? 14 : 0,
                    }}>
                      <button
                        onClick={() => setReplyTo(msg)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 10,
                          border: 'none',
                          background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                          color: isDark ? '#fff' : '#1c1c1e',
                          fontSize: 12,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Ответить
                      </button>

                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowReactionsFor(showReactionsFor === msg.id ? null : msg.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 10,
                            border: 'none',
                            background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                            color: isDark ? '#fff' : '#1c1c1e',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          👍
                        </button>
                        {showReactionsFor === msg.id && (
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            display: 'flex',
                            gap: 4,
                            padding: '6px 10px',
                            borderRadius: 16,
                            background: isDark ? '#2c2c3e' : '#fff',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.20)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
                            zIndex: 100,
                            marginBottom: 4,
                          }}>
                            {REACTION_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  fontSize: 20,
                                  cursor: 'pointer',
                                  padding: '2px 4px',
                                  borderRadius: 8,
                                  transition: 'transform 0.15s ease',
                                }}
                                onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'scale(1.3)'; }}
                                onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {isMe && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'rgba(255,59,48,0.12)',
                            color: '#ff3b30',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {replyTo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          marginTop: 8,
          borderRadius: 12,
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          borderLeft: '3px solid #007aff',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
              Ответ {replyTo.author?.name || '??'}
            </div>
            <div style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.content}
            </div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {pendingAttachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 12px' }}>
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 10,
                background: 'var(--bg-input)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              <span>📎 {att.originalName}</span>
              <button
                onClick={() => setPendingAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Панель выбора получателей — кнопка "Всем" + аватарки пользователей */}
      {users.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          marginTop: 8,
          marginBottom: 6,
          flexWrap: 'wrap',
          flexShrink: 0,
          padding: '0 4px',
        }}>
          {/* Кнопка "Всем" — слева от аватарок */}
          <button
            onClick={handleSelectAll}
            disabled={isAllSelected}
            title="Отправить всем"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: isAllSelected ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              background: 'none',
              border: 'none',
              padding: 0,
              opacity: isAllSelected ? 1 : 0.6,
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isAllSelected
                ? 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)'
                : 'var(--bg-input, rgba(0,0,0,0.08))',
              color: isAllSelected ? '#fff' : 'var(--text-muted, rgba(255,255,255,0.4))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              border: isAllSelected
                ? '2.5px solid #007aff'
                : '2.5px solid transparent',
              boxShadow: isAllSelected
                ? '0 0 0 2px rgba(0,122,255,0.25), 0 3px 10px rgba(0,122,255,0.35)'
                : '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
            }}>
              Всем
            </div>
            <span style={{
              fontSize: 9,
              color: isAllSelected ? '#007aff' : 'var(--text-muted, rgba(255,255,255,0.4))',
              marginTop: 3,
              fontWeight: isAllSelected ? 600 : 400,
              transition: 'color 0.2s ease',
            }}>
              Всем
            </span>
          </button>

          {users.map(u => {
            // Аватарка выбрана только когда isAllSelected = false и ID в списке
            const selected = !isAllSelected && recipientIds.includes(u.id);
            return (
              <div
                key={u.id}
                onClick={() => toggleRecipient(u.id)}
                title={u.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <div style={{
                  position: 'relative',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  overflow: 'visible',
                }}>
                  <Avatar
                    name={u.name}
                    avatar={u.avatar}
                    size={36}
                    style={{
                      border: selected
                        ? '2.5px solid #007aff'
                        : '2.5px solid transparent',
                      boxShadow: selected
                        ? '0 0 0 2px rgba(0,122,255,0.25), 0 3px 10px rgba(0,122,255,0.35)'
                        : '0 2px 6px rgba(0,0,0,0.15)',
                      opacity: selected ? 1 : 0.55,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  {/* Галочка выбора */}
                  <div style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#007aff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    color: '#fff',
                    fontWeight: 700,
                    border: '2px solid var(--bg-card, #1a1a2e)',
                    opacity: selected ? 1 : 0,
                    transform: selected ? 'scale(1)' : 'scale(0)',
                    transition: 'all 0.2s ease',
                    pointerEvents: 'none',
                  }}>
                    ✓
                  </div>
                </div>
                <span style={{
                  fontSize: 9,
                  color: selected
                    ? '#007aff'
                    : 'var(--text-muted, rgba(255,255,255,0.4))',
                  marginTop: 3,
                  maxWidth: 44,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: selected ? 600 : 400,
                  transition: 'color 0.2s ease',
                }}>
                  {u.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
        marginTop: 8,
        padding: '10px 0 calc(10px + env(safe-area-inset-bottom, 0))',
        flexShrink: 0,
      }}>
        <FileUpload entityType="chat" entityId="global" onUpload={handleFileUpload} isDark={isDark} variant="button" multiple={true} />

        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyTo ? 'Ответ...' : 'Сообщение...'}
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
          onClick={send}
          disabled={loading || (!text.trim() && !pendingAttachments.length)}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: (text.trim() || pendingAttachments.length)
              ? 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)'
              : 'rgba(142,142,147,0.30)',
            color: '#fff',
            fontSize: 20,
            cursor: (text.trim() || pendingAttachments.length) ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: text.trim()
              ? '0 4px 16px rgba(0,122,255,0.40)'
              : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
