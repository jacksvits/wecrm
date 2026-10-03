import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

type MySubscription = {
  id: string;
  number: number;
  price: number | string;
  period: string;
  status: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string; unit?: string } | null;
  contact?: { id: string; name: string } | null;
};

const PERIOD_LABELS: Record<string, string> = {
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  active: 'Активна',
  paused: 'Приостановлена',
  cancelled: 'Отменена',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new: { bg: '#dbeafe', color: '#1d4ed8' },
  active: { bg: '#dcfce7', color: '#166534' },
  paused: { bg: '#fef3c7', color: '#92400e' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

const formatMoney = (v: number | string) =>
  Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function MySubscriptions() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = () =>
    api.subscriptions
      .my()
      .then((data: any) => setItems(Array.isArray(data) ? data : []))
      .catch((e: any) => setError(e.message || 'Ошибка загрузки подписок'))
      .finally(() => setLoading(false));

  const handleCancel = (s: MySubscription) => {
    if (!window.confirm(`Отказаться от подписки «${s.product?.name || 'Услуга'}» (№${s.number})?`)) return;
    setCancelError('');
    setCancellingId(s.id);
    api.subscriptions
      .cancel(s.id)
      .then(() => load())
      .catch((e: any) => setCancelError(e.message || 'Не удалось отменить подписку'))
      .finally(() => setCancellingId(null));
  };

  useEffect(() => { load() ; }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Мои подписки</h2>
        <button
          onClick={() => navigate('/products')}
          style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#0077ff', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Перейти к витрине
        </button>
      </div>

      {error && (
        <div style={{ padding: 14, borderRadius: 12, background: '#fee2e2', color: '#991b1b', marginBottom: 14, fontSize: 14, fontWeight: 500 }}>{error}</div>
      )}

      {cancelError && (
        <div style={{ padding: 14, borderRadius: 12, background: '#fee2e2', color: '#991b1b', marginBottom: 14, fontSize: 14, fontWeight: 500 }}>{cancelError}</div>
      )}

      {!error && items.length === 0 && (
        <div style={{ padding: 24, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          У вас пока нет оформленных подписок
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(s => {
          const st = STATUS_COLORS[s.status] || { bg: 'var(--bg-hover)', color: 'var(--text-primary)' };
          return (
            <div
              key={s.id}
              style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {s.product?.name || 'Услуга'}
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                  {STATUS_LABELS[s.status] || s.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                <div>
                  Номер заявки: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>№{s.number}</span>
                </div>
                <div>
                  Период оплаты: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{PERIOD_LABELS[s.period] || s.period}</span>
                </div>
                <div>
                  Цена за период: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatMoney(s.price)} ₽</span>
                </div>
                {s.contact && (
                  <div>
                    Контрагент: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.contact.name}</span>
                  </div>
                )}
                <div>
                  Оформлена: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(s.createdAt)}</span>
                </div>
                <div>
                  Обновлена: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(s.updatedAt)}</span>
                </div>
              </div>

              {s.comment && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  Комментарий: {s.comment}
                </div>
              )}

              {s.status !== 'cancelled' && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleCancel(s)}
                    disabled={cancellingId === s.id}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: cancellingId === s.id ? 0.6 : 1 }}
                  >
                    {cancellingId === s.id ? 'Отмена...' : 'Отказаться от подписки'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
