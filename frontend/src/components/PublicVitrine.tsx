import { useState } from 'react';
import { Vitrine } from './Vitrine';
import { useBrandLogo } from '../lib/branding';
import { CookieConsent } from './CookieConsent';

// Публичная страница витрины (каталог) — доступна без авторизации.
// Открывается по адресу /vitrine, в т.ч. по ссылке «Каталог» с лендинга /welans/.
export default function PublicVitrine() {
  const [q, setQ] = useState('');
  const brandLogo = useBrandLogo(true);
  // Кнопка «Войти» — в стиле кнопки «Корзина» из шапки страницы «Товары»
  const loginBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '10px 20px', borderRadius: 12, whiteSpace: 'nowrap',
    border: '1px solid rgba(120,180,255,0.40)',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)',
    color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
  };
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-color, #f5f5f7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color, #e0e0e0)', background: 'var(--bg-secondary, #fff)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="На главную">
          <img src={brandLogo} alt="WeCRM" style={{ height: 34, maxWidth: 140, objectFit: 'contain' }} />
        </a>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по каталогу…"
          style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-color, #e0e0e0)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
        <a href="/" style={loginBtnStyle}>Войти</a>
      </div>
      <Vitrine search={q} />
      <CookieConsent />
    </div>
  );
}