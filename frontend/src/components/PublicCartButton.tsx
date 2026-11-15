import { useEffect, useState } from 'react';

function readCartCount(): number {
  try {
    return (JSON.parse(localStorage.getItem('wecrm_vitrine_cart') || '[]') as any[])
      .reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  } catch { return 0; }
}

// Кнопка «Корзина» в шапке публичных страниц каталога.
// Счётчик — из того же localStorage и события wecrm:cart, что и корзина витрины;
// клик открывает корзину через событие wecrm:open-cart (Vitrine его слушает).
export function PublicCartButton() {
  const [count, setCount] = useState(readCartCount);
  useEffect(() => {
    const h = () => setCount(readCartCount());
    window.addEventListener('wecrm:cart', h);
    window.addEventListener('storage', h);
    return () => {
      window.removeEventListener('wecrm:cart', h);
      window.removeEventListener('storage', h);
    };
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('wecrm:open-cart'))}
      title="Корзина"
      aria-label="Корзина"
      style={{
        position: 'relative',
        border: '1px solid var(--border-color, #e0e0e0)',
        background: 'var(--bg-card, #fff)',
        borderRadius: 12,
        padding: '8px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        color: 'var(--text-primary, #333)',
        fontSize: 14,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="public-cart-btn-label">Корзина</span>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -6,
          minWidth: 18, height: 18, borderRadius: 9,
          background: '#007AFF', color: '#fff',
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px', boxSizing: 'border-box',
        }}>{count}</span>
      )}
      <style>{`@media (max-width: 640px) { .public-cart-btn-label { display: none; } }`}</style>
    </button>
  );
}
