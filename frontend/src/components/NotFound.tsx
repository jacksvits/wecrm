// Страница 404 CRM: несуществующий раздел (catch-all-роут в App.tsx).
// Стили — общие CSS-переменные проекта (как в формах и секциях).
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, color: 'var(--text-muted)' }}>404</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: '16px 0 8px' }}>Страница не найдена</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
          Такого раздела нет в системе — проверьте адрес или вернитесь на главную.
        </p>
        <Link to="/" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 10, background: 'var(--accent-color)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>На главную</Link>
      </div>
    </div>
  );
}
