import { PrismaClient } from '@prisma/client';
import { platformPrisma, tenantContext, getTenantPrisma } from './tenant.js';

/**
 * Глобальный prisma-клиент. Для главного домена и вне HTTP-контекста
 * (скрипты, часть воркеров) обращается к платформенной БД. Внутри запроса
 * tenant-поддомена — прозрачно маршрутизируется в БД текущей организации
 * через AsyncLocalStorage (см. lib/tenant.ts и middleware/tenant.ts).
 */
function activeClient(): PrismaClient {
  const t = tenantContext.getStore();
  if (t && !t.isMain) return getTenantPrisma(t.dbName);
  return platformPrisma;
}

export const prisma = new Proxy(platformPrisma, {
  get(_target, prop) {
    const client = activeClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as PrismaClient;
