import { PrismaClient } from '@prisma/client';

/**
 * Публичный ключ контакта для привязки устройств Windows-агента.
 * Формат: 000-000-000 (три группы по три цифры), генерируется случайно.
 * Коллизии исключаем проверкой уникальности в БД.
 */
export function generateClientKey(): string {
  const group = () => String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${group()}-${group()}-${group()}`;
}

/** Генерирует ключ, гарантированно уникальный среди существующих контактов */
export async function generateUniqueClientKey(prisma: PrismaClient): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const key = generateClientKey();
    const exists = await (prisma as any).contact.findUnique({ where: { clientKey: key }, select: { id: true } });
    if (!exists) return key;
  }
  // Практически недостижимо, но на всякий случай добавляем суффикс времени
  return generateClientKey() + String(Date.now() % 1000).padStart(3, '0');
}

/**
 * Prisma-middleware: автоматически проставляет clientKey при создании
 * контакта/организации без ключа. Регистрируется на платформенном и всех
 * tenant-клиентах, поэтому любой путь создания (роуты, telegram/vk-воркеры,
 * импорты, гостевые демо) получает ключ единообразно.
 *
 * Уникальность гарантируем двойно:
 *  1) ключ проверяется запросом в БД до вставки (несколько попыток);
 *  2) уникальный индекс contacts_client_key_key не допустит дубль даже
 *     при гонке параллельных вставок.
 */
export function makeClientKeyMiddleware(getDelegate: () => any) {
  return async function clientKeyMiddleware(params: any, next: (params: any) => Promise<any>) {
    if (params.model !== 'Contact' || !params.args?.data) return next(params);

    const ensureUnique = async () => {
      // до 5 попыток: сгенерировать ключ и убедиться, что его ещё нет
      for (let i = 0; i < 5; i++) {
        const key = generateClientKey();
        const exists = await getDelegate().findUnique({ where: { clientKey: key }, select: { id: true } });
        if (!exists) return key;
      }
      // крайне маловероятно; уникальный индекс БД всё равно отсечёт дубль
      return generateClientKey();
    };

    if (params.action === 'create' && params.args.data.clientKey === undefined) {
      params.args.data.clientKey = await ensureUnique();
    } else if (params.action === 'createMany' && Array.isArray(params.args.data)) {
      for (const data of params.args.data) {
        if (data && data.clientKey === undefined) data.clientKey = await ensureUnique();
      }
    }
    return next(params);
  };
}

/** Дозаполняет clientKey контактам, у которых его ещё нет (например, из
 *  бэкапов/сторонних импортов). Возвращает количество обновлённых записей. */
export async function ensureContactClientKeys(prisma: PrismaClient): Promise<number> {
  const missing = await (prisma as any).contact.findMany({
    where: { OR: [{ clientKey: null }, { clientKey: '' }] },
    select: { id: true },
    take: 500,
  });
  for (const c of missing) {
    await (prisma as any).contact.update({ where: { id: c.id }, data: { clientKey: await generateUniqueClientKey(prisma) } });
  }
  return missing.length;
}
