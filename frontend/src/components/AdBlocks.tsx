import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AdBlock } from '../types';

const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#007AFF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnGhost: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };

const POSITION_LABELS: Record<string, string> = { left: 'Слева', right: 'Справа' };
const SIZE_LABELS: Record<string, string> = { small: 'Маленький (220×220)', medium: 'Средний (220×293)', big: 'Большой (220×435)' };

export default function AdBlocks() {
  const [blocks, setBlocks] = useState<AdBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<AdBlock | 'new' | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const b = await api.adBlocks.listAll();
      setBlocks(b);
      setError('');
    } catch (e: any) { setError(e.message || 'Ошибка загрузки'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (b: AdBlock) => {
    await api.adBlocks.update(b.id, { isActive: !b.isActive });
    await load();
  };

  // Перемещение блока по порядку (обмен sortOrder с соседом)
  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const a = blocks[idx], b = blocks[j];
    await api.adBlocks.update(a.id, { sortOrder: j });
    await api.adBlocks.update(b.id, { sortOrder: idx });
    await load();
  };

  const remove = async (b: AdBlock) => {
    if (!confirm(`Удалить рекламный блок «${b.title}»?`)) return;
    await api.adBlocks.remove(b.id);
    await load();
  };

  const onUpload = async (file: File, editing: AdBlock | 'new', setImageUrl: (v: string) => void) => {
    setUploading(true);
    try {
      const entityId = editing === 'new' ? `draft-${Date.now()}` : editing.id;
      const att = await api.uploads.upload(file, 'ad-block', entityId);
      setImageUrl(att.path);
    } catch (e: any) { alert(e.message || 'Ошибка загрузки'); }
    setUploading(false);
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Рекламные блоки новостей</h2>
        <button style={btnPrimary} onClick={() => setModal('new')}>+ Добавить блок</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Блоки выводятся внутри новости (детальная страница) слева и справа от текста. Маленький — 220×220, средний — 220×293, большой — 220×435. Первый блок колонки закреплён при прокрутке, остальные прокручиваются вместе с текстом.
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
                  {POSITION_LABELS[b.position] || b.position} · {SIZE_LABELS[b.size] || b.size} · ссылка: {b.linkUrl || '—'}
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
        <AdBlockModal modal={modal} uploading={uploading}
          onUpload={onUpload} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}

/* ---------- Модалка рекламного блока ---------- */
function AdBlockModal({ modal, uploading, onUpload, onClose, onSaved }: {
  modal: AdBlock | 'new';
  uploading: boolean;
  onUpload: (file: File, modal: AdBlock | 'new', setImageUrl: (v: string) => void) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = modal === 'new';
  const b = isNew ? null : modal as AdBlock;
  const [title, setTitle] = useState(isNew ? '' : b!.title);
  const [linkUrl, setLinkUrl] = useState(isNew ? '' : (b!.linkUrl || ''));
  const [position, setPosition] = useState<'left' | 'right'>(isNew ? 'left' : b!.position);
  const [size, setSize] = useState<'small' | 'big'>(isNew ? 'small' : b!.size);
  const [imageUrl, setImageUrl] = useState(isNew ? '' : (b!.imageUrl || ''));
  const [sortOrder, setSortOrder] = useState(isNew ? 0 : b!.sortOrder);
  const [isActive, setIsActive] = useState(isNew ? true : b!.isActive);
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim()) { setError('Заголовок обязателен'); return; }
    const data: Partial<AdBlock> = { title, linkUrl: linkUrl.trim() || null, position, size, imageUrl: imageUrl || null, sortOrder, isActive };
    try {
      if (isNew) await api.adBlocks.create(data);
      else await api.adBlocks.update(b!.id, data);
      onSaved();
    } catch (e: any) { setError(e.message || 'Ошибка'); }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px' }}>{isNew ? 'Новый рекламный блок' : 'Изменить рекламный блок'}</h3>
        {error && <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Заголовок</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Например: Акция на монтаж СКС" autoFocus />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Ссылка по клику</label>
          <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} style={inputStyle} placeholder="https://… или /shop — необязательно" />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Размещение</label>
          <select value={position} onChange={e => setPosition(e.target.value as 'left' | 'right')} style={inputStyle}>
            <option value="left">Слева</option>
            <option value="right">Справа</option>
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Размер блока</label>
          <select value={size} onChange={e => setSize(e.target.value as 'small' | 'big')} style={inputStyle}>
            <option value="small">Маленький — 220×220</option>
            <option value="medium">Средний — 220×293</option>
            <option value="big">Большой — 220×435</option>
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
          <label style={{ fontSize: 14, fontWeight: 500 }}>Порядок (чем меньше, тем выше; первый блок колонки закреплён)</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Показывать в новостях
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
