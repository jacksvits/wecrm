import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

/**
 * Вложения запросов в поддержку (общее для TenantSupport и TenantTicketsAdmin):
 *  - SupportAttachPicker — кнопка «📎 Прикрепить» + чипы загруженных черновиков до отправки;
 *  - SupportAttachments — просмотр вложений сообщения: картинки превью, видео/аудио плеер,
 *    остальное — ссылка на скачивание. Файлы отдаются с проверкой прав, поэтому
 *    грузятся как blob с токеном и показываются через object URL.
 */

export interface SupFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
}

const fmtSize = (n: number) => {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} КБ`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} МБ`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} ГБ`;
};

const chip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
  padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)', maxWidth: '100%',
};

const attachBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, border: '1px dashed var(--border-color)',
  background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
};

/** Кнопка прикрепления + список уже загруженных (черновых) файлов с удалением */
export function SupportAttachPicker({ files, onChange, disabled }: {
  files: SupFile[];
  onChange: React.Dispatch<React.SetStateAction<SupFile[]>>;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');

  const pick = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setError('');
    const arr = Array.from(list).slice(0, 10 - files.length);
    setUploading((n) => n + arr.length);
    for (const file of arr) {
      api.tenantSupport.uploadAttachment(file)
        .then((a) => onChange((prev) => [...prev, a as SupFile]))
        .catch((e: any) => setError(e.message || 'Не удалось загрузить файл'))
        .finally(() => setUploading((n) => n - 1));
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (id: string) => {
    onChange((prev) => prev.filter((f) => f.id !== id));
    api.tenantSupport.deleteAttachment(id).catch(() => {});
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => pick(e.target.files)}
      />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          style={attachBtn}
          disabled={disabled || uploading > 0 || files.length >= 10}
          onClick={() => inputRef.current?.click()}
        >
          📎 Прикрепить файл{files.length > 0 ? ` (${files.length}/10)` : ''}
        </button>
        {uploading > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Загрузка...</span>}
        {files.map((f) => (
          <span key={f.id} style={chip} title={f.originalName}>
            📎 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{f.originalName}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtSize(f.size)}</span>
            <span
              role="button" title="Убрать файл"
              style={{ color: '#dc2626', cursor: 'pointer', padding: '0 2px' }}
              onClick={() => remove(f.id)}
            >✕</span>
          </span>
        ))}
      </div>
      {error && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

/** Одно вложение: blob с токеном → object URL (картинка/видео/аудио/файл) */
function AttachmentView({ f }: { f: SupFile }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    api.tenantSupport.downloadAttachment(f.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setFailed(true));
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [f.id]);

  if (failed) return <span style={{ ...chip, color: '#dc2626' }}>⚠ {f.originalName} — не удалось загрузить</span>;
  if (!url) return <span style={{ ...chip, color: 'var(--text-muted)' }}>⏳ {f.originalName}</span>;

  if (f.mimeType.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer" title={`${f.originalName} (${fmtSize(f.size)})`}>
        <img
          src={url}
          alt={f.originalName}
          style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border-color)', display: 'block' }}
        />
      </a>
    );
  }
  if (f.mimeType.startsWith('video/')) {
    return (
      <video
        src={url}
        controls
        style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, border: '1px solid var(--border-color)', display: 'block', background: '#000' }}
      />
    );
  }
  if (f.mimeType.startsWith('audio/')) {
    return (
      <div style={chip}>
        🎵 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{f.originalName}</span>
        <audio src={url} controls style={{ height: 28 }} />
      </div>
    );
  }
  return (
    <a href={url} download={f.originalName} style={{ ...chip, textDecoration: 'none', cursor: 'pointer' }} title="Скачать">
      📎 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{f.originalName}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtSize(f.size)}</span>
    </a>
  );
}

/** Список вложений сообщения переписки */
export function SupportAttachments({ items }: { items?: SupFile[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map((f) => <AttachmentView key={f.id} f={f} />)}
    </div>
  );
}
