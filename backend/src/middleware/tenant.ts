import { Request, Response, NextFunction } from 'express';
import { resolveTenantByHost, tenantContext } from '../lib/tenant.js';

/**
 * Определяет организацию (tenant'а) по Host-заголовку и кладёт её
 * в AsyncLocalStorage-контекст. Поддомены неизвестных или неактивных
 * организаций отклоняются — данные между организациями жёстко изолированы
 * на уровне отдельных баз данных.
 *
 * Исключение: организации со статусом pending могут обращаться к
 * pay-info / pay-notify (экран ожидания активации с кнопкой оплаты).
 */
const PENDING_ALLOWED_PATHS = ['/platform/pay-info', '/platform/pay-notify'];

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const host = (req.headers.host || '').toString();
    const tenant = await resolveTenantByHost(host);
    if (!tenant) {
      return res.status(404).json({ error: 'Организация не найдена', code: 'unknown_tenant' });
    }
    if (!tenant.isMain && tenant.status !== 'active') {
      const allowed = tenant.status === 'pending' && PENDING_ALLOWED_PATHS.some((p) => req.path.startsWith(p));
      if (!allowed) {
        return res.status(402).json({
          error: tenant.status === 'pending'
            ? 'Организация зарегистрирована и ожидает активации после оплаты подписки'
            : 'Доступ организации приостановлен',
          code: tenant.status,
        });
      }
    }
    tenantContext.run(tenant, () => next());
  } catch (e: any) {
    console.error('[tenant] middleware error:', e.message);
    res.status(500).json({ error: 'Ошибка определения организации' });
  }
}
