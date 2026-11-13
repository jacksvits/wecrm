import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AdBlock } from '../types';

const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#007AFF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnGhost: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };

const POSITION_LABELS: Record<string, string> = { left: 'Слева', right: 'Справа' };
const TYPE_LABELS: Record<string, string> = { banner: 'Баннер', script: 'Скрипт' };
const SIZE_LABELS: Record<string, string> = { small: 'Маленький (240×240)', medium: 'Средний (240×320)', big: 'Большой (240×474)' };

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

  const onUpload = async (file: File, editing: AdBlock | 'new', addImage: (v: string) => void) => {
    setUploading(true);
    try {
      const entityId = editing === 'new' ? `draft-${Date.now()}` : editing.id;
      const att = await api.uploads.upload(file, 'ad-block', entityId);
      addImage(att.path);
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
        Блоки выводятся внутри новости (детальная страница) слева и справа от текста. Маленький — 240×240, средний — 240×320, большой — 240×474. Можно загрузить несколько картинок — они меняются с анимацией (интервал задаётся ниже). Отметьте «Липкий», чтобы блок закрепился при прокрутке. Первый блок колонки закреплён при прокрутке, остальные прокручиваются вместе с текстом.
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
              {b.type === 'script'
                ? <div style={{ width: 56, height: 40, borderRadius: 6, background: 'var(--bg-hover)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>&lt;/&gt;</div>
                : parseImages(b.images, b.imageUrl)[0]
                  ? <img src={parseImages(b.images, b.imageUrl)[0]} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  : <div style={{ width: 56, height: 40, borderRadius: 6, background: 'var(--bg-hover)', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {TYPE_LABELS[b.type || 'banner']} · {POSITION_LABELS[b.position] || b.position}{b.type !== 'script' ? ` · ${SIZE_LABELS[b.size] || b.size}` : ''}{b.isSticky ? ' · липкий' : ''}
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

/** Картинки блока: JSON-массив images, fallback — одиночная imageUrl */
function parseImages(images: string | null | undefined, imageUrl?: string | null): string[] {
  let arr: string[] = [];
  try {
    const parsed = images ? JSON.parse(images) : [];
    if (Array.isArray(parsed)) arr = parsed.filter((u: any) => typeof u === 'string' && u);
  } catch { /* ignore */ }
  if (!arr.length && imageUrl) arr = [imageUrl];
  return arr;
}

/* ---------- Модалка рекламного блока ---------- */
function AdBlockModal({ modal, uploading, onUpload, onClose, onSaved }: {
  modal: AdBlock | 'new';
  uploading: boolean;
  onUpload: (file: File, modal: AdBlock | 'new', addImage: (v: string) => void) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = modal === 'new';
  const b = isNew ? null : modal as AdBlock;
  const [title, setTitle] = useState(isNew ? '' : b!.title);
  const [linkUrl, setLinkUrl] = useState(isNew ? '' : (b!.linkUrl || ''));
  const [position, setPosition] = useState<'left' | 'right'>(isNew ? 'left' : b!.position);
  const [size, setSize] = useState<'small' | 'medium' | 'big'>(isNew ? 'small' : b!.size);
  const [images, setImages] = useState<string[]>(isNew ? [] : parseImages(b!.images, b!.imageUrl));
  const [sortOrder, setSortOrder] = useState(isNew ? 0 : b!.sortOrder);
  const [isActive, setIsActive] = useState(isNew ? true : b!.isActive);
  const [intervalSec, setIntervalSec] = useState(isNew ? 4 : (b!.intervalSec ?? 4));
  const [isSticky, setIsSticky] = useState(isNew ? false : !!b!.isSticky);
  const [blockType, setBlockType] = useState<'banner' | 'script'>(isNew ? 'banner' : ((b!.type as 'banner' | 'script') || 'banner'));
  const [script, setScript] = useState(isNew ? '' : (b!.script || ''));
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim()) { setError('Заголовок обязателен'); return; }
    const data: Omit<Partial<AdBlock>, 'images'> & { images?: string[] } = { title, linkUrl: blockType === 'script' ? null : linkUrl.trim() || null, position, size, imageUrl: images[0] || null, images, sortOrder, isActive, intervalSec, isSticky, type: blockType, script: blockType === 'script' ? script : null };
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
          <label style={{ fontSize: 14, fontWeight: 500 }}>Тип блока</label>
          <select value={blockType} onChange={e => setBlockType(e.target.value as 'banner' | 'script')} style={inputStyle}>
            <option value="banner">Баннер — картинки с ротацией</option>
            <option value="script">Скрипт — вставка HTML/JS-кода</option>
          </select>
          {blockType === 'script' ? (<>
            <label style={{ fontSize: 14, fontWeight: 500 }}>Скрипт (HTML/JS)</label>
            <textarea value={script} onChange={e => setScript(e.target.value)} style={{ ...inputStyle, minHeight: 140, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} placeholder="<script>…</script>" />
          </>) : (<>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Ссылка по клику</label>
          <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} style={inputStyle} placeholder="https://… или /shop — необязательно" />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Размещение</label>
          <select value={position} onChange={e => setPosition(e.target.value as 'left' | 'right')} style={inputStyle}>
            <option value="left">Слева</option>
            <option value="right">Справа</option>
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Размер блока</label>
          <select value={size} onChange={e => setSize(e.target.value as 'small' | 'medium' | 'big')} style={inputStyle}>
            <option value="small">Маленький — 240×240</option>
            <option value="medium">Средний — 240×320</option>
            <option value="big">Большой — 240×474</option>
          </select>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Картинки (несколько — будут меняться с анимацией)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {images.map((u, i) => (
              <div key={u + i} style={{ position: 'relative' }}>
                <img src={u} alt="" style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                <button
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#dc2626', color: '#fff', fontSize: 11, cursor: 'pointer', lineHeight: '18px', padding: 0 }}
                  title="Убрать картинку">×</button>
                {i === 0 && <span style={{ position: 'absolute', bottom: 2, left: 4, fontSize: 9, color: '#fff', background: 'rgba(0,0,0,.55)', borderRadius: 4, padding: '0 4px' }}>первая</span>}
              </div>
            ))}
            <label style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              {uploading ? 'Загрузка…' : '+ Добавить'}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { const fs = Array.from(e.target.files || []); fs.forEach(f => onUpload(f, modal, (v) => setImages(prev => [...prev, v]))); e.target.value = ''; }} />
            </label>
          </div>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Порядок (чем меньше, тем выше; первый блок колонки закреплён)</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={inputStyle} />
          <label style={{ fontSize: 14, fontWeight: 500 }}>Интервал смены картинок, сек (при нескольких картинках)</label>
          <input type="number" min={1} max={120} value={intervalSec} onChange={e => setIntervalSec(Number(e.target.value))} style={inputStyle} />
          </>)}
          <label style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Показывать в новостях
          </label>
          <label style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isSticky} onChange={e => setIsSticky(e.target.checked)} />
            Липкий — закрепить при прокрутке (отступ 68px от верха экрана)
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
