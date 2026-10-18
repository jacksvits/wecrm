// Бейдж (наклейка) на иконке PWA-приложения со счётчиком непрочитанных уведомлений.
// Badging API (navigator.setAppBadge) поддерживается в Chrome/Edge на Android и десктопе:
// бейдж держится на иконке установленного приложения даже после его закрытия,
// пока его не сбросить через clearAppBadge. В средах без поддержки (iOS Safari,
// старые браузеры) — тихий fallback: счётчик в заголовке вкладки "(N) <название сайта>".

import { seoBaseTitle } from './seo';

// Обновляет бейдж иконки приложения и заголовок вкладки под текущий счётчик.
// Вызывать при каждом изменении количества непрочитанных уведомлений.
export function updateAppBadge(unreadCount: number): void {
  const count = Math.max(0, Math.floor(unreadCount) || 0);

  // Fallback для браузеров без Badging API: счётчик в заголовке вкладки.
  // Базовый заголовок берём из seoBaseTitle() при каждом вызове: модуль может
  // загрузиться раньше, чем initSeo() применит SEO-заголовок тенанта, поэтому
  // закэшированная в константе копия затирала бы title значением из index.html.
  const title = seoBaseTitle();
  document.title = count > 0 ? `(${count}) ${title}` : title;

  // Нативный бейдж иконки приложения (Badging API)
  const nav = navigator as Navigator & {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  if (!nav.setAppBadge) return;
  const result = count > 0
    ? nav.setAppBadge(count)
    : nav.clearAppBadge
      ? nav.clearAppBadge()
      : nav.setAppBadge(); // clearAppBadge не описан в старых реализациях
  // Отклонённый promise (например, не установленное PWA) не должен ломать приложение
  result?.catch(() => {});
}
