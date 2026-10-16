import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

/** Контакт CRM, выбранный через поиск */
export interface PickedContact {
  id: string;
  name: string;
  phone?: string | null;
  kind?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color)',
  fontSize: 14, outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block',
};

/**
 * Единый выбор контакта из CRM: серверный поиск (debounce 300 мс) с выпадающим
 * списком совпадений (имя, бейдж «орг.», телефон). Основа — поле «Клиент»
 * новой записи расписания; используется в расписании и в задачах.
 *
 * `text` — значение поля ввода (свободный текст допускается, выбор сбрасывается),
 * `selected` — привязанный контакт (показываем крестик очистки).
 */
export function ContactPicker({ label, text, onTextChange, selected, onSelect, placeholder, clearable = true }: {
  label?: string;
  text: string;
  onTextChange: (text: string) => void;
  selected: PickedContact | null;
  onSelect: (contact: PickedContact | null) => void;
  placeholder?: string;
  clearable?: boolean;
}) {
  const [results, setResults] = useState<PickedContact[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  // Серверный поиск: пока текст совпадает с выбранным контактом — не ищем, просто показываем выбор
  useEffect(() => {
    const q = text.trim();
    if (selected && q === selected.name) { setResults([]); return; }
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      api.contacts.list(`search=${encodeURIComponent(q)}&limit=6`)
        // При передаче limit бэкенд возвращает объект пагинации { contacts, ... }, без limit — массив
        .then((data: any) => {
          const list = Array.isArray(data) ? data : (data?.contacts || []);
          setResults(list.slice(0, 6));
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [text, selected]);

  // Закрытие списка по клику вне поля
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (c: PickedContact) => {
    onSelect(c);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={{ ...inputStyle, paddingRight: selected && clearable ? 32 : undefined }}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          onTextChange(e.target.value);
          // Ручной ввод сбрасывает прежний выбор — он восстановится при клике по варианту
          if (selected) onSelect(null);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter' && open && results.length > 0) {
            const target = results[activeIndex] || (results.length === 1 ? results[0] : null);
            if (target) {
              e.preventDefault();
              pick(target);
            }
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {selected && clearable && (
        <button
          type="button"
          title="Очистить"
          onClick={() => {
            onTextChange('');
            onSelect(null);
            setOpen(false);
          }}
          style={{
            position: 'absolute', right: 8, top: label ? 29 : '50%', transform: label ? 'none' : 'translateY(-50%)',
            border: 'none', background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 2,
          }}
        >
          ×
        </button>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 4,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden',
        }}>
          {results.map((c, i) => (
            <div
              key={c.id}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 14, display: 'flex',
                justifyContent: 'space-between', gap: 8,
                background: i === activeIndex ? 'var(--bg-hover)' : 'transparent',
              }}
              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                {c.kind === 'organization' && (
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'var(--bg-hover)', color: 'var(--text-muted)', flexShrink: 0 }}>орг.</span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>{c.phone || ''}</span>
            </div>
          ))}
        </div>
      )}
      {searching && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Поиск...</div>}
    </div>
  );
}
