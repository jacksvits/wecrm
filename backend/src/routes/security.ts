import { Router } from 'express';
import { BlockList, isIP } from 'net';
import { authMiddleware } from '../middleware/auth.js';
import { getClientIp, ipMatchesRules, normalizeIpAddress, normalizeIpRule, rateLimit } from '../lib/security.js';
import { IP_BLOCKED_MESSAGE, isIpBlacklisted } from '../lib/ip-access.js';
import { platformPrisma } from '../lib/tenant.js';
import { requirePlatformAdmin } from './platform.js';

const router = Router();
const PAGE_SIZE = 50;

type IpInfo = {
  ip: string;
  country: string | null;
  city: string | null;
  registrationCountry: string | null;
  organization: string | null;
};

const ipInfoCache = new Map<string, { data: IpInfo; expires: number }>();
const rdapBootstrapCache = new Map<string, { services: any[]; expires: number }>();

function regionName(value: unknown): string | null {
  const code = String(value || '').trim();
  if (!code) return null;
  if (/^[a-z]{2}$/i.test(code)) {
    try {
      return new Intl.DisplayNames(['ru'], { type: 'region' }).of(code.toUpperCase()) || code.toUpperCase();
    } catch { return code.toUpperCase(); }
  }
  return code;
}

function preferredRdapEntity(data: any): any {
  const entities = Array.isArray(data?.entities) ? data.entities : [];
  return entities.find((entity: any) => Array.isArray(entity?.roles) && entity.roles.includes('registrant') && entity?.vcardArray) || entities[0];
}

function rdapOrganization(data: any): string | null {
  const vcard = Array.isArray(preferredRdapEntity(data)?.vcardArray?.[1]) ? preferredRdapEntity(data).vcardArray[1] : [];
  const name = vcard.find((row: any) => Array.isArray(row) && row[0] === 'fn')?.[3];
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

function rdapRegistrationCountry(data: any): string | null {
  if (data?.country) return regionName(data.country);
  const vcard = Array.isArray(preferredRdapEntity(data)?.vcardArray?.[1]) ? preferredRdapEntity(data).vcardArray[1] : [];
  const label = vcard.find((row: any) => Array.isArray(row) && row[0] === 'adr')?.[1]?.label;
  if (typeof label !== 'string') return null;
  const lines = label.split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean);
  return lines.length ? regionName(lines[lines.length - 1]) : null;
}

async function lookupRdap(ip: string): Promise<any> {
  const family = isIP(ip) === 4 ? 'ipv4' : 'ipv6';
  let cached = rdapBootstrapCache.get(family);
  if (!cached || cached.expires <= Date.now()) {
    const bootstrap = await fetchJson(`https://data.iana.org/rdap/${family}.json`);
    cached = { services: bootstrap.services || [], expires: Date.now() + 24 * 60 * 60_000 };
    rdapBootstrapCache.set(family, cached);
  }
  for (const service of cached.services) {
    const prefixes = Array.isArray(service?.[0]) ? service[0] : [];
    const urls = Array.isArray(service?.[1]) ? service[1] : [];
    const base = urls.find((url: unknown) => typeof url === 'string' && url.startsWith('https://'));
    if (!base) continue;
    const block = new BlockList();
    for (const prefix of prefixes) {
      const [address, mask] = String(prefix).split('/');
      block.addSubnet(address, Number(mask), isIP(address) === 4 ? 'ipv4' : 'ipv6');
    }
    if (block.check(ip, family)) return fetchJson(`${base.replace(/\/$/, '')}/ip/${encodeURIComponent(ip)}`);
  }
  throw new Error('RDAP-реестр не найден');
}

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'WeCRM-Security/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupIpInfo(value: string): Promise<IpInfo> {
  const ip = normalizeIpAddress(value);
  if (!ip) throw new Error('Некорректный IP-адрес');
  const cached = ipInfoCache.get(ip);
  if (cached && cached.expires > Date.now()) return cached.data;

  // Геолокация и регистрационные данные запрашиваются независимо: сбой одного
  // публичного источника не лишает администратора сведений от второго.
  const [geoResult, rdapResult] = await Promise.allSettled([
    fetchJson(`https://api.ipapi.is/?q=${encodeURIComponent(ip)}`),
    lookupRdap(ip),
  ]);
  const geo = geoResult.status === 'fulfilled' ? geoResult.value : null;
  const rdap = rdapResult.status === 'fulfilled' ? rdapResult.value : null;
  const company = typeof geo?.company === 'string' ? geo?.company : geo?.company?.name;
  const data: IpInfo = {
    ip,
    country: geo?.location?.country || geo?.country || null,
    city: geo?.location?.city || geo?.city || null,
    registrationCountry: regionName(geo?.asn?.country) || rdapRegistrationCountry(rdap),
    organization: company || geo?.asn?.org || rdapOrganization(rdap),
  };
  const available = Boolean(data.country || data.city || data.registrationCountry || data.organization);
  ipInfoCache.set(ip, { data, expires: Date.now() + (available ? 6 * 60 * 60_000 : 5 * 60_000) });
  if (ipInfoCache.size > 1000) {
    const oldest = ipInfoCache.keys().next().value;
    if (oldest) ipInfoCache.delete(oldest);
  }
  return data;
}

// Публичный статус нужен странице входа; раскрывается только IP самого клиента.
router.get('/access-status', rateLimit({ prefix: 'access-status', windowMs: 15 * 60_000, max: 120 }), async (req, res) => {
  try {
    const ipAddress = getClientIp(req);
    res.json({ ipAddress, blocked: await isIpBlacklisted(ipAddress) });
  } catch (err: any) {
    console.error('[security] access-status:', err?.message || err);
    res.status(500).json({ error: 'Не удалось проверить доступ по IP' });
  }
});

// Журнал доступен только главному администратору на основном домене.
router.get('/auth-events', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Math.min(1_000_000, Number.parseInt(String(req.query.page || '1'), 10) || 1));
    const ipList = String(req.query.ipList || '');
    if (ipList === 'white' || ipList === 'black' || ipList === 'new') {
      // Фильтр по списку: IP записи должен точно совпадать с правилом или попадать в его подсеть/диапазон.
      // «new» — наоборот: записи, чей IP не входит ни в один из списков.
      const rules = await (platformPrisma as any).ipAccessRule.findMany({
        where: ipList === 'new' ? {} : { listType: ipList },
        select: { ipAddress: true },
      });
      const patterns = rules.map((rule: { ipAddress: string }) => rule.ipAddress);
      const matched: any[] = [];
      const CHUNK = 1000;
      for (let skip = 0; ; skip += CHUNK) {
        const rows = await (platformPrisma as any).authEvent.findMany({
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: CHUNK,
        });
        for (const row of rows) {
          const listed = ipMatchesRules(row.ipAddress, patterns);
          if (ipList === 'new' ? !listed : listed) matched.push(row);
        }
        if (rows.length < CHUNK) break;
      }
      const total = matched.length;
      const items = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      return res.json({
        items: items.map((row: any) => ({
          id: row.id,
          tenantSlug: row.tenantSlug,
          tenantName: row.tenantName,
          login: row.login,
          ipAddress: row.ipAddress,
          device: row.device,
          clientType: row.clientType,
          authMethod: row.authMethod,
          success: row.success,
          createdAt: row.createdAt,
        })),
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      });
    }
    const [total, items] = await Promise.all([
      (platformPrisma as any).authEvent.count(),
      (platformPrisma as any).authEvent.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);
    res.json({
      items: items.map((row: any) => ({
        id: row.id,
        tenantSlug: row.tenantSlug,
        tenantName: row.tenantName,
        login: row.login,
        ipAddress: row.ipAddress,
        device: row.device,
        clientType: row.clientType,
        authMethod: row.authMethod,
        success: row.success,
        createdAt: row.createdAt,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (err: any) {
    console.error('[security] auth-events:', err?.message || err);
    res.status(500).json({ error: 'Не удалось загрузить журнал авторизаций' });
  }
});

router.get('/ip-info', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const ip = normalizeIpAddress(req.query.ip);
    if (!ip) return res.status(400).json({ error: 'Некорректный IP-адрес' });
    res.json(await lookupIpInfo(ip));
  } catch (err: any) {
    console.error('[security] ip-info:', err?.message || err);
    res.status(502).json({ error: 'Не удалось получить сведения об IP-адресе' });
  }
});

router.get('/ip-rules', authMiddleware, requirePlatformAdmin, async (_req, res) => {
  try {
    const [items, settings] = await Promise.all([
      (platformPrisma as any).ipAccessRule.findMany({
        orderBy: [{ listType: 'asc' }, { createdAt: 'desc' }],
      }),
      (platformPrisma as any).ipSecuritySettings.findUnique({ where: { id: 1 } }),
    ]);
    res.json({ items, autoBlockThreshold: settings?.failureThreshold || 5 });
  } catch (err: any) {
    console.error('[security] ip-rules list:', err?.message || err);
    res.status(500).json({ error: 'Не удалось загрузить списки IP-адресов' });
  }
});

router.post('/ip-rules', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const ipAddress = normalizeIpRule(req.body?.ipAddress);
    const listType = String(req.body?.listType || '');
    if (!ipAddress) return res.status(400).json({ error: 'Введите корректный IP-адрес, подсеть (203.0.113.0/24) или диапазон (203.0.113.10-203.0.113.50)' });
    if (!['white', 'black'].includes(listType)) return res.status(400).json({ error: 'Неизвестный тип списка' });
    const item = await platformPrisma.$transaction(async (tx: any) => {
      // Адрес находится только в одном списке: добавление переносит его из противоположного.
      await tx.ipAccessRule.deleteMany({ where: { ipAddress, listType: listType === 'white' ? 'black' : 'white' } });
      return tx.ipAccessRule.create({ data: { ipAddress, listType } });
    });
    res.status(201).json(item);
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Этот адрес или диапазон уже есть в выбранном списке' });
    console.error('[security] ip-rules create:', err?.message || err);
    res.status(500).json({ error: 'Не удалось добавить IP-адрес' });
  }
});

router.patch('/ip-settings', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const failureThreshold = Number(req.body?.failureThreshold);
    if (!Number.isInteger(failureThreshold) || failureThreshold < 1 || failureThreshold > 1000) {
      return res.status(400).json({ error: 'Укажите целое число от 1 до 1000' });
    }
    const settings = await (platformPrisma as any).ipSecuritySettings.upsert({
      where: { id: 1 },
      create: { id: 1, failureThreshold },
      update: { failureThreshold },
    });
    res.json({ failureThreshold: settings.failureThreshold });
  } catch (err: any) {
    console.error('[security] ip-settings update:', err?.message || err);
    res.status(500).json({ error: 'Не удалось сохранить настройку автоблокировки' });
  }
});

router.delete('/ip-rules/:id', authMiddleware, requirePlatformAdmin, async (req, res) => {
  try {
    const result = await (platformPrisma as any).ipAccessRule.deleteMany({ where: { id: String(req.params.id) } });
    if (!result.count) return res.status(404).json({ error: 'Запись не найдена' });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[security] ip-rules delete:', err?.message || err);
    res.status(500).json({ error: 'Не удалось удалить IP-адрес' });
  }
});

export default router;
