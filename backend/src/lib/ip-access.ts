import type { NextFunction, Request, Response } from 'express';
import { recordAuthEvent } from './auth-events.js';
import { getClientIp, ipMatchesRules, normalizeIpAddress } from './security.js';
import { platformPrisma } from './tenant.js';

export const IP_BLOCKED_MESSAGE = 'Ваш IP-адрес заблокирован администратором';

export async function isIpBlacklisted(value: string): Promise<boolean> {
  const ip = normalizeIpAddress(value);
  if (!ip) return false;
  // Правила могут быть одиночными адресами, подсетями CIDR или диапазонами.
  const rules = await (platformPrisma as any).ipAccessRule.findMany({
    where: { listType: 'black' },
    select: { ipAddress: true },
  });
  return ipMatchesRules(ip, rules.map((rule: { ipAddress: string }) => rule.ipAddress));
}

/** Блокирует публичные auth-endpoint'ы; белый список намеренно не отменяет чёрный. */
export async function rejectBlockedIp(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = getClientIp(req);
    if (!(await isIpBlacklisted(ip))) return next();

    await recordAuthEvent(req, {
      login: String(req.body?.login || req.body?.email || 'не указан'),
      authMethod: 'blocked-ip',
      success: false,
    });
    if (req.path === '/callback') return res.redirect('/?vk_error=ip_blocked');
    return res.status(403).json({ error: IP_BLOCKED_MESSAGE, code: 'IP_BLOCKED', ipAddress: ip });
  } catch (err: any) {
    // Ошибка БД не должна блокировать вход всем пользователям платформы.
    console.error('[security] Не удалось проверить чёрный список IP:', err?.message || err);
    return next();
  }
}
