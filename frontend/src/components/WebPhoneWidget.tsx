import { useEffect } from 'react';
import { api } from '../api/client';

declare global {
  interface Window {
    // Глобальная функция инициализации из loader-phone-fn.js (интерфейс унаследован от Zadarma)
    zadarmaWidgetFn?: (
      key: string,
      sip: string,
      shape: string,
      lang: string,
      drag: boolean,
      position: string,
    ) => void;
  }
}

// WebRTC-телефон Novofon: плавающий виджет для звонков клиентам прямо из браузера CRM.
// Ключ запрашивается у бэкенда (Novofon API v1 /webrtc/get_key/, срок жизни 72 ч).
// Скрипты виджета хостятся на CDN Zadarma (my.zadarma.com/webphoneWebRTCWidget/v8/):
// Novofon не публикует v8-файлы на my.novofon.ru (там SPA-заглушка), а бэкенды у
// Zadarma/Novofon общие (sipdc.net) — ключ валидируется через api.zadarma.com.
// Виджет показывается только если телефония активна, включён WebRTC в настройках
// и у пользователя есть сопоставленный внутренний номер АТС.

const WIDGET_BASE = 'https://my.zadarma.com/webphoneWebRTCWidget/v8/js';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить ' + src));
    document.body.appendChild(script);
  });
}

export function WebPhoneWidget() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await api.telephony.getSettings();
        if (!settings?.isActive || !settings.webRtcEnabled) return;
        const { key, sip } = await api.telephony.getWebRtcKey();
        if (cancelled || !key || !sip) return;
        await loadScript(`${WIDGET_BASE}/loader-phone-lib.js`);
        await loadScript(`${WIDGET_BASE}/loader-phone-fn.js`);
        if (cancelled || typeof window.zadarmaWidgetFn !== 'function') return;
        // Кнопка виджета поверх мобильной навигации CRM, но под внутренними окнами звонков
        const style = document.createElement('style');
        style.textContent = '.zdrm-phone{z-index:1500!important;}';
        document.head.appendChild(style);
        // 'rounded' — форма кнопки, drag — перетаскивание; на мобильных поднимаем выше нижнего меню
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const position = isMobile
          ? "{right:'16px',bottom:'170px'}"
          : "{right:'16px',bottom:'90px'}";
        window.zadarmaWidgetFn(key, sip, 'rounded', 'ru', true, position);
      } catch {
        // Виджет опционален: при ошибке ключа/сети приложение продолжает работать
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
