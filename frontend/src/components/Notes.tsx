import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Note } from '../types';

const NOTE_COLORS = [
  { value: '#fef3c7', label: 'Жёлтый' },
  { value: '#d1fae5', label: 'Зелёный' },
  { value: '#dbeafe', label: 'Голубой' },
  { value: '#fce7f3', label: 'Розовый' },
  { value: '#e9d5ff', label: 'Фиолетовый' },
  { value: '#ffedd5', label: 'Оранжевый' },
  { value: '#f3f4f6', label: 'Серый' },
  { value: '#fee2e2', label: 'Красный' },
];

export function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.notes.list(search.trim() || undefined);
      setNotes(data || []);
    } catch (e) {
      console.error('Ошибка загрузки заметок:', e);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSearch = () => {
    loadNotes();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Удалить заметку? Это действие нельзя отменить.')) return;
    setDeletingId(id);
    try {
      await api.notes.delete(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
    setDeletingId(null);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedColor('');
    setSelectedTag('');
    loadNotes();
  };

  // Собираем все уникальные теги
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || []))).sort();

  // Фильтрация на клиенте по цвету и тегу
  const filteredNotes = notes.filter(note => {
    if (selectedColor && note.color !== selectedColor) return false;
    if (selectedTag && !(note.tags || []).includes(selectedTag)) return false;
    return true;
  });

  const hasActiveFilters = search || selectedColor || selectedTag;

  // Функция для получения контрастного цвета текста
  const getTextColor = (bgColor: string) => {
    // Для светлых фонов — тёмный текст
    const lightColors = ['#fef3c7', '#d1fae5', '#dbeafe', '#fce7f3', '#e9d5ff', '#ffedd5', '#f3f4f6', '#fee2e2'];
    return lightColors.includes(bgColor) ? '#1f2937' : '#fff';
  };

  // Очистка HTML для превью
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div>
      {/* Шапка */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Заметки</h2>
          <button
            onClick={() => navigate('/notes/new')}
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
            + Новая заметка
          </button>
        </div>

        {/* Поиск */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Поиск по заголовку, содержимому, тегам..."
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

        {/* Фильтры по цвету и тегу */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Фильтр по цвету */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Цвет:</span>
            {NOTE_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(prev => prev === c.value ? '' : c.value)}
                title={c.label}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c.value,
                  border: selectedColor === c.value ? '2px solid #007AFF' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  boxShadow: selectedColor === c.value ? '0 0 0 2px #007AFF30' : 'none',
                }}
              />
            ))}
          </div>

          {/* Фильтр по тегу */}
          {allTags.length > 0 && (
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
              {allTags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Сетка заметок */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
      ) : filteredNotes.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          {hasActiveFilters ? 'Заметки не найдены. Попробуйте изменить фильтры.' : 'Заметок пока нет. Создайте первую! '}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {filteredNotes.map(note => {
            const textColor = getTextColor(note.color);
            const previewText = stripHtml(note.content).slice(0, 120);
            return (
              <div
                key={note.id}
                onClick={() => navigate(`/notes/${note.id}/edit`)}
                style={{
                  borderRadius: 16,
                  background: note.color || '#f0f0f0',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 180,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* Верхняя панель с датой и кнопкой удаления */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px 0',
                }}>
                  <span style={{
                    fontSize: 11,
                    color: textColor,
                    opacity: 0.7,
                    fontWeight: 500,
                  }}>
                    {new Date(note.updatedAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={(e) => handleDelete(note.id, e)}
                    disabled={deletingId === note.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: textColor,
                      opacity: 0.5,
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: '2px 6px',
                      borderRadius: 6,
                      lineHeight: 1,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.opacity = '1';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.opacity = '0.5';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                    title="Удалить"
                  >
                    {deletingId === note.id ? '...' : '×'}
                  </button>
                </div>

                {/* Контент карточки */}
                <div style={{ padding: '8px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    margin: '0 0 8px',
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: textColor,
                    wordBreak: 'break-word',
                  }}>
                    {note.title}
                  </h3>

                  {previewText && (
                    <p style={{
                      margin: '0 0 10px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: textColor,
                      opacity: 0.75,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}>
                      {previewText}
                    </p>
                  )}

                  {/* Теги */}
                  {(note.tags || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
                      {note.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 11,
                          color: textColor,
                          opacity: 0.8,
                          background: 'rgba(0,0,0,0.08)',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontWeight: 500,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
