import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Статусы отправлений OZON → русские подписи
const STATUS_LABELS: Record<string, string> = {
  awaiting_registration: 'Ожидает регистрации',
  awaiting_confirm: 'Ожидает подтверждения',
  assembling: 'В сборке',
  awaiting_packaging: 'Собирается',
  awaiting_delivering: 'Ожидает отгрузки',
  delivering: 'Доставляется',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  not_accepted: 'Не принят',
  delayed: 'Задерживается',
  shipped: 'Отгружен',
  pending: 'В обработке',
};
const RESERVE_STATUSES = new Set(['awaiting_registration', 'awaiting_confirm', 'assembling', 'awaiting_packaging', 'awaiting_delivering']);

function statusStyle(status: string): React.CSSProperties {
  if (status === 'delivered') return { background: '#dcfce7', color: '#16a34a' };
  if (status === 'cancelled') return { background: '#fee2e2', color: '#dc2626' };
  if (status === 'delivering' || status === 'shipped') return { background: '#dbeafe', color: '#2563eb' };
  return { background: '#fef3c7', color: '#b45309' }; // новые/в работе
}

const thStyle: React.CSSProperties = { textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, padding: '8px 10px', borderBottom: '1px solid var(--border-color)' };
const tdStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--border-color)', fontSize: 13, verticalAlign: 'top' };

/** Вкладка «OZON Заказы»: заказы из кабинета + резервы по новым заказам (только просмотр) */
export default function OzonOrdersPanel() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{ postings: any[]; reserves: any[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async (d = days) => {
    setBusy(true);
    setError('');
    try {
      setData(await api.ozonPlugin.postings(d));
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки заказов');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const postings = data?.postings || [];
  const reserves = data?.reserves || [];
  const totalReserved = reserves.reduce((s, r) => s + r.quantity, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Заказы OZON</h3>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13 }}>
          <option value={7}>7 дней</option>
          <option value={14}>14 дней</option>
          <option value={30}>30 дней</option>
          <option value={60}>60 дней</option>
          <option value={90}>90 дней</option>
        </select>
        <button onClick={() => load()} disabled={busy} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
          {busy ? 'Загрузка…' : 'Обновить'}
        </button>
        {postings.length > 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>заказов: {postings.length}</span>}
      </div>
      {error && <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(239,68,68,0.12)', color: '#991b1b', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Блок 1: заказы */}
        <div style={{ flex: '1 1 50%', minWidth: 0, border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid var(--border-color)', background: 'var(--surface, #f9fafb)' }}>
            Заказы ({postings.length})
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 640, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Отправление</th>
                  <th style={thStyle}>Дата</th>
                  <th style={thStyle}>Статус</th>
                  <th style={thStyle}>Позиции</th>
                  <th style={thStyle}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {postings.map((p: any) => {
                  const sum = (p.products || []).reduce((s: number, it: any) => s + (it.price || 0) * (it.quantity || 0), 0);
                  return (
                    <tr key={p.posting_number}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{p.posting_number}</div>
                        {p.order_number && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>заказ {p.order_number}</div>}
                      </td>
                      <td style={tdStyle}>{p.created_at ? new Date(p.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, ...statusStyle(p.status) }}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {(p.products || []).map((it: any, i: number) => (
                          <div key={i} style={{ marginBottom: 2 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{it.offer_id}</span>
                            <span style={{ color: 'var(--text-muted)' }}> × {it.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td style={tdStyle}>{sum ? sum.toLocaleString('ru-RU') + ' ₽' : '—'}</td>
                    </tr>
                  );
                })}
                {!postings.length && !busy && (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>Заказов за выбранный период нет</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Блок 2: резервы по новым заказам */}
        <div style={{ flex: '1 1 50%', minWidth: 0, border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid var(--border-color)', background: 'var(--surface, #f9fafb)' }}>
            Резервы по новым заказам ({totalReserved} шт)
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 640, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Артикул</th>
                  <th style={thStyle}>Название</th>
                  <th style={thStyle}>Зарезерв.</th>
                  <th style={thStyle}>Заказы</th>
                </tr>
              </thead>
              <tbody>
                {reserves.map((r: any) => (
                  <tr key={r.offer_id}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{r.offer_id}</td>
                    <td style={{ ...tdStyle, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.name}>{r.name}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{r.quantity}</td>
                    <td style={{ ...tdStyle, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{r.postings.join(', ')}</td>
                  </tr>
                ))}
                {!reserves.length && !busy && (
                  <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>Незавершённых заказов нет — резервы отсутствуют</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
