import type { Request } from 'express';
import { currentTenant, platformPrisma } from './tenant.js';
import { describeClient, getClientIp } from './security.js';

type TenantOverride = { id?: string | null; slug: string; name: string; isMain?: boolean };

const recentSuccessfulEvents = new Map<string, number>();
const SUCCESS_EVENT_DEDUPE_MS = 2000;
const DEFAULT_FAILURE_THRESHOLD = 5;

async function autoBlockAfterConsecutiveFailures(ipAddress: string): Promise<void> {
  if (ipAddress === 'unknown') return;
  const db = platformPrisma as any;
  const settings = await db.ipSecuritySettings.findUnique({ where: { id: 1 } });
  const threshold = settings?.failureThreshold || DEFAULT_FAILURE_THRESHOLD;
  const trusted = await db.ipAccessRule.findFirst({
    where: { ipAddress, listType: 'white' },
    select: { id: true },
  });
  if (trusted) return;

  const events = await db.authEvent.findMany({
    where: { ipAddress, authMethod: { not: 'blocked-ip' } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: threshold,
    select: { success: true },
  });
  let failures = 0;
  for (const event of events) {
    if (event.success) break;
    failures += 1;
  }
  if (failures < threshold) return;

  await db.ipAccessRule.upsert({
    where: { ipAddress_listType: { ipAddress, listType: 'black' } },
    create: { ipAddress, listType: 'black' },
    update: {},
  });
  console.warn(`[security] IP ${ipAddress} автоматически добавлен в чёрный список после ${failures} неудачных входов подряд`);
}

/** Успешные и неудачные входы всех организаций пишем централизованно в platform DB. */
export async function recordAuthEvent(
  req: Request,
  data: { login: string; userId?: string | null; authMethod: string; success?: boolean },
  tenantOverride?: TenantOverride,
): Promise<void> {
  try {
    const current = currentTenant();
    const tenant = tenantOverride || (current
      ? { id: current.id, slug: current.slug, name: current.name, isMain: current.isMain }
      : { id: null, slug: 'main', name: 'Главная организация', isMain: true });
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 1000);
    const client = describeClient(userAgent);
    const success = data.success !== false;
    if (success) {
      const key = JSON.stringify([tenant.slug, data.userId || null, data.login, getClientIp(req), data.authMethod, userAgent]);
      const now = Date.now();
      const previous = recentSuccessfulEvents.get(key);
      if (previous && now - previous <= SUCCESS_EVENT_DEDUPE_MS) return;
      recentSuccessfulEvents.set(key, now);
      if (recentSuccessfulEvents.size > 5000) {
        for (const [eventKey, createdAt] of recentSuccessfulEvents) {
          if (now - createdAt > SUCCESS_EVENT_DEDUPE_MS) recentSuccessfulEvents.delete(eventKey);
        }
      }
    }
    await (platformPrisma as any).authEvent.create({
      data: {
        tenantId: tenant.id || null,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        userId: data.userId || null,
        login: String(data.login || 'не указан').slice(0, 320),
        ipAddress: getClientIp(req),
        userAgent,
        device: client.device,
        clientType: client.clientType,
        authMethod: data.authMethod,
        success,
      },
    });
    if (!success) {
      try {
        await autoBlockAfterConsecutiveFailures(getClientIp(req));
      } catch (err: any) {
        // Ошибка автоблокировки не должна менять ответ на исходную попытку входа.
        console.error('[security] Не удалось выполнить автоблокировку IP:', err?.message || err);
      }
    }
  } catch (err: any) {
    // Журнал не должен блокировать вход; ошибка остаётся видимой в серверном журнале.
    console.error('[security] Не удалось записать авторизацию:', err?.message || err);
  }
}
