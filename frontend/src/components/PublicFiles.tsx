import { useEffect, useState } from 'react';
import { Files } from './Files';
import { useBrandLogo } from '../lib/branding';
import { usePageSeo } from '../lib/usePageTitle';
import PublicAuthArea from './PublicAuthArea';

// Публичная страница «Файлы» для welans.click — без интерфейса CRM (сайдбара и меню).
// Простая шапка: логотип слева (ссылка на welans.ru), блок «Войти»/аватарка справа.
export default function PublicFiles() {
  usePageSeo({
    title: 'WeLANS - Файловый менеджер',
    description: 'Файловый менеджер WeLANS — публичные файлы и папки, обмен документами.',
    canonical: `${window.location.origin}/`,
  });
  const brandLogo = useBrandLogo(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-color, #f5f5f7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '8px 12px' : '10px 16px', borderBottom: '1px solid var(--border-color, #e0e0e0)', background: 'var(--bg-secondary, #fff)' }}>
        <a href="https://welans.ru" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="WeLANS — на главную">
          <img src={brandLogo} alt="WeLANS" style={{ height: isMobile ? 28 : 34, maxWidth: 140, objectFit: 'contain' }} />
        </a>
        <div style={{ flex: 1, minWidth: 0 }} />
        <PublicAuthArea mobile={isMobile} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: isMobile ? '10px 12px 12px' : '12px 16px 16px' }}>
        <Files publicMode />
      </div>
    </div>
  );
}
