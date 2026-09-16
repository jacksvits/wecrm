import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Product } from '../types';

const fmtMoney = (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v);
const fmtQty = (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v);

interface VitrineCard {
  product: Product;
  price: any;
  inStock: number;
  image: any;
}

interface ReserveItem {
  product: Product;
  priceTypeId: string;
  price: number;
  quantity: number;
  maxQty: number;
}

export function Vitrine() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [reserveItems, setReserveItems] = useState<ReserveItem[]>([]);
  const [contactId, setContactId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState('');

  useEffect(() => {
    api.products.vitrine()
      .then(setProducts)
      .catch((e: any) => setError(e.message || 'Ошибка загрузки витрины'))
      .finally(() => setLoading(false));
    api.contacts.list().then(setContacts).catch(() => {});
  }, []);

  const origin = window.location.origin;

  const cards = useMemo<VitrineCard[]>(() => products.map((p) => {
    const price = [...(p.prices || [])].sort((a: any, b: any) => (a.priceType?.sortOrder ?? 0) - (b.priceType?.sortOrder ?? 0))[0] as any;
    const inStock = (p.stocks || []).reduce((s, x) => s + Math.max(x.quantity - (x.reserved || 0), 0), 0);
    return { product: p, price, inStock, image: (p.images || [])[0] as any };
  }), [products]);

  const freeQty = (p: Product) =>
    (p.stocks || []).reduce((s, x) => s + Math.max(x.quantity - (x.reserved || 0), 0), 0);

  const openReserve = (p: Product) => {
    const first = (p.prices || [])[0] as any;
    setSaveError(''); setSaveOk('');
    setContactId('');
    setReserveItems([{ product: p, priceTypeId: first?.priceTypeId || '', price: first?.price ?? 0, quantity: 1, maxQty: freeQty(p) }]);
  };

  const addPosition = (p: Product) => {
    if (reserveItems.some((i) => i.product.id === p.id)) return;
    const first = (p.prices || [])[0] as any;
    setReserveItems([...reserveItems, { product: p, priceTypeId: first?.priceTypeId || '', price: first?.price ?? 0, quantity: 1, maxQty: freeQty(p) }]);
  };

  const saveReserve = async () => {
    if (!contactId) { setSaveError('Выберите, на чьё имя'); return; }
    if (!reserveItems.length) { setSaveError('Нет позиций'); return; }
    setSaving(true); setSaveError('');
    try {
      const r: any = await api.reservations.create({
        contactId,
        items: reserveItems.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.price })),
      });
      setSaveOk(`Резерв №${r.number} создан`);
      setTimeout(() => setReserveItems([]), 1200);
    } catch (e: any) {
      setSaveError(e.message || 'Ошибка создания резерва');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Загрузка витрины...</div>;
  if (error) return <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>;
  if (!cards.length && !reserveItems.length) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        На витрине пока нет товаров. Отметьте позиции признаком «На витрине» в разделе «Номенклатура».
      </div>
    );
  }

  return (
    <>
      <style>{`
        .vitrine-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; padding: 4px 2px; overflow-y: auto; }
        @media (max-width: 640px) {
          .vitrine-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .vitrine-card-body { padding: 10px !important; gap: 4px !important; }
          .vitrine-name { font-size: 13px !important; }
          .vitrine-price { font-size: 14px !important; }
          .vitrine-btn { padding: 9px 10px !important; font-size: 13px !important; width: 100%; }
        }
        @media (max-width: 400px) { .vitrine-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="vitrine-grid">
        {cards.map(({ product: p, price, inStock, image }) => (
          <div key={p.id}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ aspectRatio: '1 / 1', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {image ? (
                <img src={`${origin}${image.url}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 40, color: 'var(--text-muted)' }}>📦</span>
              )}
            </div>
            <div className="vitrine-card-body" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div className="vitrine-name" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>{p.name}</div>
              {p.category && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.category}</div>}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div className="vitrine-price" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {price ? `${fmtMoney(price.price)} ₽` : '—'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: inStock > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                  {inStock > 0 ? `В наличии: ${fmtQty(inStock)} ${p.unit}` : 'Нет в наличии'}
                </div>
              </div>
              <button className="vitrine-btn" disabled={inStock <= 0}
                style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: inStock > 0 ? 'pointer' : 'not-allowed', background: inStock > 0 ? '#1a1a1a' : 'var(--bg-hover)', color: inStock > 0 ? '#fff' : 'var(--text-muted)', fontWeight: 600, fontSize: 14 }}
                onClick={() => openReserve(p)}>
                Зарезервировать
              </button>
            </div>
          </div>
        ))}
      </div>

      {reserveItems.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setReserveItems([])}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Резервирование</div>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>На чьё имя</label>
            <select value={contactId} onChange={(e) => setContactId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', marginBottom: 12, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}>
              <option value="">— выберите контакт или организацию —</option>
              {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.kind === 'organization' ? ' (организация)' : ''}</option>)}
            </select>

            {reserveItems.map((item, idx) => (
              <div key={item.product.id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>{item.product.name}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={item.priceTypeId}
                    onChange={(e) => {
                      const pt = (item.product.prices || []).find((x: any) => x.priceTypeId === e.target.value) as any;
                      const next = [...reserveItems];
                      next[idx] = { ...item, priceTypeId: e.target.value, price: pt?.price ?? item.price };
                      setReserveItems(next);
                    }}
                    style={{ flex: '1 1 200px', padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    {(item.product.prices || []).map((x: any) => (
                      <option key={x.priceTypeId} value={x.priceTypeId}>{x.priceType?.label || x.priceType?.name} — {fmtMoney(x.price)} ₽</option>
                    ))}
                  </select>
                  <input type="number" min={1} max={item.maxQty} value={item.quantity}
                    onChange={(e) => {
                      const next = [...reserveItems];
                      next[idx] = { ...item, quantity: Math.max(1, Math.min(Number(e.target.value) || 1, item.maxQty)) };
                      setReserveItems(next);
                    }}
                    style={{ width: 90, padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>доступно {fmtQty(item.maxQty)} {item.product.unit}</span>
                  {reserveItems.length > 1 && (
                    <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}
                      onClick={() => setReserveItems(reserveItems.filter((_, i) => i !== idx))}>Убрать</button>
                  )}
                </div>
              </div>
            ))}

            <select defaultValue="" onChange={(e) => { const p = products.find((x) => x.id === e.target.value); if (p) addPosition(p); e.target.value = ''; }}
              style={{ width: '100%', padding: '8px 12px', marginBottom: 12, borderRadius: 8, border: '1px dashed var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
              <option value="">+ Добавить позицию из витрины</option>
              {products.filter((p) => !reserveItems.some((i) => i.product.id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {saveError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{saveError}</div>}
            {saveOk && <div style={{ color: '#16a34a', fontSize: 13, marginBottom: 10 }}>{saveOk}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 }}
                onClick={() => setReserveItems([])}>Отмена</button>
              <button style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                disabled={saving} onClick={saveReserve}>
                {saving ? 'Сохранение...' : 'Создать резерв'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
