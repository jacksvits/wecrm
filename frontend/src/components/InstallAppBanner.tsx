import { useEffect, useState } from 'react';
import {
  isAndroid, isNativeApp, isTwa,
  hasGoogleServices, googleServicesMissing,
  APK_TWA_URL, APK_NOGOGLE_URL,
} from '../lib/appInstall';

// Плавающий баннер предложения установки Android-приложения.
// Показывается только в браузере на Android: в нативном приложении (Capacitor)
// и в TWA (referrer android-app://) баннер не нужен. Выбор APK зависит от
// Google-сервисов: если Web Push (FCM) работал — TWA-версия, если падала —
// версия без Google; если данных нет — обе кнопки.
export function InstallAppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAndroid() || isNativeApp() || isTwa()) return;
    if (localStorage.getItem('wecrm_install_banner_hide') === '1') return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem('wecrm_install_banner_hide', '1');
    setVisible(false);
  };

  const gms = hasGoogleServices();
  const noGms = googleServicesMissing();

  const card: React.CSSProperties = {
    position: 'fixed',
    top: 'calc(8px + env(safe-area-inset-top, 0px))',
    left: 8,
    right: 8,
    zIndex: 9000,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    padding: '10px 12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };
  const text: React.CSSProperties = { fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 };
  const btnPrimary: React.CSSProperties = {
    background: '#00b300', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    textDecoration: 'none', display: 'inline-block', textAlign: 'center',
  };
  const btnGhost: React.CSSProperties = {
    background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)',
    borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer',
    textDecoration: 'none', display: 'inline-block', textAlign: 'center',
  };
  const close: React.CSSProperties = {
    position: 'absolute', top: 4, right: 8, background: 'none', border: 'none',
    color: 'var(--text-primary)', opacity: 0.5, fontSize: 18, cursor: 'pointer', padding: 4,
  };

  return (
    <div style={card}>
      <button style={close} onClick={dismiss} aria-label='Закрыть'>×</button>
      <div style={text}>
        Установите приложение <b>WeCRM</b> — быстрый доступ к задачам и push-уведомления.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {gms && !noGms && <a style={{ ...btnPrimary, flex: 1 }} href={APK_TWA_URL}>Установить</a>}
        {noGms && !gms && <a style={{ ...btnPrimary, flex: 1 }} href={APK_NOGOGLE_URL}>Установить</a>}
        {!gms && !noGms && (
          <>
            <a style={{ ...btnPrimary, flex: 1 }} href={APK_TWA_URL}>С Google-сервисами</a>
            <a style={{ ...btnGhost, flex: 1 }} href={APK_NOGOGLE_URL}>Без Google-сервисов</a>
          </>
        )}
      </div>
    </div>
  );
}
