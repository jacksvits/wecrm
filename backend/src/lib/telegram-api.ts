import { ProxyAgent } from 'undici';

// === Единая точка обращений к Telegram Bot API ===
// Если прямой доступ к api.telegram.org с сервера заблокирован, исходящий
// трафик бота направляется через локальный прокси (контейнер vpn: sing-box
// с VPN-подпиской, плагин «Прокси через VPN»). Включение — переменная
// окружения TELEGRAM_PROXY_URL (например, http://vpn:2080). Без переменной
// запросы идут напрямую, как раньше. Остальной исходящий трафик бэкенда
// (почта, банки, VK и т.д.) прокси не затрагивает.

export const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

const proxyUrl = process.env.TELEGRAM_PROXY_URL;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

if (dispatcher) {
  console.log('[Telegram API] Используется прокси:', proxyUrl);
}

export function telegramFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (dispatcher) {
    // dispatcher — расширение undici, в стандартном RequestInit его нет
    return fetch(url, { ...options, dispatcher } as any);
  }
  return fetch(url, options);
}
