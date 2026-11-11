import { useEffect, useState } from 'react';
import { useBrandLogo } from '../lib/branding';

// Публичная страница ссылки «Поделиться» — welans.click/s/<token> (без входа).
// Файл: карточка с кнопкой скачивания. Папка: содержимое со скачиванием файлов
// и подпапок + кнопка «Скачать всё (ZIP)».
export default function SharedFilePage({ token }: { token: string }) {
  const brandLogo = useBrandLogo(false);
  const isMobile = window.innerWidth < 768;
  const [meta, setMeta] = useState<any>(null);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [folderPath, setFolderPath] = useState('');

  useEffect(() => {
    fetch(`/api/files/public-share/${encodeURIComponent(token)}/meta`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Ссылка недействительна');
        setMeta(data);
      })
      .catch((e) => setError(e.message || 'Ошибка загрузки'));
  }, [token]);

  useEffect(() => {
    if (!meta?.isFolder) return;
    fetch(`/api/files/public-share/${encodeURIComponent(token)}/browse?path=${encodeURIComponent(folderPath)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Ошибка чтения папки'))))
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [meta, folderPath, token]);

  const apiBase = `/api/files/public-share/${encodeURIComponent(token)}`;
  const formatSize = (size: number) => {
    if (size >= 1073741824) return (size / 1073741824).toFixed(1) + ' ГБ';
    if (size >= 1048576) return (size / 1048576).toFixed(1) + ' МБ';
    if (size >= 1024) return Math.round(size / 1024) + ' КБ';
    return size + ' Б';
  };
  const fileIcon = (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#EAF3FF" />
      <path d="M14 2v6h6" />
    </svg>
  );
  const folderIcon = (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="#D8EBFF" />
    </svg>
  );
  const loginBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: isMobile ? '8px 16px' : '10px 20px', borderRadius: 12, whiteSpace: 'nowrap',
    border: '1px solid rgba(120,180,255,0.40)',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)',
    color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
  };
  const downloadBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 600,
    textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,122,255,0.35)',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-body, #f5f5f5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '8px 12px' : '10px 16px', borderBottom: '1px solid var(--border-color, #e5e5e5)', background: 'var(--bg-card, #fff)' }}>
        <a href="https://welans.ru" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="WeLANS — на главную">
          <img src={brandLogo} alt="WeLANS" style={{ height: isMobile ? 28 : 34, maxWidth: 140, objectFit: 'contain' }} />
        </a>
        <div style={{ flex: 1, minWidth: 0 }} />
        <a href="https://welans.cc/" style={loginBtnStyle}>Войти</a>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px' : '24px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          {error ? (
            <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e5e5)', borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Ссылка недоступна</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted, #999)' }}>{error}</div>
            </div>
          ) : !meta ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted, #999)' }}>Загрузка…</div>
          ) : !meta.isFolder ? (
            <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e5e5)', borderRadius: 16, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                {fileIcon}
                <div style={{ fontSize: 17, fontWeight: 600, wordBreak: 'break-all', textAlign: 'left' }}>{meta.name}</div>
              </div>
              <a href={`${apiBase}/download`} style={downloadBtnStyle} download>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Скачать
              </a>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e5e5)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-color, #e5e5e5)', flexWrap: 'wrap' }}>
                {folderIcon}
                <div style={{ fontSize: 16, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={meta.name}>
                  {meta.name}{folderPath ? ` / ${folderPath.replace(/\//g, ' / ')}` : ''}
                </div>
                {folderPath && (
                  <button
                    onClick={() => setFolderPath(folderPath.split('/').slice(0, -1).join('/'))}
                    style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border-color, #e5e5e5)', background: 'transparent', color: 'var(--text-primary, #1a1a1a)', fontSize: 13, cursor: 'pointer' }}
                  >
                    Назад
                  </button>
                )}
                <a href={`${apiBase}/download-folder?path=${encodeURIComponent(folderPath)}`} style={{ ...downloadBtnStyle, padding: '8px 14px', fontSize: 13 }} download>
                  Скачать всё (ZIP)
                </a>
              </div>
              {items.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted, #999)' }}>Папка пуста</div>
              ) : items.map((item: any) => (
                <div
                  key={item.name}
                  onClick={() => item.isDirectory && setFolderPath(folderPath ? `${folderPath}/${item.name}` : item.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderTop: '1px solid var(--border-color, #e5e5e5)', cursor: item.isDirectory ? 'pointer' : 'default', fontSize: 14 }}
                >
                  <div style={{ flexShrink: 0, display: 'flex' }}>{item.isDirectory ? folderIcon : fileIcon}</div>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>{item.name}</div>
                  <div style={{ color: 'var(--text-muted, #999)', fontSize: 12, flexShrink: 0 }}>{item.isDirectory ? 'Папка' : formatSize(item.size)}</div>
                  <a
                    href={item.isDirectory
                      ? `${apiBase}/download-folder?path=${encodeURIComponent(folderPath ? `${folderPath}/${item.name}` : item.name)}`
                      : `${apiBase}/download?path=${encodeURIComponent(folderPath ? `${folderPath}/${item.name}` : item.name)}`}
                    onClick={(e) => e.stopPropagation()}
                    download
                    title={item.isDirectory ? 'Скачать папку как ZIP' : 'Скачать'}
                    style={{ flexShrink: 0, color: '#007AFF', display: 'flex' }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
