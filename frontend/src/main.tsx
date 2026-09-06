import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

// Защита от ошибок performance-метрик сторонних расширений (gosuslugi и др.)
// Фикс: TypeError: Cannot read properties of undefined (reading 'startTime')
// Фикс: SVG path attribute d errors от расширений
window.addEventListener('error', (e) => {
  const msg = e.message || '';
  const filename = e.filename || '';
  if (
    msg.includes('startTime') ||
    msg.includes('Cannot read properties of undefined') ||
    msg.includes('Expected moveto path command') ||
    msg.includes('attribute d') ||
    msg.includes('path command') ||
    filename.includes('VM') ||
    filename.includes('bootstrap') ||
    filename.includes('gosuslugi')
  ) {
    e.preventDefault();
    console.warn('[App] Suppressed extension error:', msg);
  }
});

// Защита от unhandledrejection с аналогичными ошибками
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason || '');
  if (
    msg.includes('startTime') ||
    msg.includes('gosuslugi') ||
    msg.includes('Expected moveto path command') ||
    msg.includes('attribute d')
  ) {
    e.preventDefault();
    console.warn('[App] Suppressed extension rejection:', msg);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[PWA] SW registered:', reg.scope))
      .catch(err => console.log('[PWA] SW failed:', err));
  });
}
