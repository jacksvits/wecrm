import { Request, Response, NextFunction } from 'express';
import { resolveTenantByHost, tenantContext } from '../lib/tenant.js';

/**
 * Определяет организацию (tenant'а) по Host-заголовку и кладёт её
 * в AsyncLocalStorage-контекст. Поддомены неизвестных или неактивных
 * организаций отклоняются — данные между организациями жёстко изолированы
 * на уровне отдельных баз данных.
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const host = (req.headers.host || '').toString();
    const tenant = await resolveTenantByHost(host);
    if (!tenant) {
      return res.status(404).json({ error: 'Организация не найдена', code: 'unknown_tenant' });
    }
    if (!tenant.isMain && tenant.status !== 'active') {
      return res.status(402).json({
        error: tenant.status === 'pending'
          ? 'Организация зарегистрирована и ожидает активации после оплаты подписки'
          : 'Доступ организации приостановлен',
        code: tenant.status,
      });
    }
    tenantContext.run(tenant, () => next());
  } catch (e: any) {
    console.error('[tenant] middleware error:', e.message);
    res.status(500).json({ error: 'Ошибка определения организации' });
  }
}
