// Единый реестр плагинов CRM — источник списка «Доступные интеграции» в карточках подписки
// (GET /api/integrations/registry). Новый плагин добавляется ТОЛЬКО сюда: чекбоксы
// в админке подписок и другие потребители подтянут его автоматически.
export const CRM_PLUGINS: { key: string; label: string }[] = [
  { key: 'email', label: 'Почта' },
  { key: 'telephony', label: 'Телефония' },
  { key: 'sms', label: 'SMS журнал' },
  { key: 'max', label: 'MAX' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'vkCommunity', label: 'ВК сообщество' },
  { key: 'vkMarket', label: 'ВК товары' },
  { key: 'vkAuth', label: 'ВК авторизация' },
  { key: 'yandex', label: 'Яндекс' },
  { key: 'dgis', label: '2ГИС' },
  { key: 'beget', label: 'Beget' },
  { key: 'pskovline', label: 'Псковлайн' },
  { key: 'onec', label: '1С УТ 8.3' },
  { key: 'tochka', label: 'Точка Банк' },
  { key: 'tochkaAcquiring', label: 'Эквайринг от Точки' },
  { key: 'vpn', label: 'Прокси через VPN' },
  { key: 'diadoc', label: 'Контур.Диадок' },
  { key: 'ozon', label: 'OZON Seller' },
  { key: 'wb', label: 'WB Seller' },
  { key: 'hikvision', label: 'Камеры Hik-Connect' },
  { key: 'cdek', label: 'CDEK' },
  { key: 'tapo', label: 'Камеры Tapo' },
  { key: 'rss', label: 'Парсинг RSS' },
  { key: 'yandexMetrika', label: 'Яндекс.Метрика' },
];
