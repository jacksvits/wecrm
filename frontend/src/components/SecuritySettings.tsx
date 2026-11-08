import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

type AuthEvent = {
  id: string;
  tenantSlug: string;
  tenantName: string;
  login: string;
  ipAddress: string;
  device: string;
  clientType: 'mobile' | 'desktop';
  authMethod: string;
  createdAt: string;
};
type AuthEventsResponse = { items: AuthEvent[]; total: number; page: number; pageSize: number; totalPages: number };

const cellStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', verticalAlign: 'middle', fontSize: 13 };
const headStyle: React.CSSProperties = { ...cellStyle, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: 'var(--bg-secondary)' };

export function SecuritySettings() {
  const [data, setData] = useState<AuthEventsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.security.authEvents(targetPage);
      setData(result);
      if (targetPage > result.totalPages) setPage(result.totalPages);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить журнал авторизаций');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Авторизации пользователей</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Успешные входы в главный проект и все организации · по 50 записей</div>
        </div>
        <button onClick={() => load(page)} disabled={loading} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Загрузка…' : 'Обновить'}
        </button>
      </div>
      {error && <div style={{ padding: 14, marginBottom: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c' }}>{error}</div>}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
          <thead><tr>
            <th style={headStyle}>Организация</th><th style={headStyle}>Логин при авторизации</th><th style={headStyle}>IP-адрес</th><th style={headStyle}>Дата и время</th><th style={headStyle}>Устройство</th><th style={headStyle}>Версия</th>
          </tr></thead>
          <tbody>
            {data?.items.map((item) => <tr key={item.id}>
              <td style={cellStyle}><div style={{ fontWeight: 500 }}>{item.tenantName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.tenantSlug}</div></td>
              <td style={{ ...cellStyle, wordBreak: 'break-word' }}>{item.login}</td>
              <td style={{ ...cellStyle, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{item.ipAddress}</td>
              <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{new Date(item.createdAt).toLocaleString('ru-RU')}</td>
              <td style={cellStyle}>{item.device}</td>
              <td style={cellStyle}><span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 8, background: 'var(--bg-secondary)', whiteSpace: 'nowrap' }}>{item.clientType === 'mobile' ? 'Мобильная' : 'Десктопная'}</span></td>
            </tr>)}
            {!loading && data?.items.length === 0 && <tr><td colSpan={6} style={{ ...cellStyle, padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Авторизаций пока нет. Новые входы появятся здесь автоматически.</td></tr>}
            {loading && !data && <tr><td colSpan={6} style={{ ...cellStyle, padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка журнала…</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Всего: {data.total} · Страница {data.page} из {data.totalPages}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={data.page <= 1 || loading} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: data.page <= 1 ? 'default' : 'pointer', opacity: data.page <= 1 ? 0.5 : 1 }}>← Назад</button>
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={data.page >= data.totalPages || loading} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: data.page >= data.totalPages ? 'default' : 'pointer', opacity: data.page >= data.totalPages ? 0.5 : 1 }}>Вперёд →</button>
        </div>
      </div>}
    </div>
  );
}
