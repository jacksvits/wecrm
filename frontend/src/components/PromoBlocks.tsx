import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { PromoBlock, ProductCategory } from '../types';

const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#007AFF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnGhost: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };

const FORMAT_LABELS: Record<string, string> = { big: 'Большой (2×2)', wide: 'Широкий (2×1)', square: 'Квадрат (1×1)' };

export default function PromoBlocks() {
  const [blocks, setBlocks] = useState<PromoBlock[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<PromoBlock | 'new' | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const [b, c] = await Promise.all([api.promoBlocks.listAll(), api.products.categories.list()]);
      setBlocks(b);
      setCategories(c);
      setError('');
    } catch (e: any) { setError(e.message || 'Ошибка загрузки'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const catName = (id?: string | null) => categories.find(c => c.id === id)?.name || '—';

  const toggle = async (b: PromoBlock) => {
    await api.promoBlocks.update(b.id, { isActive: !b.isActive });
    await load();
  };

  // Перемещение блока по порядку (обмен sortOrder с соседом)
  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const a = blocks[idx], b = blocks[j];
    await api.promoBlocks.update(a.id, { sortOrder: j });
    await api.promoBlocks.update(b.id, { sortOrder: idx });
    await load();
  };

  const remove = async (b: PromoBlock) => {
    if (!confirm(`Удалить промо-блок «${b.title}»?`)) return;
    await api.promoBlocks.remove(b.id);
    await load();
  };

  const onUpload = async (file: File, editing: PromoBlock | 'new', setImageUrl: (v: string) => void) => {
    setUploading(true);
    try {
      const entityId = editing === 'new' ? `draft-${Date.now()}` : editing.id;
      const att = await api.uploads.upload(file, 'promo-block', entityId);
      setImageUrl(att.path);
    } catch (e: any) { alert(e.message || 'Ошибка загрузки'); }
    setUploading(false);
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Промо-блоки витрины</h2>
        <button style={btnPrimary} onClick={() => setModal('new')}>+ Добавить блок</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Блоки выводятся в разделе «Каталог» витрины. Клик по блоку открывает привязанную категорию.
      </div>
      {error && <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>}
      {loading ? <div>Загрузка…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {blocks.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button style={{ ...btnGhost, padding: '0 8px' }} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button style={{ ...btnGhost, padding: '0 8px' }} disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>↓</button>
              </div>
              {b.imageUrl
                ? <img src={b.imageUrl} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                : <div style={{ width: 56, height: 40, borderRadius: 6, background: 'var(--bg-hover)', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {FORMAT_LABELS[b.format] || b.format} · ссылка: {catName(b.categoryId)} · кнопка: {b.buttonStyle === 'green' ? 'зелёная' : 'синяя'}
                </div>
              </div>
              <button style={{ ...btnGhost, fontSize: 12 }} onClick={() => toggle(b)}>{b.isActive ? 'Активен' : 'Выключен'}</button>
              <button style={btnGhost} onClick={() => setModal(b)}>Изменить</button>
              <button style={{ ...btnGhost, color: '#dc2626' }} onClick={() => remove(b)}>Удалить</button>
            </div>
          ))}
          {!blocks.length && <div style={{ color: 'var(--text-muted)', padding: 16 }}>Блоков пока нет — добавьте первый.</div>}
        </div>
      )}

      {modal && (
        <PromoBlockModal modal={modal} categories={categories} uploading={uploading}
          onUpload={onUpload} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}

/* ---------- Модалка промо-блока ---------- */
function PromoBlockModal({ modal, categories, uploading, onUpload, onClose, onSaved }: {
  modal: PromoBlock | 'new';
  categories: ProductCategory[];
  uploading: boolean;
  onUpload: (file: File, modal: PromoBlock | 'new', setImageUrl: (v: string) => void) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = modal === 'new';
  const b = isNew ? null : modal as PromoBlock;
  const [title, setTitle] = useState(isNew ? '' : b!.title);
  const [subtitle, setSubtitle] = useState(isNew ? '' : (b!.subtitle || ''));
  const [buttonText, setButtonText] = useState(isNew ? 'Подробнее' : b!.buttonText);
  const [buttonStyle, setButtonStyle] = useState<'green' | 'blue'>(isNew ? 'blue' : (b!.buttonStyle || 'blue'));
  const [format, setFormat] = useState<string>(isNew ? 'square' : b!.format);
  const [categoryId, setCategoryId] = useState(isNew ? '' : (b!.categoryId || ''));
  const [imageUrl, setImageUrl] = useState(isNew ? '' : (b!.imageUrl || ''));
  const [sortOrder, setSortOrder] = useState(isNew ? 0 : b!.sortOrder);
  const [isActive, setIsActive] = useState(isNew ? true : b!.isActive);
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim()) { setError('Заголовок обязателен'); return; }
    const data: Partial<PromoBlock> = { title, subtitle, buttonText, buttonStyle, format: format as PromoBlock['format'], categoryId: categoryId || null, imageUrl: imageUrl || null, sortOrder, isActive };
    try {
      if (isNew) await api.promoBlocks.create(data);
      else await api.promoBlocks.update(b!.id, data);
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px' }}>{isNew ? 'Новый промо-блок' : 'Изменить промо-блок'}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Заголовок</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Например: Скидки на серверы" autoFocus />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Подзаголовок</label>
          <input value={subtitle} onChange={e => setSubtitle(e.target.value)} style={inputStyle} placeholder="Необязательно" />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Текст кнопки</label>
          <input value={buttonText} onChange={e => setButtonText(e.target.value)} style={inputStyle} placeholder="Подробнее" />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Стиль кнопки</label>
          <select value={buttonStyle} onChange={e => setButtonStyle(e.target.value as 'green' | 'blue')} style={inputStyle}>
            <option value="blue">Синий (как «В корзину»)</option>
            <option value="green">Зелёный (как «В резерв»)</option>
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Формат блока</label>
          <select value={format} onChange={e => setFormat(e.target.value)} style={inputStyle}>
            <option value="square">Квадрат (1×1)</option>
            <option value="wide">Широкий (2×1)</option>
            <option value="big">Большой (2×2)</option>
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Категория (открывается по клику)</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
            <option value="">Без ссылки</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Картинка</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {imageUrl
              ? <img src={imageUrl} alt="" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 8 }} />
              : <div style={{ width: 96, height: 64, borderRadius: 8, background: 'var(--bg-hover)' }} />}
            <label style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              {uploading ? 'Загрузка…' : 'Выбрать файл'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, modal, setImageUrl); }} />
            </label>
            {imageUrl && <button style={{ ...btnGhost, color: '#dc2626' }} onClick={() => setImageUrl('')}>Убрать</button>}
          </div>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Порядок (чем меньше, тем выше)</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Показывать на витрине
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={save} style={btnPrimary}>Сохранить</button>
            <button onClick={onClose} style={btnGhost}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}
