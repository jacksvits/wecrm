import { useState } from 'react';
import { Vitrine } from './Vitrine';
import { useBrandLogo } from '../lib/branding';
import { CookieConsent } from './CookieConsent';
import { usePageTitle } from '../lib/usePageTitle';
import PublicAuthArea from './PublicAuthArea';

// Публичная страница витрины (каталог) — доступна без авторизации.
// Открывается по адресу /vitrine, в т.ч. по ссылке «Каталог» с лендинга /welans/.
export default function PublicVitrine() {
  usePageTitle('WeLANS - Магазин');
  const [q, setQ] = useState('');
  const brandLogo = useBrandLogo(false);
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-color, #f5f5f7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color, #e0e0e0)', background: 'var(--bg-secondary, #fff)' }}>
        <a href="https://welans.ru" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="WeLANS — на главную">
          <img src={brandLogo} alt="WeCRM" style={{ height: 34, maxWidth: 140, objectFit: 'contain' }} />
        </a>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по каталогу…"
          style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-color, #e0e0e0)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
        <PublicAuthArea />
      </div>
      <Vitrine search={q} />
      <CookieConsent />
    </div>
  );
}