import crypto from 'crypto';
import { prisma } from './prisma.js';

// Клиент API СДЭК v2 (документация: https://apidoc.cdek.ru).
// Два контура:
//   test — api.edu.cdek.ru (тестовый стенд, публичные учётные данные интегратора),
//   prod — api.cdek.ru (боевой контур, учётные данные из личного кабинета СДЭК).

const CDEK_API_URLS: Record<string, string> = {
  test: 'https://api.edu.cdek.ru',
  prod: 'https://api.cdek.ru',
};

export function cdekBaseUrl(environment?: string | null): string {
  return CDEK_API_URLS[environment === 'prod' ? 'prod' : 'test'];
}

export interface CdekSettingsData {
  id: number;
  isActive: boolean;
  environment: string;
  account: string;
  securePassword: string;
  accessToken: string;
  tokenExpiresAt: Date | null;
  webhookToken: string;
  senderCityCode: number | null;
  senderCompany: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
}

/** Настройки плагина CDEK (одна запись, id=1) */
export async function getCdekSettings(): Promise<CdekSettingsData | null> {
  const s = await prisma.cdekSettings.findUnique({ where: { id: 1 } });
  return s as CdekSettingsData | null;
}

/** Получить OAuth-токен СДЭК, при необходимости — обновить (кэш в настройках) */
export async function getCdekToken(settings?: CdekSettingsData | null): Promise<string> {
  const s = settings ?? await getCdekSettings();
  if (!s) throw new Error('CDEK не подключён: заполните учётные данные в настройках интеграции');
  if (!s.account.trim() || !s.securePassword.trim()) throw new Error('CDEK: не указаны Account и Secure password');
  const now = Date.now();
  if (s.accessToken && s.tokenExpiresAt && s.tokenExpiresAt.getTime() - 60_000 > now) {
    return s.accessToken;
  }
  const base = cdekBaseUrl(s.environment);
  const auth = Buffer.from(`${s.account.trim()}:${s.securePassword.trim()}`).toString('base64');
  const res = await fetch(`${base}/v2/oauth/token?parameters=&grant_type=client_credentials`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(20_000),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`CDEK: ошибка авторизации (HTTP ${res.status})${data?.error_description ? ` — ${data.error_description}` : ''}`);
  }
  await prisma.cdekSettings.update({
    where: { id: 1 },
    data: {
      accessToken: String(data.access_token),
      tokenExpiresAt: new Date(now + (Number(data.expires_in) || 3600) * 1000),
    },
  });
  s.accessToken = String(data.access_token);
  s.tokenExpiresAt = new Date(now + (Number(data.expires_in) || 3600) * 1000);
  return s.accessToken;
}

/** Сбросить кэш токена (после смены учётных данных/среды или 401 от API) */
export async function resetCdekToken(): Promise<void> {
  await prisma.cdekSettings.update({ where: { id: 1 }, data: { accessToken: '', tokenExpiresAt: null } });
}

/** Базовый вызов CDEK API v2. При 401 — сброс кэша токена и один повтор. */
export async function cdekApi<T = any>(method: string, path: string, body?: any, settings?: CdekSettingsData): Promise<T> {
  const s = settings ?? await getCdekSettings();
  if (!s) throw new Error('CDEK не подключён: заполните учётные данные в настройках интеграции');
  let token = await getCdekToken(s);
  const base = cdekBaseUrl(s.environment);
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (res.ok) return data as T;
    const details = Array.isArray(data?.errors) && data.errors.length
      ? ` (${data.errors.map((e: any) => e.message).join('; ')})`
      : '';
    lastError = new Error(`CDEK: HTTP ${res.status}${data?.message ? ` — ${data.message}` : ''}${details}`);
    if (res.status === 401 && attempt === 0) {
      await resetCdekToken();
      token = await getCdekToken(s);
      continue;
    }
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    throw lastError;
  }
  throw lastError!;
}

/** Подбор населённых пунктов по названию (для адресов отправителя/получателя) */
export async function cdekSuggestCities(name: string): Promise<any[]> {
  const data = await cdekApi('GET', `/v2/location/suggest/cities?name=${encodeURIComponent(name)}&size=20`);
  return Array.isArray(data) ? data : [];
}

/** Список пунктов выдачи заказов (ПВЗ) в городе */
export async function cdekDeliveryPoints(cityCode: number): Promise<any[]> {
  const data = await cdekApi('GET', `/v2/deliverypoints?city_code=${cityCode}&size=500`);
  return Array.isArray(data) ? data : [];
}

/** Калькулятор: расчёт стоимости по доступным тарифам */
export async function cdekCalcTariffList(payload: any): Promise<any> {
  return cdekApi('POST', '/v2/calculator/tariffList', payload);
}

/** Регистрация заказа на доставку */
export async function cdekCreateOrder(payload: any): Promise<any> {
  return cdekApi('POST', '/v2/orders', payload);
}

/** Информация о заказе по UUID */
export async function cdekGetOrder(uuid: string): Promise<any> {
  return cdekApi('GET', `/v2/orders/${encodeURIComponent(uuid)}`);
}

/** Удаление заказа (аннулирование, пока не передан в перевозку) */
export async function cdekDeleteOrder(uuid: string): Promise<any> {
  return cdekApi('DELETE', `/v2/orders/${encodeURIComponent(uuid)}`);
}

/** Форма квитанции (этикетка) в PDF: возвращает бинарные данные */
export async function cdekPrintOrderPdf(orderUuid: string): Promise<Buffer> {
  const settings = await getCdekSettings();
  if (!settings) throw new Error('CDEK не подключён');
  const print = await cdekApi('POST', '/v2/print/orders', {
    entity: { uuids: [orderUuid] },
    format: 'A6',
  });
  const url = print?.entity?.url;
  if (!url) throw new Error('CDEK: не получена ссылка на квитанцию');
  const token = await getCdekToken(settings);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`CDEK: ошибка загрузки квитанции (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/** Список подписок на вебхуки */
export async function cdekListWebhooks(): Promise<any[]> {
  const data = await cdekApi('GET', '/v2/webhooks');
  return Array.isArray(data) ? data : [];
}

/** Подписка на вебхук изменения статуса заказа */
export async function cdekSubscribeWebhook(url: string): Promise<any> {
  return cdekApi('POST', '/v2/webhooks', { entity: { url, type: 'ORDER_STATUS' } });
}

/** Отмена подписки на вебхук */
export async function cdekUnsubscribeWebhook(uuid: string): Promise<any> {
  return cdekApi('DELETE', `/v2/webhooks/${encodeURIComponent(uuid)}`);
}

/** Генерация секрета публичного URL вебхука */
export function newWebhookToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/** Человекочитаемые названия статусов заказов СДЭК (основные коды) */
export const CDEK_STATUS_NAMES: Record<string, string> = {
  '1': 'Создан',
  '2': 'Удалён',
  '3': 'Принят в СДЭК',
  '4': 'Выдан на отправку в г. отправителе',
  '5': 'В пути',
  '6': 'Выдан на доставку в г. получателе',
  '7': 'Вручен',
  '8': 'Не вручен',
  '9': 'Возвращён',
  '10': 'Сдан на транзит в г. отправителе',
  '11': 'В пути до склада возврата',
  '12': 'Возвращён на склад отгрузки',
  '13': 'Возвращён в г. приёмки',
  '16': 'Возвращён отправителю',
  '17': 'Возвращён в СДЭК',
  '18': 'Выдан для возврата в г. приёмке',
  '19': 'Возвращён в г. приёмки',
  '20': 'Возврат на склад отгрузки',
  '21': 'Возврат на склад возврата',
  '22': 'Передан на возврат в ИМ',
  '23': 'Возвращён в ИМ',
  '24': 'Ожидает отправки в ИМ',
  '25': 'Зарезервирован на СДЭК',
  '26': 'Оформлен новый заказ возврата',
  '27': 'Оформлен новый заковор возврата в ИМ',
  '28': 'Оформлен новый заковор возврата в ИМ на доставку',
  '29': 'Оформлен новый заковор возврата в ИМ до ПВЗ',
  '30': 'Назначен на рейс в г. отправителе',
  '31': 'Назначен на рейс в г. получателе',
  '32': 'Заказ не найден',
  '33': 'Сдан на транзит в г. транзите',
  '34': 'В пути до г. транзита',
  '35': 'В г. транзите',
  '36': 'Сдан на возврат в г. отправителе',
  '37': 'В пути в г. возврата',
  '38': 'В г. возврата',
  '39': 'Вручен в г. возврата',
  '40': 'В пути в г. отправителе',
  '41': 'В г. отправителе',
  '42': 'Назначен на рейс в г. транзите',
  '43': 'Назначен на рейс в г. возврата',
  '44': 'Выдан на доставку в г. возврата',
  '45': 'Исключен из рейса',
  '46': 'Не подтверждена доставка',
  '47': 'Отказ в сдаче',
  '48': 'Ошибочный номер',
  '49': 'Сдан на транзит в г. возврата',
  '50': 'Принят в СДЭК в г. возврата',
  '51': 'Заказ испорчен',
  '52': 'Переоформление',
  '53': 'Возвращён на склад отгрузки',
  '54': 'Назначен на рейс в г. возврата',
  '55': 'Выдан на доставку в г. транзите',
  '56': 'Выдан на доставку в г. отправителе',
  '57': 'Заказ консолидирован',
  '58': 'Заказ деконсолидирован',
  '59': 'Возвращён в СДЭК в г. возврата',
  '60': 'Заменён на доставку',
  '61': 'Оперативная сортировка',
  '62': 'Передан на возврат',
  '63': 'Выдан на отправку в г. возврата',
  '64': 'В пути в г. транзита',
  '65': 'Ожидает вручения в г. возврата',
};
