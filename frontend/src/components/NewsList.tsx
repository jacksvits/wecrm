import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { News, NewsCategory, NewsTag } from '../types';

export function NewsList() {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [tags, setTags] = useState<NewsTag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<News[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);

  // Загрузка категорий, тегов и меток
  useEffect(() => {
    api.news.categories().then(setCategories).catch(() => {});
    api.news.tags().then(setTags).catch(() => {});
    loadDrafts();
  }, []);

  // Загрузка новостей при изменении фильтров
  useEffect(() => {
    loadNews(1);
  }, [selectedCategory, selectedTag, selectedLabel]);

  const loadNews = useCallback(async (p: number = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedTag) params.set('tag', selectedTag);
      if (selectedLabel) params.set('label', selectedLabel);
      params.set('page', String(p));
      params.set('limit', '12');

      const res = await api.news.list(params.toString());
      setNews(res.news || []);
      setTotalPages(res.pages || 1);
      setPage(res.page || 1);

      // Собираем все уникальные метки для фильтра
      const labels = new Set<string>();
      (res.news || []).forEach((n: News) => {
        n.labels?.forEach(l => labels.add(l));
      });
      setAllLabels(Array.from(labels).sort());
    } catch (e) {
      console.error('Ошибка загрузки новостей:', e);
    }
    setLoading(false);
  }, [search, selectedCategory, selectedTag, selectedLabel]);
  useRealtime(['news'], (data) => { if (data.entity === 'news') loadNews(1); });

  const loadDrafts = async () => {
    try {
      const data = await api.news.drafts();
      setDrafts(data || []);
    } catch {}
  };

  const handleSearch = () => {
    setPage(1);
    loadNews(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTag('');
    setSelectedLabel('');
    setPage(1);
    loadNews(1);
  };

  const hasActiveFilters = search || selectedCategory || selectedTag || selectedLabel;

  return (
    <div>
      {/* Шапка с поиском */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Новости</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {drafts.length > 0 && (
              <button
                onClick={() => setShowDrafts(!showDrafts)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: showDrafts ? '#007AFF' : 'var(--bg-hover)',
                  color: showDrafts ? '#fff' : 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Черновики ({drafts.length})
              </button>
            )}
            <button
              onClick={() => navigate('/news/new')}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: '#007AFF',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              + Создать новость
            </button>
          </div>
        </div>

        {/* Поисковая строка */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Поиск по названию, описанию, тегам, меткам..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              minWidth: 250,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: '#007AFF',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Найти
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                background: 'var(--bg-hover)',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Фильтры */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value="">Все категории</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value="">Все теги</option>
            {tags.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={selectedLabel}
            onChange={e => setSelectedLabel(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value="">Все метки</option>
            {allLabels.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Черновики */}
      {showDrafts && drafts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Черновики</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {drafts.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/news/${item.id}/edit`)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--bg-hover)',
                  border: '1px dashed var(--border-color)',
                  cursor: 'pointer',
                  opacity: 0.8,
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.summary ? item.summary.slice(0, 80) + '...' : 'Нет описания'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Редактировать черновик
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список новостей */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
      ) : news.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          {hasActiveFilters ? 'Новости не найдены. Попробуйте изменить фильтры.' : 'Новостей пока нет.'}
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {news.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/news/${item.id}`)}
                style={{
                  borderRadius: 16,
                  background: 'var(--card-bg, var(--bg-hover))',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* Обложка */}
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: 120,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                    {item.category?.name || 'Новость'}
                  </div>
                )}

                <div style={{ padding: 16 }}>
                  {/* Категория и дата */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    {item.category && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: item.category.color || '#007AFF',
                        background: (item.category.color || '#007AFF') + '15',
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}>
                        {item.category.name}
                        {item.subcategory && ` / ${item.subcategory.name}`}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString('ru-RU')
                        : new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {/* Заголовок */}
                  <h3 style={{
                    margin: '0 0 8px',
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: 'var(--text-color)',
                  }}>
                    {item.title}
                  </h3>

                  {/* Описание */}
                  {item.summary && (
                    <p style={{
                      margin: '0 0 12px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--text-muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {item.summary}
                    </p>
                  )}

                  {/* Теги и метки */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {item.tags?.map(tag => (
                      <span key={tag.id} style={{
                        fontSize: 11,
                        color: tag.color || '#10b981',
                        background: (tag.color || '#10b981') + '15',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}>
                        #{tag.name}
                      </span>
                    ))}
                    {item.labels?.map(label => (
                      <span key={label} style={{
                        fontSize: 11,
                        color: '#f59e0b',
                        background: '#f59e0b15',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}>
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Автор и просмотры */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.author?.avatar ? (
                        <img src={item.author.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                      ) : (
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#007AFF',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 600,
                        }}>
                          {(item.author?.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span>{item.author?.name || 'Неизвестно'}</span>
                    </div>
                    <span>{item.views || 0} просмотров</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); loadNews(Math.max(1, page - 1)); }}
                disabled={page <= 1}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  fontSize: 13,
                }}
              >
                ← Назад
              </button>
              <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
                Страница {page} из {totalPages}
              </span>
              <button
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); loadNews(Math.min(totalPages, page + 1)); }}
                disabled={page >= totalPages}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                  fontSize: 13,
                }}
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
