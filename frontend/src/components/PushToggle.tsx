import { usePush } from '../hooks/usePush';

export function PushToggle() {
  const { supported, subscribed, subscribe, unsubscribe, error } = usePush();

  if (!supported) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {subscribed ? (
        <button
          onClick={unsubscribe}
          title="Отключить push-уведомления"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <span className="desktop-only-text">Push ON</span>
        </button>
      ) : (
        <button
          onClick={subscribe}
          title="Включить push-уведомления"
          style={{
            background: 'var(--accent-color, #2563eb)',
            border: 'none',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="desktop-only-text">Push OFF</span>
        </button>
      )}
      {error && (
        <span style={{ color: '#dc2626', fontSize: 11, maxWidth: 120 }} title={error}>
          Ошибка
        </span>
      )}
    </div>
  );
}
