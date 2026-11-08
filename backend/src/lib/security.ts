import type { Request, Response, NextFunction } from 'express';
import { isIP } from 'net';

/** Реальный IP передаёт доверенный nginx в X-Real-IP (внешний заголовок он перезаписывает). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-real-ip'];
  let ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.socket.remoteAddress || 'unknown';
  ip = String(ip).trim().replace(/^::ffff:/, '');
  return isIP(ip) ? ip.slice(0, 64) : 'unknown';
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Небольшой per-process limiter для публичных auth/webhook-маршрутов. */
export function rateLimit(options: { windowMs: number; max: number; prefix: string; key?: (req: Request) => string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const extra = options.key?.(req) || '';
    const key = `${options.prefix}:${getClientIp(req)}:${extra}`.slice(0, 300);
    // Не даём злоумышленнику исчерпать память уникальными логинами/IP.
    if (!buckets.has(key) && buckets.size >= 50_000) {
      res.setHeader('Retry-After', '600');
      return res.status(429).json({ error: 'Слишком много попыток. Попробуйте позже.' });
    }
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader('RateLimit-Limit', String(options.max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, options.max - bucket.count)));
    if (bucket.count > options.max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ error: 'Слишком много попыток. Попробуйте позже.' });
    }
    next();
  };
}

// Периодическая очистка, чтобы публичные маршруты не наращивали Map бесконечно.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}, 10 * 60_000);
cleanup.unref();

export function describeClient(userAgent: string): { device: string; clientType: 'mobile' | 'desktop' } {
  const ua = userAgent || '';
  const mobile = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua);
  const os = /Windows NT/i.test(ua) ? 'Windows'
    : /Android/i.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
    : /Mac OS X/i.test(ua) ? 'macOS'
    : /Linux/i.test(ua) ? 'Linux' : 'Неизвестная ОС';
  const browser = /Edg\//i.test(ua) ? 'Edge'
    : /OPR\//i.test(ua) ? 'Opera'
    : /YaBrowser\//i.test(ua) ? 'Яндекс Браузер'
    : /Firefox\//i.test(ua) ? 'Firefox'
    : /Chrome\//i.test(ua) ? 'Chrome'
    : /Safari\//i.test(ua) ? 'Safari' : 'Браузер';
  return { device: `${os} · ${browser}`, clientType: mobile ? 'mobile' : 'desktop' };
}
