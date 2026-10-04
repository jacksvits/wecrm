import { useCallback, useEffect, useRef, useState } from 'react';

// === Страница «Браузер» ===
// Два режима:
// 1) VNC (по умолчанию) — для пользователя поднимается свой контейнер с
//    настоящим Chromium (/api/browser/vnc), экран показывается через noVNC.
//    Реальный браузер проходит анти-бот проверки сайтов (Google и т.п.),
//    сессии сайтов сохраняются в профиле (персистентный том vnc-data/<uid>).
// 2) Прокси — в iframe загружается страница через серверный прокси
//    (/api/browser/proxy, трафик через sing-box): легче по ресурсам, но
//    сайты с жёсткой защитой могут не открываться.
//
// Аутентификация iframe/ws: cookie wecrm_browser (ставится /api/browser/session,
// iframe не отправляет кастомные заголовки).

const HOME_URL = 'https://google.com';

type BrowserMode = 'vnc' | 'proxy';

function getToken(): string {
  return localStorage.getItem('token') || '';
}

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

const btnBase: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 10,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function Browser() {
  const [mode, setMode] = useState<BrowserMode>(() => (localStorage.getItem('browserMode') as BrowserMode) || 'vnc');
  const [vncUid, setVncUid] = useState<string | null>(null);
  const [vncError, setVncError] = useState('');
  const [vncLoading, setVncLoading] = useState(false);
  // --- состояние прокси-режима ---
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

  // Cookie-сессия для прокси/VNC (один раз при входе на страницу)
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/browser/session', { headers: { 'X-Auth-Token': token } }).catch(() => {});
  }, []);

  // --- VNC: создать/получить сессию ---
  const startVncSession = useCallback(async () => {
    setVncLoading(true);
    setVncError('');
    try {
      const res = await fetch('/api/browser/vnc/session', {
        method: 'POST',
        headers: { 'X-Auth-Token': getToken() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setVncUid(data.uid);
    } catch (e: any) {
      setVncError(e.message || 'Ошибка запуска VNC-сессии');
      setVncUid(null);
    }
    setVncLoading(false);
  }, []);

  useEffect(() => {
    if (mode === 'vnc' && !vncUid) startVncSession();
  }, [mode, vncUid, startVncSession]);

  const restartVncSession = useCallback(async () => {
    setVncUid(null);
    try {
      await fetch('/api/browser/vnc/session', { method: 'DELETE', headers: { 'X-Auth-Token': getToken() } });
    } catch { /* уже остановлена */ }
    startVncSession();
  }, [startVncSession]);

  const switchMode = (m: BrowserMode) => {
    setMode(m);
    localStorage.setItem('browserMode', m);
  };

  // --- прокси: навигация ---
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

  const modeBtnStyle = (m: BrowserMode): React.CSSProperties => ({
    ...btnBase,
    background: mode === m ? 'var(--bg-hover)' : 'var(--bg-card)',
    fontWeight: mode === m ? 600 : 400,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Браузер</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => switchMode('vnc')} style={modeBtnStyle('vnc')} title='Настоящий браузер на сервере: проходит защиты сайтов'>VNC</button>
          <button onClick={() => switchMode('proxy')} style={modeBtnStyle('proxy')} title='Лёгкий режим без запуска браузера (через прокси)'>Прокси</button>
        </div>
      </div>

      {mode === 'vnc' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>Отдельный Chromium на сервере — авторизации и куки сайтов сохраняются между входами.</span>
            <button onClick={restartVncSession} style={btnBase} disabled={vncLoading}>Перезапустить сессию</button>
            {vncLoading && <span>Запуск браузера… (первый запуск до минуты)</span>}
          </div>
          {vncError && (
            <div style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #fca5a5', background: '#fee2e2', color: '#991b1b', fontSize: 14 }}>
              {vncError}
              <button onClick={startVncSession} style={{ ...btnBase, marginLeft: 12 }}>Повторить</button>
            </div>
          )}
          {vncUid && !vncError && (
            <div style={{ flex: 1, minHeight: 0, borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden', background: '#000' }}>
              <iframe
                src={`/api/browser/vnc/${vncUid}/vnc.html?autoconnect=true&resize=scale&path=${encodeURIComponent(`api/browser/vnc/${vncUid}/websockify`)}`}
                title='VNC-браузер'
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
