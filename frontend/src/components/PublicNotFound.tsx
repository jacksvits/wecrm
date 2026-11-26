// Публичная страница 404 на welans.ru: неизвестный путь (backend уже ответил статусом 404).
// Тот же каркас, что у страниц новостей: логотип, меню, блок авторизации, куки-баннер.
import PublicNavMenu from './PublicNavMenu';
import PublicAuthArea from './PublicAuthArea';
import { CookieConsent } from './CookieConsent';
import { useBrandLogo } from '../lib/branding';

export default function PublicNotFound() {
  const logoUrl = useBrandLogo(false);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary, #fff)', color: 'var(--text-primary, #111)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-color, #e0e0e0)',
        background: 'var(--bg-secondary, #fff)',
      }}>
        <a href={window.location.origin} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="WeLANS — на главную">
          {logoUrl
            ? <img src={logoUrl} alt="WeLANS" style={{ height: 34, maxWidth: 140, objectFit: 'contain' }} />
            : <span style={{ fontSize: 20, fontWeight: 700 }}>WeLANS</span>}
        </a>
        <div style={{ flex: 1 }} />
        <PublicNavMenu />
        <PublicAuthArea />
        <CookieConsent />
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: 'var(--text-muted, #888)' }}>404</div>
          <h1 style={{ fontSize: 24, margin: '16px 0 8px' }}>Страница не найдена</h1>
          <p style={{ color: 'var(--text-muted, #666)', margin: '0 0 24px' }}>
            Возможно, ссылка устарела или адрес введён с ошибкой.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/" style={{ padding: '10px 20px', borderRadius: 12, background: 'var(--accent-color, #005BFF)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>На главную</a>
            <a href="/shop" style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid var(--border-color, #e0e0e0)', color: 'var(--text-primary, #111)', textDecoration: 'none', fontWeight: 600 }}>Каталог</a>
          </div>
        </div>
      </main>
    </div>
  );
}
