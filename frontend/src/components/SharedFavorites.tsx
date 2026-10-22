import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

// Форматирование суммы как на витрине (пробелы разрядов)
const fmtMoney = (v: string | number) => {
  const [int, dec] = String(v).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${dec ? `.${dec}` : ''}`;
};
const fmtQty = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
};

/**
 * Страница просмотра группы избранного по ссылке-приглашению.
 * Доступна только авторизованным пользователям (роут внутри защищённых).
 * Получатель может ознакомиться с группой и принять её копию в своё избранное.
 */
export function SharedFavorites() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const origin = window.location.origin;

  const [group, setGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState('');
  const [acceptError, setAcceptError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.favorites.getShared(token)
      .then(setGroup)
      .catch((e: any) => setError(e.message || 'Ссылка недействительна или устарела'))
      .finally(() => setLoading(false));
  }, [token]);

  // Минимальная видимая цена товара (как на витрине)
  const favPrice = (prod: any) => {
    const visible = (prod.prices || []).filter((x: any) => Number(x.price) > 0)
      .sort((a: any, b: any) => Number(a.price) - Number(b.price));
    const flagged = visible.filter((x: any) => x.priceType?.forVitrine);
    return (flagged.length ? flagged : visible)[0];
  };
  // Свободный остаток товара
  const favInStock = (prod: any) =>
    (prod.stocks || []).reduce((s: number, x: any) => s + Math.max(x.quantity - (x.reserved || 0), 0), 0);

  const accept = async () => {
    if (!token || accepting) return;
    setAccepting(true);
    setAcceptError('');
    setAccepted('');
    try {
      const r = await api.favorites.acceptShared(token);
      setAccepted(`Группа добавлена в ваше избранное с отметкой «Передано от ${r.sharedByName}»`);
    } catch (e: any) {
      setAcceptError(e.message || 'Ошибка принятия группы');
    }
    setAccepting(false);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={() => navigate(-1)}
          style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
          ← Назад
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Группа избранного передана вам</div>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Загрузка...</div>}
      {error && <div style={{ color: '#ef4444', fontSize: 14 }}>{error}</div>}

      {group && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{group.name}</div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({group.items.length})</span>
            {group.sharedByName && (
              <span style={{ fontSize: 12, color: '#d97706', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, padding: '2px 10px' }}>
                Передано от {group.sharedByName}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!group.items.length && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>В группе нет товаров.</div>}
            {group.items.map((item: any) => {
              const p = item.product;
              if (!p) return null;
              const price = favPrice(p);
              const inStock = favInStock(p);
              const image = (p.images || [])[0];
              return (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 12, padding: 10, background: 'var(--bg-card)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-hover)', flexShrink: 0, position: 'relative' }}>
                    {image ? <img src={`${origin}${image.url}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>📦</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    {p.sku && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Артикул: {p.sku}</div>}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {price && Number(price.price) > 0 ? `${price.priceFrom ? 'от ' : ''}${fmtMoney(price.price)} ₽` : 'Договорная'}
                      {p.kind !== 'service' && (inStock > 0 ? ` · в наличии: ${fmtQty(inStock)} ${p.unit}` : ' · нет в наличии')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {accepted && <div style={{ color: '#16a34a', fontSize: 14 }}>{accepted}</div>}
          {acceptError && <div style={{ color: '#ef4444', fontSize: 14 }}>{acceptError}</div>}
          {!accepted && (
            <button type="button" className="btn-action-cart" disabled={accepting || !group.items.length} onClick={accept}
              style={{ alignSelf: 'flex-start', padding: '10px 20px', fontWeight: 600, opacity: accepting || !group.items.length ? 0.6 : 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {accepting ? 'Сохранение...' : 'Принять в моё избранное'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
