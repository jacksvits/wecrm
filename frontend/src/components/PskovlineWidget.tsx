import { useEffect, useState } from 'react';

interface PskovlineData {
  balance: number | null;
  period: string | null;
  status: string;
  error?: string;
  updated_at?: string;
}

export function PskovlineWidget() {
  const [data, setData] = useState<PskovlineData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/pskovline', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          setData(await res.json());
        } else {
          setData({ status: 'error', balance: null, period: null, error: 'Ошибка загрузки' });
        }
      } catch {
        setData({ status: 'error', balance: null, period: null, error: 'Сетевой сбой' });
      }
    };
    load();
    const interval = setInterval(load, 300000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-card)', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Загрузка Псковлайн...</div>
      </div>
    );
  }

  const updated = data.updated_at
    ? new Date(data.updated_at).toLocaleString('ru-RU')
    : '—';

  return (
    <div style={{
      padding: 20,
      borderRadius: 16,
      border: '1px solid var(--border-color)',
      background: 'var(--bg-card)',
      boxShadow: 'var(--shadow)',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#2563eb' }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Псковлайн
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 20,
          textTransform: 'uppercase',
          background: data.status === 'ok' ? '#d1fae5' : '#fee2e2',
          color: data.status === 'ok' ? '#065f46' : '#991b1b',
        }}>
          {data.status === 'ok' ? 'активно' : 'ошибка'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Баланс</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: (data.balance ?? 0) >= 0 ? '#10b981' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
            {data.balance !== null ? `${data.balance.toFixed(2)} ₽` : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Период услуги</div>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
            {data.period || '—'}
          </div>
        </div>
      </div>

      {data.error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 12 }}>
          {data.error}
        </div>
      )}

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)', fontSize: 11, color: 'var(--text-muted)' }}>
        Обновлено: {updated}
      </div>
    </div>
  );
}
