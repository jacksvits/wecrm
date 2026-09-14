import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { News, NewsHistory } from '../types';
import { LinkifyText } from './LinkifyText';
import { stripHtml } from '../lib/stripHtml';
import { useBrandNewsCover } from '../lib/branding';
import { useAuth } from '../hooks/useAuth';

export function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const defaultCover = useBrandNewsCover();
  const { user } = useAuth();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<NewsHistory[]>([]);
  const [restoring, setRestoring] = useState(false);

  // Право на редактирование новостей у текущей роли
  const canEditNews = !user || user.role === 'admin' || (user as any)?.canEditNews !== false;

  useEffect(() => {
    if (!id) return;
    loadNews();
  }, [id]);

  const loadNews = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.news.get(id);
      setNews(data);
      if (data.history) {
        setHistoryList(data.history);
      }
    } catch {}
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Удалить новость? Это действие нельзя отменить.')) return;
    try {
      await api.news.delete(id);
      navigate('/news');
    } catch {}
  };

  const handleRestore = async (historyId: string) => {
    if (!id || !window.confirm('Восстановить эту версию? Текущее содержимое будет заменено.')) return;
    setRestoring(true);
    try {
      await fetch(`/api/news/${id}/history/${historyId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      await loadNews();
      setShowHistory(false);
    } catch {}
    setRestoring(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Загрузка...
      </div>
    );
  }

  if (!news) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Новость не найдена
      </div>
    );
  }

  const coverSrc = news.coverImage || defaultCover;

  return (
    <>
      {/* Кнопка «Назад» — вне блока новости */}
      <button
        onClick={() => navigate('/news')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: 14,
          marginBottom: 12,
        }}
      >
        ← Назад к новостям
      </button>

      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: 24,
        boxShadow: 'var(--shadow)',
      }}>
        {/* Действия */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          {canEditNews && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {showHistory ? 'Скрыть историю' : 'История'}
          </button>
          )}
          {canEditNews && (
            <>
              <button
                onClick={() => navigate(`/news/${news.id}/edit`)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#007AFF',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Редактировать
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#FF3B30',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Удалить
              </button>
            </>
          )}
        </div>

        {/* Заголовок — над картинкой */}
        <h1 style={{
          margin: '0 0 16px',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
        }}>
          {news.title}
        </h1>

        {/* Обложка с кратким описанием слева снизу */}
        {coverSrc ? (
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', margin: '0 0 18px' }}>
            <img
              src={coverSrc}
              alt={news.title}
              style={{
                width: '100%',
                maxHeight: 380,
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {news.summary && (
              <div style={{
                position: 'absolute',
                left: 14,
                bottom: 14,
                maxWidth: '70%',
                background: 'rgba(0,0,0,0.55)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                {stripHtml(news.summary)}
              </div>
            )}
          </div>
        ) : (
          news.summary && (
            <div style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              margin: '0 0 18px',
              lineHeight: 1.6,
            }}>
              {stripHtml(news.summary)}
            </div>
          )
        )}

        {/* Полное описание — под картинкой */}
        {news.content && (
          <div style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            margin: '0 0 18px',
            wordBreak: 'break-word',
          }}>
            <div
              className="rich-text"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </div>
        )}

        {/* Дата создания, теги, метки — под описанием */}
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-color)',
          paddingTop: 14,
        }}>
          <span>
            {new Date(news.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {news.category && (
            <span style={{
              color: news.category.color,
              background: news.category.color + '18',
              padding: '2px 8px',
              borderRadius: 10,
              fontWeight: 500,
            }}>
              {news.category.name}
            </span>
          )}
          <span>{news.views} просмотров</span>
          {news.labels && news.labels.length > 0 && (
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {news.labels.map((label, i) => (
                <span key={i} style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                }}>
                  {label}
                </span>
              ))}
            </span>
          )}
          {news.tags && news.tags.length > 0 && (
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {news.tags.map((tag) => (
                <span key={tag.id} style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(0,122,255,0.1)',
                  color: '#007AFF',
                }}>
                  #{tag.name}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* История изменений */}
        {showHistory && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
              История изменений
            </h3>
            {historyList.length === 0 ? (
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>История пуста</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historyList.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {h.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {new Date(h.createdAt).toLocaleString('ru-RU')} · {h.editorName}
                        </div>
                        {h.summary && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {stripHtml(h.summary).slice(0, 100)}{stripHtml(h.summary).length > 100 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      {canEditNews && (
                        <button
                          onClick={() => handleRestore(h.id)}
                          disabled={restoring}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 8,
                            background: '#34C759',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 12,
                            opacity: restoring ? 0.6 : 1,
                          }}
                        >
                          Восстановить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
