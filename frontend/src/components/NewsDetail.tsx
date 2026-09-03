import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { News, NewsHistory } from '../types';

export function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<NewsHistory[]>([]);
  const [restoring, setRestoring] = useState(false);

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
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;
  }

  if (!news) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Новость не найдена</div>;
  }

  return (
    <div>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <button
          onClick={() => navigate('/news')}
          style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 14 }}
        >
          ← Назад к новостям
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: showHistory ? '#007AFF' : 'var(--bg-hover)',
              color: showHistory ? '#fff' : 'var(--text-color)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            История изменений
          </button>
          <button
            onClick={() => navigate(`/news/${id}/edit`)}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Редактировать
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Удалить
          </button>
        </div>
      </div>

      {/* История изменений */}
      {showHistory && (
        <div style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-color)',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>История изменений</h3>
          {historyList.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>История пуста</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {historyList.map((h, idx) => (
                <div
                  key={h.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      Версия #{historyList.length - idx}
                      {idx === 0 && <span style={{ marginLeft: 8, fontSize: 11, color: '#007AFF' }}>(текущая)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(h.createdAt).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>{h.editorName}</span>
                    {' '}• {h.isPublished ? 'Опубликовано' : 'Черновик'}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>{h.title}</strong>
                  </div>
                  {h.summary && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {h.summary.slice(0, 100)}{h.summary.length > 100 ? '...' : ''}
                    </div>
                  )}
                  {h.labels?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {h.labels.map(l => (
                        <span key={l} style={{ fontSize: 11, color: '#f59e0b', background: '#f59e0b15', padding: '2px 6px', borderRadius: 8 }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                  {idx > 0 && (
                    <button
                      onClick={() => handleRestore(h.id)}
                      disabled={restoring}
                      style={{
                        marginTop: 8,
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#007AFF15',
                        color: '#007AFF',
                        border: 'none',
                        cursor: restoring ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {restoring ? 'Восстановление...' : 'Восстановить эту версию'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Обложка */}
      {news.coverImage && (
        <img
          src={news.coverImage}
          alt={news.title}
          style={{
            width: '100%',
            maxHeight: 400,
            objectFit: 'cover',
            borderRadius: 16,
            marginBottom: 20,
          }}
        />
      )}

      {/* Заголовок и мета */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          {news.category && (
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: news.category.color || '#007AFF',
              background: (news.category.color || '#007AFF') + '15',
              padding: '4px 10px',
              borderRadius: 8,
            }}>
              {news.category.name}
              {news.subcategory && ` / ${news.subcategory.name}`}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {news.publishedAt
              ? new Date(news.publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
              : new Date(news.createdAt).toLocaleDateString('ru-RU')}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {news.views} просмотров
          </span>
        </div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          margin: '0 0 16px',
          color: 'var(--text-color)',
          lineHeight: 1.3,
        }}>
          {news.title}
        </h1>

        {/* Автор */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {news.author?.avatar ? (
            <img src={news.author.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          ) : (
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#007AFF',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
            }}>
              {(news.author?.name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{news.author?.name || 'Неизвестно'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Автор</div>
          </div>
        </div>
      </div>

      {/* Теги и метки */}
      {(news.tags?.length > 0 || news.labels?.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {news.tags?.map(tag => (
            <span key={tag.id} style={{
              fontSize: 12,
              color: tag.color || '#10b981',
              background: (tag.color || '#10b981') + '15',
              padding: '4px 10px',
              borderRadius: 12,
            }}>
              #{tag.name}
            </span>
          ))}
          {news.labels?.map(label => (
            <span key={label} style={{
              fontSize: 12,
              color: '#f59e0b',
              background: '#f59e0b15',
              padding: '4px 10px',
              borderRadius: 12,
            }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Описание */}
      {news.summary && (
        <div style={{
          padding: 16,
          borderRadius: 12,
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-color)',
          marginBottom: 24,
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}>
          {news.summary}
        </div>
      )}

      {/* Контент */}
      <div style={{
        fontSize: 16,
        lineHeight: 1.75,
        color: 'var(--text-color)',
        whiteSpace: 'pre-wrap',
      }}>
        {news.content}
      </div>
    </div>
  );
}
