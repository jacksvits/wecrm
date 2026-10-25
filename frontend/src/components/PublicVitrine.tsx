import { useState } from 'react';
import { Vitrine } from './Vitrine';

// Публичная страница витрины (каталог) — доступна без авторизации.
// Открывается по адресу /vitrine, в т.ч. по ссылке «Каталог» с лендинга /welans/.
export default function PublicVitrine() {
  const [q, setQ] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-color, #f5f5f7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color, #e0e0e0)', background: 'var(--bg-secondary, #fff)' }}>
        <a href="/" style={{ fontWeight: 700, color: 'var(--accent, #007AFF)', textDecoration: 'none', whiteSpace: 'nowrap' }}>WeCRM</a>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по каталогу…"
          style={{ flex: 1, maxWidth: 480, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color, #e0e0e0)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
        <a href="/" style={{ fontSize: 13, color: 'var(--text-muted, #888)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Войти</a>
      </div>
      <Vitrine search={q} />
    </div>
  );
}
