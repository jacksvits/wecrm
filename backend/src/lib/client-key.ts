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
 * контакта без ключа. Регистрируется на платформенном и всех tenant-клиентах,
 * поэтому любой путь создания контакта (роуты, telegram/vk-воркеры,
 * импорты, гостевые демо) получает ключ единообразно.
 */
export function clientKeyMiddleware(params: any, next: (params: any) => Promise<any>) {
  if (params.model === 'Contact' && params.args?.data) {
    if (params.action === 'create' && params.args.data.clientKey === undefined) {
      params.args.data.clientKey = generateClientKey();
    } else if (params.action === 'createMany' && Array.isArray(params.args.data)) {
      for (const data of params.args.data) {
        if (data && data.clientKey === undefined) data.clientKey = generateClientKey();
      }
    }
  }
  return next(params);
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
