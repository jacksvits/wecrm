import { useEffect, useState } from 'react';
import { Files } from './Files';
import { useBrandLogo } from '../lib/branding';

// Публичная страница «Файлы» для welans.click — без интерфейса CRM (сайдбара и меню).
// Простая шапка: логотип слева (ссылка на welans.cc), кнопка «Войти» справа.
export default function PublicFiles() {
  const brandLogo = useBrandLogo(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  // Кнопка «Войти» — в стиле кнопки «Войти» на публичной странице каталога
  const loginBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: isMobile ? '8px 16px' : '10px 20px', borderRadius: 12, whiteSpace: 'nowrap',
    border: '1px solid rgba(120,180,255,0.40)',
    background: 'linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)',
    color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
  };
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-color, #f5f5f7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '8px 12px' : '10px 16px', borderBottom: '1px solid var(--border-color, #e0e0e0)', background: 'var(--bg-secondary, #fff)' }}>
        <a href="https://welans.cc/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="На главную">
          <img src={brandLogo} alt="WeLANS" style={{ height: isMobile ? 28 : 34, maxWidth: 140, objectFit: 'contain' }} />
        </a>
        <div style={{ flex: 1, minWidth: 0 }} />
        <a href="https://welans.cc/" style={loginBtnStyle}>Войти</a>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: isMobile ? '10px 12px 12px' : '12px 16px 16px' }}>
        <Files publicMode />
      </div>
    </div>
  );
}
