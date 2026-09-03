import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { NewsCategory, NewsTag } from '../types';
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

export function NewsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Поля формы
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [labels, setLabels] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Справочники
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [tags, setTags] = useState<NewsTag[]>([]);

  // Состояния UI
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#007AFF');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981');

  // Загрузка справочников и данных для редактирования
  useEffect(() => {
    loadCategories();
    loadTags();
    if (isEdit && id) {
      loadNews();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await api.news.categories();
      setCategories(data || []);
    } catch {}
  };

  const loadTags = async () => {
    try {
      const data = await api.news.tags();
      setTags(data || []);
    } catch {}
  };

  const loadNews = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const n = await api.news.get(id);
      setTitle(n.title || '');
      setSlug(n.slug || '');
      setSummary(n.summary || '');
      setContent(n.content || '');
      setCoverImage(n.coverImage || '');
      setCategoryId(n.categoryId || '');
      setSubcategoryId(n.subcategoryId || '');
      setSelectedTagIds(n.tags?.map((t: any) => t.id) || []);
      setLabels(n.labels?.join(', ') || '');
      setIsPublished(n.isPublished || false);
    } catch (e: any) {
      setError('Не удалось загрузить новость');
    }
    setLoading(false);
  };

  const subcategories = categories.find(c => c.id === categoryId)?.subcategories || [];

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      setError('Введите заголовок');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const data = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        summary: summary.trim() || null,
        content: content.trim(),
        coverImage: coverImage.trim() || null,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
        tagIds: selectedTagIds,
        labels: labels.split(',').map(l => l.trim()).filter(Boolean),
        isPublished: publish,
      };

      if (isEdit && id) {
        await api.news.update(id, data);
      } else {
        await api.news.create(data);
      }
      navigate('/news');
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения');
    }
    setSaving(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const slug = newCategoryName.toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
        .replace(/^-|-$/g, '');
      const cat = await api.news.createCategory({
        name: newCategoryName.trim(),
        slug: slug + '-' + Date.now(),
        color: newCategoryColor,
      });
      setCategories([...categories, { ...cat, subcategories: [] }]);
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch (e: any) {
      alert(e.message || 'Ошибка создания категории');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const slug = newTagName.toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
        .replace(/^-|-$/g, '');
      const tag = await api.news.createTag({
        name: newTagName.trim(),
        slug: slug + '-' + Date.now(),
        color: newTagColor,
      });
      setTags([...tags, tag]);
      setSelectedTagIds([...selectedTagIds, tag.id]);
      setNewTagName('');
      setShowTagModal(false);
    } catch (e: any) {
      alert(e.message || 'Ошибка создания тега');
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={() => navigate('/news')}
          style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 14 }}
        >
          ← Назад к новостям
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {isEdit ? 'Редактировать новость' : 'Создать новость'}
        </h2>
      </div>

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
          placeholder="Введите заголовок новости"
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

      {/* Slug */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
          URL-идентификатор (slug)
        </label>
        <input
          type="text"
          value={slug}
          onChange={e => setSlug(e.target.value)}
          placeholder="автоматически из заголовка"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
            color: 'var(--text-muted)',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {/* Краткое описание */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
          Краткое описание
        </label>
        <ReactQuill
          theme="snow"
          value={summary}
          onChange={setSummary}
          placeholder="Краткое описание для карточки новости"
          modules={quillModules}
          formats={quillFormats}
          style={{
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
          }}
        />
      </div>

      {/* Контент */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
          Полный текст *
        </label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          placeholder="Полный текст новости"
          modules={quillModules}
          formats={quillFormats}
          style={{
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-color)',
            minHeight: 200,
          }}
        />
      </div>

      {/* Обложка */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
          URL обложки
        </label>
        <input
          type="text"
          value={coverImage}
          onChange={e => setCoverImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
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

      {/* Категория и подкатегория */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Категория</label>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 12 }}
          >
            + Новая категория
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={categoryId}
            onChange={e => { setCategoryId(e.target.value); setSubcategoryId(''); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <option value="">Без категории</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {subcategories.length > 0 && (
            <select
              value={subcategoryId}
              onChange={e => setSubcategoryId(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <option value="">Без подкатегории</option>
              {subcategories.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Теги */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Теги</label>
          <button
            onClick={() => setShowTagModal(true)}
            style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 12 }}
          >
            + Новый тег
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map(tag => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: `1px solid ${selected ? tag.color : 'var(--border-color)'}`,
                  background: selected ? tag.color + '20' : 'var(--bg-color)',
                  color: selected ? tag.color : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: selected ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                #{tag.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Метки */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
          Метки (через запятую)
        </label>
        <input
          type="text"
          value={labels}
          onChange={e => setLabels(e.target.value)}
          placeholder="важно, срочно, архив"
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

      {/* Публикация */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          id="isPublished"
          checked={isPublished}
          onChange={e => setIsPublished(e.target.checked)}
          style={{ width: 18, height: 18, cursor: 'pointer' }}
        />
        <label htmlFor="isPublished" style={{ fontSize: 14, cursor: 'pointer', color: 'var(--text-color)' }}>
          Опубликовать сразу
        </label>
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => handleSave(false)}
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
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить черновик'}
        </button>
        <button
          onClick={() => handleSave(true)}
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
          {saving ? 'Публикация...' : (isEdit ? 'Сохранить и опубликовать' : 'Опубликовать')}
        </button>
      </div>

      {/* Модал создания категории */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowCategoryModal(false)}>
          <div style={{
            background: 'var(--bg-color)',
            borderRadius: 16,
            padding: 24,
            width: 360,
            border: '1px solid var(--border-color)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Новая категория</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Название категории"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontSize: 14,
                marginBottom: 12,
                outline: 'none',
              }}
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={e => setNewCategoryColor(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 10, border: 'none', marginBottom: 16, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCategoryModal(false)}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: 13 }}
              >
                Отмена
              </button>
              <button
                onClick={handleCreateCategory}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#007AFF', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модал создания тега */}
      {showTagModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowTagModal(false)}>
          <div style={{
            background: 'var(--bg-color)',
            borderRadius: 16,
            padding: 24,
            width: 360,
            border: '1px solid var(--border-color)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Новый тег</h3>
            <input
              type="text"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="Название тега"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontSize: 14,
                marginBottom: 12,
                outline: 'none',
              }}
            />
            <input
              type="color"
              value={newTagColor}
              onChange={e => setNewTagColor(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 10, border: 'none', marginBottom: 16, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTagModal(false)}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: 13 }}
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTag}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#007AFF', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
