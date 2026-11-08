import type { Request } from 'express';
import { currentTenant, platformPrisma } from './tenant.js';
import { describeClient, getClientIp } from './security.js';

type TenantOverride = { id?: string | null; slug: string; name: string; isMain?: boolean };

/** Успешные входы всех организаций пишем централизованно в platform DB. */
export async function recordAuthEvent(
  req: Request,
  data: { login: string; userId?: string | null; authMethod: string },
  tenantOverride?: TenantOverride,
): Promise<void> {
  try {
    const current = currentTenant();
    const tenant = tenantOverride || (current
      ? { id: current.id, slug: current.slug, name: current.name, isMain: current.isMain }
      : { id: null, slug: 'main', name: 'Главная организация', isMain: true });
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 1000);
    const client = describeClient(userAgent);
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
      },
    });
  } catch (err: any) {
    // Журнал не должен блокировать вход; ошибка остаётся видимой в серверном журнале.
    console.error('[security] Не удалось записать авторизацию:', err?.message || err);
  }
}
