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
// Ключ запрашивается у бэкенда (Novofon API v1 /webrtc/get_key/, срок жизни 72 ч),
// скрипты виджета подгружаются с CDN Novofon. Виджет показывается только если
// телефония активна, включён WebRTC в настройках и у пользователя есть внутренний номер.

export function WebPhoneWidget() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await api.telephony.getSettings();
        if (!settings?.isActive || !settings.webRtcEnabled) return;
        const { key, sip } = await api.telephony.getWebRtcKey();
        if (cancelled || !key || !sip) return;
        const loadScript = (src: string) =>
          new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Не удалось загрузить ' + src));
            document.body.appendChild(script);
          });
        await loadScript('https://my.novofon.com/webphoneWebRTCWidget/v8/js/loader-phone-lib.js');
        await loadScript('https://my.novofon.com/webphoneWebRTCWidget/v8/js/loader-phone-fn.js');
        if (cancelled) return;
        // 'rounded' — форма кнопки, drag — перетаскивание, позиция — нижний правый угол
        window.zadarmaWidgetFn?.(key, sip, 'rounded', 'ru', true, "{right:'16px',bottom:'90px'}");
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
