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

export function Vitrine() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.products.vitrine()
      .then(setProducts)
      .catch((e: any) => setError(e.message || 'Ошибка загрузки витрины'))
      .finally(() => setLoading(false));
  }, []);

  const origin = window.location.origin;

  const cards = useMemo<VitrineCard[]>(() => products.map((p) => {
    const price = [...(p.prices || [])].sort((a: any, b: any) => (a.priceType?.sortOrder ?? 0) - (b.priceType?.sortOrder ?? 0))[0] as any;
    const inStock = (p.stocks || []).reduce((s, x) => s + Math.max(x.quantity - (x.reserved || 0), 0), 0);
    return { product: p, price, inStock, image: (p.images || [])[0] as any };
  }), [products]);

  if (loading) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Загрузка витрины...</div>;
  if (error) return <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>;
  if (!cards.length) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        На витрине пока нет товаров. Отметьте позиции признаком «На витрине» в разделе «Номенклатура».
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, padding: '4px 2px', overflowY: 'auto' }}>
      {cards.map(({ product: p, price, inStock, image }) => (
        <div
          key={p.id}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ aspectRatio: '1 / 1', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {image ? (
              <img src={`${origin}${image.url}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 40, color: 'var(--text-muted)' }}>📦</span>
            )}
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>{p.name}</div>
            {p.category && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.category}</div>}
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {price ? `${fmtMoney(price.price)} ₽` : '—'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: inStock > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                {inStock > 0 ? `В наличии: ${fmtQty(inStock)} ${p.unit}` : 'Нет в наличии'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
