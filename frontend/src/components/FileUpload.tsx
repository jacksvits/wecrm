import { useState } from 'react';
import { api } from '../api/client';
import { FileAttachment } from '../types';

export function FileUpload({ entityType, entityId, onUpload, isDark, variant = 'default', multiple = false }: { entityType: string; entityId: string; onUpload: (a: FileAttachment) => void; isDark?: boolean; variant?: 'default' | 'button'; multiple?: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLoading(true);
    try {
      for (const file of files) {
        const attachment = await api.uploads.upload(file, entityType, entityId);
        onUpload(attachment);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (variant === 'button') {
    return (
      <label style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: 'none',
        background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
        color: isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.50)',
        fontSize: 20,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s ease',
      }}>
        {loading ? '⏳' : '📎'}
        <input type="file" multiple={multiple} onChange={handleChange} style={{ display: 'none' }} disabled={loading} />
      </label>
    );
  }

  return (
    <label style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
      📎 {loading ? 'Загрузка...' : 'Прикрепить файл'}
      <input type="file" multiple={multiple} onChange={handleChange} style={{ display: 'none' }} disabled={loading} />
    </label>
  );
}

export function AttachmentList({ attachments, onDelete, isDark }: { attachments: FileAttachment[]; onDelete?: (id: string) => void; isDark?: boolean }) {
  if (!attachments?.length) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {attachments.map(a => {
        const previewUrl = a.path.startsWith('http') ? a.path : `${origin}${a.path}`; const downloadUrl = `${origin}/api/uploads/${a.id}/download`;
        const isImage = a.mimeType?.startsWith('image/');
        return (
          <a
            key={a.id}
            href={downloadUrl}
            download={a.originalName}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 12,
              background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
              color: isDark ? '#fff' : '#1a1a1a',
              fontSize: 13,
              textDecoration: 'none',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.08)'}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              maxWidth: '100%',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.10)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)';
            }}
          >
            <span style={{ fontSize: 16 }}>{isImage ? '🖼' : '📎'}</span>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 140,
            }}>
              {a.originalName}
            </span>
            <span style={{ fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap' }}>
              ({(a.size / 1024).toFixed(1)} KB)
            </span>
            {onDelete && (
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(a.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: isDark ? 'rgba(255,255,255,0.70)' : '#999',
                  padding: 0,
                  marginLeft: 2,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </a>
        );
      })}
    </div>
  );
}
