import { useCallback, useEffect, useRef, useState } from 'react';

// === Страница «Браузер» ===
// Показывает произвольные сайты внутри CRM. Контент загружается через
// серверный прокси (контейнер vpn: sing-box) эндпоинтом /api/browser/proxy:
// так обходятся X-Frame-Options/CSP и блокировки на стороне сети сервера.
// iframe не отправляет кастомные заголовки, поэтому перед показом ставим
// cookie-сессию (/api/browser/session) с JWT текущего пользователя.
// Навигация по ссылкам происходит внутри iframe (см. onLoad — адресная
// строка синхронизируется с фактическим URL прокси).

const HOME_URL = 'https://google.com';

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return HOME_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function proxyUrlFor(url: string): string {
  return `/api/browser/proxy?url=${encodeURIComponent(url)}`;
}

// Извлекает целевой URL из адреса прокси в iframe
function targetFromProxy(proxyPath: string): string | null {
  try {
    const u = new URL(proxyPath, window.location.origin);
    if (!u.pathname.startsWith('/api/browser/proxy')) return null;
    const target = u.searchParams.get('url');
    return target || null;
  } catch {
    return null;
  }
}

export function Browser() {
  const [address, setAddress] = useState(HOME_URL);
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [historyStack, setHistoryStack] = useState<string[]>([HOME_URL]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const skipSyncRef = useRef(false);
  const historyIndexRef = useRef(historyIndex);
  historyIndexRef.current = historyIndex;
  const currentUrlRef = useRef(currentUrl);
  currentUrlRef.current = currentUrl;

  // Cookie-сессия для прокси (один раз при входе на страницу)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/browser/session', { headers: { 'X-Auth-Token': token } }).catch(() => {});
  }, []);

  const navigate = useCallback((url: string) => {
    const target = normalizeUrl(url);
    setAddress(target);
    setCurrentUrl(target);
    setLoading(true);
    skipSyncRef.current = true; // onLoad после программной навигации не дублирует историю
    setHistoryStack(prev => {
      const next = prev.slice(0, historyIndexRef.current + 1);
      next.push(target);
      return next;
    });
    setHistoryIndex(prev => prev + 1);
  }, []);

  const goBack = useCallback(() => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    const url = historyStack[idx];
    setAddress(url);
    setCurrentUrl(url);
    setLoading(true);
    skipSyncRef.current = true;
  }, [historyIndex, historyStack]);

  const goForward = useCallback(() => {
    if (historyIndex >= historyStack.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    const url = historyStack[idx];
    setAddress(url);
    setCurrentUrl(url);
    setLoading(true);
    skipSyncRef.current = true;
  }, [historyIndex, historyStack]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey(k => k + 1);
  }, []);

  // Клики по ссылкам внутри iframe меняют его адрес — синхронизируем адресную строку
  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    try {
      const iframe = iframeRef.current;
      const href = iframe?.contentWindow?.location.href;
      if (!href) return;
      const target = targetFromProxy(href);
      if (!target || target === currentUrlRef.current) return;
      currentUrlRef.current = target;
      setAddress(target);
      setCurrentUrl(target);
      if (skipSyncRef.current) {
        skipSyncRef.current = false;
        return;
      }
      setHistoryStack(prev => [...prev, target]);
      setHistoryIndex(prev => prev + 1);
    } catch {
      /* cross-origin — игнорируем */
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(address);
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Браузер</h2>
      {/* Панель навигации */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
        <button onClick={goBack} disabled={historyIndex <= 0} title='Назад' style={{ ...iconBtnStyle, opacity: historyIndex <= 0 ? 0.4 : 1 }}>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M15 18l-6-6 6-6' /></svg>
        </button>
        <button onClick={goForward} disabled={historyIndex >= historyStack.length - 1} title='Вперёд' style={{ ...iconBtnStyle, opacity: historyIndex >= historyStack.length - 1 ? 0.4 : 1 }}>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M9 18l6-6-6-6' /></svg>
        </button>
        <button onClick={reload} title='Обновить' style={iconBtnStyle}>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M4 4v6h6M20 20v-6h-6M20 9A8 8 0 006.3 5.3L4 10m0 5a8 8 0 0013.7 3.7L20 14' /></svg>
        </button>
        <button onClick={() => navigate(HOME_URL)} title={`Домой (${HOME_URL})`} style={iconBtnStyle}>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10' /></svg>
        </button>
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder='Введите адрес сайта, например google.com'
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '8px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </form>
        {loading && <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Загрузка…</div>}
      </div>
      {/* Просматриваемая страница */}
      <div style={{ flex: 1, minHeight: 0, borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden', background: '#fff' }}>
        <iframe
          ref={iframeRef}
          key={reloadKey}
          src={proxyUrlFor(currentUrl)}
          onLoad={handleIframeLoad}
          title='Браузер'
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    </div>
  );
}
