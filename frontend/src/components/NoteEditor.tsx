import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
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
  const isEdit = !!id;

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
