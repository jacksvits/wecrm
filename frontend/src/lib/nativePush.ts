// Нативные push для Capacitor APK (телефоны без Google-сервисов):
// держит фоновый WebSocket-сервис нативного плагина WecrmPush.
// На вебе/TWA — no-op.
import { Capacitor, registerPlugin } from '@capacitor/core';

interface WecrmPushPlugin {
  start(options: { url: string; token: string }): Promise<void>;
  updateToken(options: { token: string }): Promise<void>;
  stop(): Promise<void>;
}
const WecrmPush = registerPlugin<WecrmPushPlugin>('WecrmPush');

const WS_URL = 'wss://welans.cc/api/push/ws';

export function initNativePush(): void {
  if (!Capacitor.isNativePlatform()) return;
  let started = false;
  let lastToken: string | null = null;
  const sync = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token && token !== lastToken) {
        if (started) await WecrmPush.updateToken({ token });
        else { await WecrmPush.start({ url: WS_URL, token }); started = true; }
        lastToken = token;
      } else if (!token && lastToken !== null) {
        await WecrmPush.stop(); started = false; lastToken = null;
      }
    } catch (e) { console.error('[NativePush] sync failed:', e); }
  };
  sync();
  setInterval(sync, 30000);
}
