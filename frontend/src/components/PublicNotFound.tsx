// Публичная страница 404 на welans.ru: неизвестный путь (backend уже ответил статусом 404).
// Шапка сайта без изменений (логотип, меню, вход). На весь экран — фоновое фото
// с равномерным затемнением, по центру крупное «404» курсивом и подпись под ним.
import PublicNavMenu from './PublicNavMenu';
import PublicAuthArea from './PublicAuthArea';
import { CookieConsent } from './CookieConsent';
import { useBrandLogo } from '../lib/branding';

export default function PublicNotFound() {
  const logoUrl = useBrandLogo(false);
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#14171c' }}>
      {/* Фон: изображение на весь экран + затемнение, чтобы белый текст читался */}
      <div style={{ position: 'absolute', inset: 0, background: 'url(/404.jpg) center / cover no-repeat #14171c' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.45)' }} />

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

      <main style={{
        position: 'relative', zIndex: 1,
        minHeight: 'calc(100vh - 57px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 16px', textAlign: 'center',
      }}>
        <div style={{
          fontSize: 'clamp(96px, 20vw, 220px)',
          fontWeight: 800, fontStyle: 'italic', lineHeight: 1, color: '#fff',
          textShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
        }}>404</div>
        <p style={{ margin: '16px 0 0', fontSize: 'clamp(16px, 2.4vw, 28px)', color: 'rgba(255, 255, 255, 0.92)' }}>
          Ой, кажется страница ещё не готова.
        </p>
      </main>
    </div>
  );
}
