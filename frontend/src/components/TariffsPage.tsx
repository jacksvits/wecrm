import { useEffect, useState } from 'react';
import { useBrandLogo } from '../lib/branding';
import { CookieConsent } from './CookieConsent';
import { usePageSeo } from '../lib/usePageTitle';
import PublicAuthArea from './PublicAuthArea';
import PublicNavMenu from './PublicNavMenu';

// Публичная страница тарифов CRM — доступна без авторизации по адресу /tariffs.
// Данные — из того же GET /api/platform/tariffs, что и форма регистрации
// (активные продукты категорий с флагом «Тарифы CRM»).
type Tariff = {
  productId: string;
  name: string;
  description: string;
  price: number | null;
  categoryName: string;
  renewMonths: number | null;
};

// Цена за год берётся из тех же карточек товара, что и месячная: годовая позиция
// в product_prices обычно ≈ месяц × 12 × 0,85 — показываем выгоду от годовой оплаты.
function yearPrice(month: number | null): number | null {
  if (month == null) return null;
  const est = Math.round((month * 12 * 0.85) / 100) * 100;
  return est > 0 ? est : null;
}

export default function TariffsPage() {
  usePageSeo({
    title: 'WeLANS - Тарифы CRM',
    description: 'Тарифы облачной CRM WeLANS: бесплатный старт, телефония, маркетплейсы, 1С, бухгалтерия и камеры — от 0 ₽ в месяц.',
    canonical: `${window.location.origin}/tariffs`,
  });
  const brandLogo = useBrandLogo(false);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/platform/tariffs')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        const all = Array.isArray(list) ? list : [];
        // На странице — только новая тарифная сетка (товары с префиксом tariff_),
        // старые план-продукты регистрации не показываем
        setTariffs(all.filter((t: Tariff) => String(t.productId).startsWith('tariff_')));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const sorted = [...tariffs].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  const popularId = sorted.find((t) => t.name.includes('Бизнес'))?.productId;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-color, #f5f5f7)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color, #e0e0e0)', background: 'var(--bg-secondary, #fff)', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href={window.location.origin} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="WeLANS — на главную">
          <img src={brandLogo} alt="WeCRM" style={{ height: 34, maxWidth: 140, objectFit: 'contain' }} />
        </a>
        <div style={{ flex: 1 }} />
        <PublicNavMenu />
        <PublicAuthArea />
      </div>

      <div style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '32px 20px 48px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: 'var(--text-color, #1a1a1a)' }}>Тарифы CRM</h1>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary, #555)' }}>
            Полный набор инструментов для подрядного и сервисного бизнеса. Начните бесплатно — перейдите на платный тариф, когда понадобится больше.
          </p>
        </div>

        {loaded && sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted, #888)' }}>Тарифы временно недоступны. Попробуйте позже.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, alignItems: 'stretch' }}>
            {sorted.map((t) => {
              const isPopular = t.productId === popularId;
              const isFree = (t.price ?? 0) === 0;
              const yPrice = yearPrice(t.price);
              return (
                <div
                  key={t.productId}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-secondary, #fff)',
                    borderRadius: 16,
                    padding: '22px 20px 20px',
                    border: isPopular ? '2px solid transparent' : '1px solid var(--border-color, #e0e0e0)',
                    backgroundImage: isPopular ? 'linear-gradient(var(--bg-secondary, #fff), var(--bg-secondary, #fff)), linear-gradient(135deg, #007aff, #af52de)' : undefined,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: isPopular ? '0 8px 24px rgba(0, 122, 255, 0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {isPopular && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #007aff, #af52de)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      Популярный
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--text-color, #1a1a1a)' }}>{t.name}</div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-color, #1a1a1a)' }}>
                      {isFree ? '0 ₽' : `${Number(t.price).toLocaleString('ru-RU')} ₽`}
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--text-muted, #888)' }}> /мес</span>
                    {yPrice != null && (
                      <div style={{ fontSize: 13, color: 'var(--text-muted, #888)', marginTop: 2 }}>
                        или {yPrice.toLocaleString('ru-RU')} ₽/год <span style={{ color: '#22c55e', fontWeight: 600 }}>−15%</span>
                      </div>
                    )}
                    {isFree && t.renewMonths ? (
                      <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, marginTop: 2 }}>первый месяц бесплатно</div>
                    ) : null}
                  </div>
                  <div className="rich-text" style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary, #444)', flex: 1, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: t.description }} />
                  <a
                    href={`/register?plan=${t.productId}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      textDecoration: 'none',
                      padding: '12px 16px',
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 600,
                      color: isPopular || isFree ? '#fff' : 'var(--text-color, #1a1a1a)',
                      background: isPopular || isFree ? 'linear-gradient(135deg, #007aff, #5856d6, #af52de)' : 'var(--bg-hover, #eee)',
                    }}
                  >
                    {isFree ? 'Попробовать бесплатно' : 'Оформить тариф'}
                  </a>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'var(--text-muted, #888)' }}>
          Все тарифы включают обновления CRM и резервное копирование данных. Нужен индивидуальный набор интеграций? <a href="https://welans.cc/welans/" style={{ color: '#007aff', textDecoration: 'none' }}>Свяжитесь с нами</a>.
        </div>
      </div>

      <CookieConsent />
    </div>
  );
}
