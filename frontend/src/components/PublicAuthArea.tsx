// Публичный блок авторизации для шапок страниц витрины, файлов и новостей.
// Гостю — кнопка «Войти» на страницу авторизации https://welans.cc; авторизованному —
// его аватарка (как на главной welans.ru: круглая, зелёный контур, инициалы при
// отсутствии фото), клик ведёт на страницу профиля https://welans.cc/profile.
// На домене welans.cc сессия известна сразу (useAuth — общий localStorage токена).
// На сторонних доменах (welans.ru, welans.click) токен недоступен — состояние узнаём
// через редирект-мост welans.cc/auth-bridge.html, результат кэшируется в localStorage
// страницы на сутки (тот же механизм, что на главной welans.ru). Ботов не редиректим.
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export type PublicUser = { name?: string; avatar?: string | null; token?: string } | null;

const BRIDGE_URL = 'https://welans.cc/auth-bridge.html';
const LS_KEY = 'wecrm_auth';
const TTL = 24 * 60 * 60 * 1000;
const CRM_HOST = 'welans.cc';

function isCrmHost(): boolean {
  const h = window.location.hostname;
  return h === CRM_HOST || h.endsWith('.' + CRM_HOST);
}

function isBot(): boolean {
  return /bot|crawler|spider|slurp|yandex|duckduck|baidu|curl|wget|python|headless|lighthouse/i.test(navigator.userAgent || '');
}

function cacheAuth(rec: { ts: number; user: PublicUser }) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
}

// Публичная авторизация: мост отдаёт профиль И токен — витринные домены сохраняют
// токен в localStorage, авторизованные запросы (комментарии) работают отовсюду
export function usePublicUser(): PublicUser | undefined {
  const [bridgeUser, setBridgeUser] = useState<PublicUser | undefined>(undefined);
  const crmHost = isCrmHost();
  const { user } = useAuth();
  useEffect(() => {
    if (crmHost) return; // сессия известна из useAuth
    // 1) вернулись с моста — ответ в хэше адреса
    if (window.location.hash.indexOf('#wecrm-user=') === 0) {
      let u: PublicUser = null;
      try {
        u = JSON.parse(decodeURIComponent(escape(atob(window.location.hash.substring(12)))));
      } catch { u = null; }
      // Токен — в стандартное место api-клиента; в кэш профиля не кладём
      if (u && typeof u.token === 'string' && u.token) {
        localStorage.setItem('token', u.token);
        const { token: _t, ...profile } = u;
        u = profile;
      }
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      cacheAuth({ ts: Date.now(), user: u });
      setBridgeUser(u);
      return;
    }
    if (window.location.hash === '#wecrm-guest') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      cacheAuth({ ts: Date.now(), user: null });
      setBridgeUser(null);
      return;
    }
    // 2) свежий кэш — работаем без редиректа
    try {
      const c = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (c && Date.now() - c.ts < TTL) { setBridgeUser(c.user ?? null); return; }
    } catch { /* ignore */ }
    // 3) ботов не трогаем — им всегда обычная страница
    if (isBot()) { setBridgeUser(null); return; }
    // 4) состояние неизвестно — один редирект на мост и обратно
    window.location.replace(BRIDGE_URL + '?back=' + encodeURIComponent(window.location.href.split('#')[0]));
  }, [crmHost]);
  if (crmHost) return user ?? null;
  return bridgeUser;
}

export default function PublicAuthArea({ mobile = false }: { mobile?: boolean }) {
  const user = usePublicUser();
  // Состояние сессии ещё неизвестно — готовится редирект на мост
  if (user === undefined) return null;
  if (!user) {
    // Кнопка «Войти» — в стиле кнопки «Войти» на публичной странице каталога
    const loginBtnStyle: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: mobile ? '8px 16px' : '10px 20px', borderRadius: 12, whiteSpace: 'nowrap',
      border: '1px solid rgba(120,180,255,0.40)',
      background: 'linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%)',
      color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
      boxShadow: '0 4px 20px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
    };
    return <a href="https://welans.cc/" style={loginBtnStyle}>Войти</a>;
  }
  const avatarUrl = user.avatar
    ? (String(user.avatar).indexOf('http') === 0 ? user.avatar : 'https://welans.cc' + user.avatar)
    : '';
  const initials = (user.name || 'U').trim().split(/\s+/).map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase();
  return (
    <a
      href="https://welans.cc/profile"
      title={(user.name ? user.name + ' — ' : '') + 'Профиль'}
      aria-label="Профиль"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: '50%', border: '2px solid #22c55e',
        overflow: 'hidden', background: '#00b300', textDecoration: 'none',
        boxSizing: 'border-box', flexShrink: 0,
      }}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt={user.name || 'Профиль'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{initials}</span>}
    </a>
  );
}
