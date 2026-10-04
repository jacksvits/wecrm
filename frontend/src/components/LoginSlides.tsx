import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../api/client';
import { LoginSlide, LoginBrandText } from '../types';

// Единая стилистика с PromoBlocks.tsx
const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#007AFF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnGhost: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };

// WYSIWYG-редактор — та же конфигурация, что и в остальных текстовых полях проекта
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};
const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

export default function LoginSlides() {
  const [slides, setSlides] = useState<LoginSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<LoginSlide | 'new' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [brandText, setBrandText] = useState<LoginBrandText>({});
  const [textSaved, setTextSaved] = useState(false);

  const load = async () => {
    try {
      const [sl, txt] = await Promise.all([api.loginSlides.listAll(), api.loginSlides.getText()]);
      setSlides(sl);
      setBrandText(txt || {});
      setError('');
    } catch (e: any) { setError(e.message || 'Ошибка загрузки'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveText = async () => {
    try {
      setBrandText(await api.loginSlides.saveText(brandText));
      setTextSaved(true);
      setTimeout(() => setTextSaved(false), 2500);
    } catch (e: any) { alert(e.message || 'Ошибка сохранения'); }
  };

  const toggle = async (s: LoginSlide) => {
    await api.loginSlides.update(s.id, { isActive: !s.isActive });
    await load();
  };

  // Перемещение слайда по порядку (обмен sortOrder с соседом)
  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= slides.length) return;
    const a = slides[idx], b = slides[j];
    await api.loginSlides.update(a.id, { sortOrder: j });
    await api.loginSlides.update(b.id, { sortOrder: idx });
    await load();
  };

  const remove = async (s: LoginSlide) => {
    if (!confirm(`Удалить слайд «${s.title}»?`)) return;
    await api.loginSlides.remove(s.id);
    await load();
  };

  const onUpload = async (file: File, editing: LoginSlide | 'new', setImageUrl: (v: string) => void) => {
    setUploading(true);
    try {
      const entityId = editing === 'new' ? `draft-${Date.now()}` : editing.id;
      const att = await api.uploads.upload(file, 'login-slide', entityId);
      setImageUrl(att.path);
    } catch (e: any) { alert(e.message || 'Ошибка загрузки'); }
    setUploading(false);
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Слайдер авторизации</h2>
        <button style={btnPrimary} onClick={() => setModal('new')}>+ Добавить слайд</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Слайды выводятся по центру левой (зелёной) панели страницы входа. Переключение — автоматическое, без стрелок и индикаторов.
      </div>
      {/* Текст левой панели (под слайдером) */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Текст под слайдером</h3>
          <button style={btnPrimary} onClick={saveText}>{textSaved ? 'Сохранено ✓' : 'Сохранить текст'}</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Заголовок и подзаголовок внизу зелёной панели страницы входа. Пустое поле — текст по умолчанию.
        </div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Заголовок — первая строка</label>
        <div style={{ background: 'var(--bg-card)' }}>
          <ReactQuill theme="snow" value={brandText.title || ''} onChange={v => setBrandText(t => ({ ...t, title: v }))}
            modules={quillModules} formats={quillFormats} placeholder="Управляйте бизнесом" />
        </div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Заголовок — акцентная строка (градиент)</label>
        <div style={{ background: 'var(--bg-card)' }}>
          <ReactQuill theme="snow" value={brandText.accent || ''} onChange={v => setBrandText(t => ({ ...t, accent: v }))}
            modules={quillModules} formats={quillFormats} placeholder="в одном окне" />
        </div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Подзаголовок</label>
        <div style={{ background: 'var(--bg-card)' }}>
          <ReactQuill theme="snow" value={brandText.subtitle || ''} onChange={v => setBrandText(t => ({ ...t, subtitle: v }))}
            modules={quillModules} formats={quillFormats} placeholder="Клиенты, сделки, задачи и коммуникации — всё под рукой." />
        </div>
      </div>

      {error && <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>}
      {loading ? <div>Загрузка…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slides.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button style={{ ...btnGhost, padding: '0 8px' }} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button style={{ ...btnGhost, padding: '0 8px' }} disabled={i === slides.length - 1} onClick={() => move(i, 1)}>↓</button>
              </div>
              {s.imageUrl
                ? <img src={s.imageUrl} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                : <div style={{ width: 56, height: 40, borderRadius: 6, background: 'var(--bg-hover)', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {s.description ? 'с описанием' : 'без описания'}
                </div>
              </div>
              <button style={{ ...btnGhost, fontSize: 12 }} onClick={() => toggle(s)}>{s.isActive ? 'Активен' : 'Выключен'}</button>
              <button style={btnGhost} onClick={() => setModal(s)}>Изменить</button>
              <button style={{ ...btnGhost, color: '#dc2626' }} onClick={() => remove(s)}>Удалить</button>
            </div>
          ))}
          {!slides.length && <div style={{ color: 'var(--text-muted)', padding: 16 }}>Слайдов пока нет — добавьте первый.</div>}
        </div>
      )}

      {modal && (
        <LoginSlideModal modal={modal} uploading={uploading}
          onUpload={onUpload} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}

/* ---------- Модалка слайда ---------- */
function LoginSlideModal({ modal, uploading, onUpload, onClose, onSaved }: {
  modal: LoginSlide | 'new';
  uploading: boolean;
  onUpload: (file: File, modal: LoginSlide | 'new', setImageUrl: (v: string) => void) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = modal === 'new';
  const s = isNew ? null : modal as LoginSlide;
  const [title, setTitle] = useState(isNew ? '' : s!.title);
  const [description, setDescription] = useState(isNew ? '' : (s!.description || ''));
  const [imageUrl, setImageUrl] = useState(isNew ? '' : (s!.imageUrl || ''));
  const [sortOrder, setSortOrder] = useState(isNew ? 0 : s!.sortOrder);
  const [isActive, setIsActive] = useState(isNew ? true : s!.isActive);
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim()) { setError('Заголовок обязателен'); return; }
    if (!imageUrl) { setError('Загрузите изображение слайда'); return; }
    const data: Partial<LoginSlide> = { title, description, imageUrl, sortOrder, isActive };
    try {
      if (isNew) await api.loginSlides.create(data);
      else await api.loginSlides.update(s!.id, data);
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px' }}>{isNew ? 'Новый слайд' : 'Изменить слайд'}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Заголовок</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Например: CRM для вашего бизнеса" autoFocus />

          <label style={{ fontSize: 14, fontWeight: 500 }}>Описание</label>
          <div style={{ background: 'var(--bg-card)' }}>
            <ReactQuill
              theme="snow"
              value={description}
              onChange={setDescription}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Короткий текст под заголовком слайда"
            />
          </div>

          <label style={{ fontSize: 14, fontWeight: 500 }}>Изображение</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ ...btnGhost, display: 'inline-block' }}>
              {uploading ? 'Загрузка…' : 'Загрузить файл'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, modal, setImageUrl); e.target.value = ''; }} />
            </label>
            {imageUrl && <span style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{imageUrl}</span>}
          </div>
          {imageUrl && <img src={imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-color)' }} />}

          <label style={{ fontSize: 14, fontWeight: 500 }}>Порядковый номер</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value) || 0)} style={inputStyle} />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Активен (показывается на странице входа)
          </label>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnGhost} onClick={onClose}>Отмена</button>
            <button style={btnPrimary} onClick={save} disabled={uploading}>Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  );
}
