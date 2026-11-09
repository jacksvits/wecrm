import type { Request, Response, NextFunction } from 'express';
import { BlockList, isIP } from 'net';

/** Приводит IPv4/IPv6 к единому виду, чтобы списки нельзя было обойти записью другого формата. */
export function normalizeIpAddress(value: unknown): string | null {
  let ip = String(value || '').trim();
  if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);
  if (isIP(ip) === 4) return ip;
  if (isIP(ip) !== 6) return null;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped && isIP(mapped[1]) === 4) return mapped[1];
  try {
    const normalized = new URL(`http://[${ip}]`).hostname.slice(1, -1).toLowerCase();
    const mappedHex = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mappedHex) {
      const value = (Number.parseInt(mappedHex[1], 16) << 16) + Number.parseInt(mappedHex[2], 16);
      return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
    }
    return normalized;
  } catch {
    return null;
  }
}


/** Одно правило списка доступа: одиночный IP, подсеть CIDR (203.0.113.0/24) или диапазон «от-до» (203.0.113.10-203.0.113.50). */
export function normalizeIpRule(value: unknown): string | null {
  const raw = String(value || '').trim();
  if (!raw || raw.length > 100) return null;

  const cidr = raw.match(/^([^/]+)\/(\d{1,3})$/);
  if (cidr) {
    const address = normalizeIpAddress(cidr[1]);
    if (!address) return null;
    const prefix = Number(cidr[2]);
    const maxPrefix = isIP(address) === 4 ? 32 : 128;
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) return null;
    return `${address}/${prefix}`;
  }

  const range = raw.match(/^([^-]+)-([^-]+)$/);
  if (range) {
    const start = normalizeIpAddress(range[1]);
    const end = normalizeIpAddress(range[2]);
    if (!start || !end || isIP(start) !== isIP(end)) return null;
    try {
      // BlockList отклоняет диапазон, у которого начало больше конца.
      const probe = new BlockList();
      probe.addRange(start, end, isIP(start) === 4 ? 'ipv4' : 'ipv6');
    } catch {
      return null;
    }
    return `${start}-${end}`;
  }

  return normalizeIpAddress(raw);
}

/** Попадает ли IP хотя бы под одно правило списка (одиночный адрес, CIDR или диапазон). */
export function ipMatchesRules(value: string, rules: string[]): boolean {
  const ip = normalizeIpAddress(value);
  if (!ip) return false;
  const family = isIP(ip) === 6 ? 'ipv6' : 'ipv4';
  const blocks = new BlockList();
  for (const rule of rules) {
    try {
      const cidr = rule.match(/^([^/]+)\/(\d{1,3})$/);
      if (cidr) {
        const address = normalizeIpAddress(cidr[1]);
        if (address) blocks.addSubnet(address, Number(cidr[2]), isIP(address) === 4 ? 'ipv4' : 'ipv6');
        continue;
      }
      const range = rule.match(/^([^-]+)-([^-]+)$/);
      if (range) {
        const start = normalizeIpAddress(range[1]);
        const end = normalizeIpAddress(range[2]);
        if (start && end) blocks.addRange(start, end, isIP(start) === 4 ? 'ipv4' : 'ipv6');
        continue;
      }
      const single = normalizeIpAddress(rule);
      if (single) blocks.addAddress(single, isIP(single) === 4 ? 'ipv4' : 'ipv6');
    } catch {
      // Повреждённая запись не должна ломать проверку остального списка.
    }
  }
  try {
    return blocks.check(ip, family);
  } catch {
    return false;
  }
}

/** Реальный IP передаёт доверенный nginx в X-Real-IP (внешний заголовок он перезаписывает). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-real-ip'];
  const raw = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.socket.remoteAddress || 'unknown';
  return normalizeIpAddress(raw) || 'unknown';
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
