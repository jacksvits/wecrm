// === Брендинг: кастомные иконка приложения и логотип из системных настроек ===
import { useEffect, useState } from 'react';

export interface Branding {
  iconUrl: string | null;
  iconUrl512: string | null;
  appleTouchIconUrl: string | null;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  accentColor: string | null;
  newsCoverUrl: string | null;
  updatedAt: string | null;
}

let current: Branding = {
  iconUrl: null,
  iconUrl512: null,
  appleTouchIconUrl: null,
  logoUrl: null,
  darkLogoUrl: null,
  accentColor: null,
  newsCoverUrl: null,
  updatedAt: null,
};

export function getBranding(): Branding {
  return current;
}

// Дефолтные логотипы проекта (тёмная/светлая тема)
function defaultLogo(isDark: boolean): string {
  return isDark ? '/logo.png' : '/logo-light.png';
}

function applyIconLinks() {
  if (!current.iconUrl) return;
  // Favicon
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.type = 'image/png';
    favicon.href = current.iconUrl;
  }
  // Apple touch icon
  const apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (apple && current.appleTouchIconUrl) {
    apple.href = current.appleTouchIconUrl;
  }
  // Динамический manifest PWA со ссылками на кастомные иконки
  const manifest = {
    name: 'WeCRM',
    short_name: 'WeCRM',
    description: 'CRM для управления задачами, сделками и контактами',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00b300',
    orientation: 'portrait-primary',
    icons: [
      { src: current.iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: current.iconUrl512 || current.iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: current.iconUrl, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: current.iconUrl512 || current.iconUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (manifestLink) {
    manifestLink.href = URL.createObjectURL(blob);
  }
}

export async function loadBranding(): Promise<Branding> {
  try {
    const res = await fetch('/api/branding');
    if (res.ok) {
      current = await res.json();
      applyIconLinks();
      // Применяем кастомный цвет акцента к CSS-переменной (null — вернуть дефолт из index.css)
      if (current.accentColor) {
        document.documentElement.style.setProperty('--custom-accent', current.accentColor);
      } else {
        document.documentElement.style.removeProperty('--custom-accent');
      }
      window.dispatchEvent(new CustomEvent('brandingchange'));
    }
  } catch {
    // Остаются дефолтные значения
  }
  return current;
}

// Логотип из настроек: в тёмной теме — darkLogoUrl, в светлой — logoUrl;
// если логотип текущей темы не задан — используется основной логотип
function pickLogo(isDark: boolean): string {
  const custom = isDark ? current.darkLogoUrl : current.logoUrl;
  return custom || current.logoUrl || defaultLogo(isDark);
}

// Хук: текущий логотип с реакцией на смену темы и на обновление брендинга
export function useBrandLogo(isDark: boolean): string {
  const [logo, setLogo] = useState<string>(pickLogo(isDark));
  useEffect(() => {
    setLogo(pickLogo(isDark));
    const handler = () => setLogo(pickLogo(isDark));
    window.addEventListener('brandingchange', handler);
    return () => window.removeEventListener('brandingchange', handler);
  }, [isDark]);
  return logo;
}

// Хук: текущая иконка приложения (логотип уведомлений, кнопка push)
export function useBrandIcon(): string {
  const [icon, setIcon] = useState<string>(current.iconUrl || '/icon-192x192.png');
  useEffect(() => {
    const handler = () => setIcon(current.iconUrl || '/icon-192x192.png');
    window.addEventListener('brandingchange', handler);
    return () => window.removeEventListener('brandingchange', handler);
  }, []);
  return icon;
}

// Хук: обложка новостей по умолчанию (null — у новости без своей картинки нет обложки)
export function useBrandNewsCover(): string | null {
  const [cover, setCover] = useState<string | null>(current.newsCoverUrl);
  useEffect(() => {
    const handler = () => setCover(current.newsCoverUrl);
    window.addEventListener('brandingchange', handler);
    return () => window.removeEventListener('brandingchange', handler);
  }, []);
  return cover;
}
