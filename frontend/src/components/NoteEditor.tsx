import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { linkifyTaskTagsHtml, useTaskHashtagClick } from '../lib/taskHashtags';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

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

export function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const onTagClick = useTaskHashtagClick();
  const location = useLocation();
  const isEdit = !!id;
  const isViewMode = isEdit && !location.pathname.endsWith('/edit');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0].value);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadNote();
    }
  }, [id]);

  const loadNote = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const note = await api.notes.get(id);
      setTitle(note.title || '');
      setContent(note.content || '');
      setColor(note.color || NOTE_COLORS[0].value);
      setTags((note.tags || []).join(', '));
    } catch (e: any) {
      setError('Не удалось загрузить заметку');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Введите заголовок');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const data = {
        title: title.trim(),
        content: content.trim(),
        color,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (isEdit && id) {
        await api.notes.update(id, data);
      } else {
        await api.notes.create(data);
      }
      navigate('/notes');
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения');
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;
  }

  // Режим просмотра (read-only)
  if (isViewMode) {
    const textColor = ['#fef3c7', '#d1fae5', '#dbeafe', '#fce7f3', '#e9d5ff', '#ffedd5', '#f3f4f6', '#fee2e2'].includes(color) ? '#1f2937' : '#fff';
    return (
      <div style={{ maxWidth: 800 }}>
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button
            onClick={() => navigate('/notes')}
            style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 14 }}
          >
            ← Назад к заметкам
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate(`/notes/${id}/edit`)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                background: '#007AFF',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Редактировать
            </button>
          </div>
        </div>

        {/* Карточка просмотра */}
        <div style={{
          borderRadius: 16,
          background: color || '#f0f0f0',
          border: '1px solid var(--border-color)',
          padding: '24px 28px',
          minHeight: 300,
        }}>
          <h1 style={{
            margin: '0 0 12px',
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.3,
            color: textColor,
            wordBreak: 'break-word',
          }}>
            {title}
          </h1>

          {/* Теги */}
          {tags && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                <span key={tag} style={{
                  fontSize: 12,
                  color: textColor,
                  opacity: 0.85,
                  background: 'rgba(0,0,0,0.08)',
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontWeight: 500,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Содержимое */}
          <div
            className="rich-text"
            style={{
              fontSize: 15,
              color: textColor,
            }}
            onClick={onTagClick}
            dangerouslySetInnerHTML={{ __html: linkifyTaskTagsHtml(content) }}
          />
        </div>
      </div>
    );
  }

  // Режим редактирования
  return (
    <div style={{ maxWidth: 800 }}>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={() => navigate('/notes')}
          style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 14 }}
        >
          ← Назад к заметкам
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {isEdit ? 'Редактировать заметку' : 'Новая заметка'}
        </h2>
      </div>

      {/* Ошибка */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: '#fee2e2',
          color: '#dc2626',
          marginBottom: 16,
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Заголовок */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
          Заголовок *
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Название заметки"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            fontSize: 15,
            outline: 'none',
          }}
        />
      </div>

      {/* Цвет карточки */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-muted)' }}>
          Цвет карточки
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {NOTE_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              title={c.label}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: c.value,
                border: color === c.value ? '2px solid #007AFF' : '1px solid var(--border-color)',
                cursor: 'pointer',
                boxShadow: color === c.value ? '0 0 0 3px #007AFF30' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Теги */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
          Теги (через запятую)
        </label>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="работа, идеи, важно"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {/* Содержимое (WYSIWYG) */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
          Содержимое
        </label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          placeholder="Введите текст заметки..."
          modules={quillModules}
          formats={quillFormats}
          style={{
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
            minHeight: 250,
          }}
        />
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            background: '#007AFF',
            color: '#fff',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать заметку')}
        </button>
        <button
          onClick={() => navigate('/notes')}
          disabled={saving}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            background: 'var(--bg-hover)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
