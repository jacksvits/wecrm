/**
 * Управление правилами Reverse Proxy и сертификатами на Synology NAS (DSM Web API).
 *
 * Внешний трафик поддоменов организаций проходит через NAS (192.168.8.3):
 * при регистрации tenant'а здесь автоматически создаются правила
 * <slug>.welans.cc:443 (HTTPS → CRM-сервер, HTTP :80) и
 * <slug>.welans.cc:80 (HTTP → CRM-сервер; серверный nginx делает
 * редирект на HTTPS). Правила удаляются вместе с организацией.
 * Дополнительно предпринимается попытка выпуска сертификата Let's Encrypt
 * для поддомена (DSM терминирует внешний TLS). Все операции идемпотентны;
 * ошибки логируются и не прерывают регистрацию (можно донастроить вручную).
 */

const DSM_URL = process.env.NAS_DSM_URL || 'http://192.168.8.3:5000';
const DSM_USER = process.env.NAS_DSM_USER || 'jack';
const DSM_PASS = process.env.NAS_DSM_PASSWORD || '';
const BACKEND_HOST = process.env.NAS_BACKEND_HOST || '192.168.8.145';
const BACKEND_PORT = Number(process.env.NAS_BACKEND_PORT || 80);
const BASE_DOMAIN = process.env.NAS_BASE_DOMAIN || 'welans.cc';
const DSM_LE_EMAIL = process.env.NAS_DSM_LE_EMAIL || 'admin@welans.cc';

function entryDescription(slug: string): string {
  return `CRM tenant ${slug}`;
}

interface DsmEntry {
  UUID: string;
  description?: string;
  frontend?: { fqdn?: string; port?: number };
}

async function dsmLogin(): Promise<string> {
  const url = `${DSM_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=${encodeURIComponent(DSM_USER)}&passwd=${encodeURIComponent(DSM_PASS)}&format=sid`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const data: any = await res.json();
  if (!data?.success || !data?.data?.sid) throw new Error(`DSM login failed: ${JSON.stringify(data?.error || data)}`);
  return data.data.sid;
}

async function dsmListEntries(sid: string): Promise<DsmEntry[]> {
  const res = await fetch(`${DSM_URL}/webapi/entry.cgi?api=SYNO.Core.AppPortal.ReverseProxy&version=1&method=list&_sid=${sid}`, { signal: AbortSignal.timeout(15_000) });
  const data: any = await res.json();
  if (!data?.success) throw new Error(`DSM list failed: ${JSON.stringify(data?.error)}`);
  return data?.data?.entries || [];
}

async function dsmPost(sid: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({ api: 'SYNO.Core.AppPortal.ReverseProxy', version: '1', _sid: sid, ...params });
  const res = await fetch(`${DSM_URL}/webapi/entry.cgi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(20_000),
  });
  return res.json();
}

/** Универсальный POST к произвольному API DSM (для сертификатов и т.п.) */
async function dsmApiPost(sid: string, api: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({ api, version: '1', _sid: sid, ...params });
  const res = await fetch(`${DSM_URL}/webapi/entry.cgi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(60_000),
  });
  return res.json();
}

/** Общая часть правила Reverse Proxy для поддомена организации */
function buildEntry(slug: string, port: number, https: boolean): Record<string, any> {
  return {
    backend: { fqdn: BACKEND_HOST, port: BACKEND_PORT, protocol: 0 },
    customize_headers: [
      { name: 'Upgrade', value: '$http_upgrade' },
      { name: 'Connection', value: '$connection_upgrade' },
    ],
    description: entryDescription(slug),
    frontend: { fqdn: `${slug}.${BASE_DOMAIN}`, https: { hsts: false }, port, protocol: https ? 1 : 0 },
    proxy_connect_timeout: 600,
    proxy_http_version: 1,
    proxy_intercept_errors: false,
    proxy_read_timeout: 600,
    proxy_send_timeout: 600,
  };
}

/**
 * Создаёт правила Reverse Proxy для поддомена организации:
 * HTTPS :443 и HTTP :80 (для редиректа на HTTPS). Идемпотентно.
 */
export async function createTenantProxyRule(slug: string): Promise<void> {
  try {
    return await createTenantProxyRuleOnce(slug);
  } catch (e: any) {
    // DSM может отклонить свежий SID при конфликте сессий — одна повторная попытка
    console.warn(`[NAS] createTenantProxyRule retry (${slug}): ${e.message}`);
    return createTenantProxyRuleOnce(slug);
  }
}

async function createTenantProxyRuleOnce(slug: string): Promise<void> {
  const sid = await dsmLogin();
  try {
    const entries = await dsmListEntries(sid);
    const has = (port: number) => entries.some((e) => e.frontend?.fqdn === `${slug}.${BASE_DOMAIN}` && e.frontend?.port === port);
    const targets: Array<[number, boolean]> = [[443, true], [80, false]];
    for (const [port, https] of targets) {
      if (has(port)) {
        console.log(`[NAS] Правило :${port} для ${slug}.${BASE_DOMAIN} уже существует`);
        continue;
      }
      const data = await dsmPost(sid, { method: 'create', entry: JSON.stringify(buildEntry(slug, port, https)) });
      if (!data?.success) throw new Error(`create :${port}: ${JSON.stringify(data?.error)}`);
      console.log(`[NAS] Правило Reverse Proxy создано: ${slug}.${BASE_DOMAIN}:${port} -> ${BACKEND_HOST}:${BACKEND_PORT}`);
    }
  } finally {
    try { await fetch(`${DSM_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=1&method=logout&_sid=${sid}`, { signal: AbortSignal.timeout(10_000) }); } catch { /* ignore */ }
  }
}

/**
 * Пытается выпустить сертификат Let's Encrypt для поддомена организации
 * и привязать его к службе Reverse Proxy на NAS (DSM терминирует внешний TLS).
 *
 * Требует, чтобы учётная запись NAS_DSM_USER входила в группу administrators
 * (API сертификатов DSM доступен только администраторам; без прав операция
 * завершится ошибкой 119/103 и будет залогирована — регистрацию не прерывает).
 */
export async function ensureTenantCertificate(slug: string): Promise<void> {
  const fqdn = `${slug}.${BASE_DOMAIN}`;
  try {
    const sid = await dsmLogin();
    try {
      // Проверяем, нет ли уже сертификата с таким именем (CRT.list отдаёт id и subject)
      const crt = await dsmApiPost(sid, 'SYNO.Core.Certificate.CRT', { method: 'list' });
      const existing = (crt?.data?.certificates || []).find((c: any) => (c?.subject || []).includes(fqdn));
      if (existing) {
        console.log(`[NAS] Сертификат для ${fqdn} уже существует`);
        return;
      }
      // Выпуск Let's Encrypt (HTTP-01; wildcard DNS *.welans.cc уже резолвится на NAS)
      const le = await dsmApiPost(sid, 'SYNO.Core.Certificate.LetsEncrypt', {
        method: 'create',
        domains: JSON.stringify([fqdn]),
        email: DSM_LE_EMAIL,
        terms: 'true',
      });
      if (!le?.success) throw new Error(`LetsEncrypt create: ${JSON.stringify(le?.error)}`);
      console.log(`[NAS] Сертификат Let's Encrypt выпущен: ${fqdn}`);
    } finally {
      try { await fetch(`${DSM_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=1&method=logout&_sid=${sid}`, { signal: AbortSignal.timeout(10_000) }); } catch { /* ignore */ }
    }
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/119|103/.test(msg)) {
      console.warn(`[NAS] ${fqdn}: выпуск сертификата невозможен — учётной записи ${DSM_USER} нужны права администратора DSM (группа administrators). Выпустите сертификат вручную: DSM → Панель управления → Безопасность → Сертификаты.`);
    } else {
      console.warn(`[NAS] ensureTenantCertificate (${fqdn}): ${msg}`);
    }
  }
}

/** Удаляет правила Reverse Proxy поддомена организации (:443 и :80). Идемпотентно. */
export async function deleteTenantProxyRule(slug: string): Promise<void> {
  try {
    return await deleteTenantProxyRuleOnce(slug);
  } catch (e: any) {
    console.warn(`[NAS] deleteTenantProxyRule retry (${slug}): ${e.message}`);
    return deleteTenantProxyRuleOnce(slug);
  }
}

async function deleteTenantProxyRuleOnce(slug: string): Promise<void> {
  const sid = await dsmLogin();
  try {
    const entries = await dsmListEntries(sid);
    const matches = entries.filter((e) => e.frontend?.fqdn === `${slug}.${BASE_DOMAIN}` || e.description === entryDescription(slug));
    for (const match of matches) {
      const data = await dsmPost(sid, { method: 'delete', UUID: match.UUID });
      if (!data?.success) throw new Error(`delete: ${JSON.stringify(data?.error)}`);
    }
    if (matches.length > 0) console.log(`[NAS] Правила Reverse Proxy удалены (${matches.length}): ${slug}.${BASE_DOMAIN}`);
  } finally {
    try { await fetch(`${DSM_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=1&method=logout&_sid=${sid}`, { signal: AbortSignal.timeout(10_000) }); } catch { /* ignore */ }
  }
}
