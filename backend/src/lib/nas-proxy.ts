/**
 * Управление правилом Reverse Proxy на Synology NAS (DSM Web API).
 *
 * Внешний HTTPS тенантов терминируется на CRM-сервере: HAProxy на сервере
 * маршрутизирует SNI *.welans.cc на локальный nginx (wildcard-сертификат,
 * автообновление acme.sh), поэтому правила :443 и сертификаты на NAS
 * больше не нужны. На NAS остаётся только правило :80 (<slug>.welans.cc
 * -> CRM-сервер) для редиректа HTTP -> HTTPS: схема HTTP приходит на NAS,
 * дальше серверный nginx отвечает 301 на HTTPS.
 * Правило удаляется вместе с организацией. Операции идемпотентны;
 * ошибки логируются и не прерывают регистрацию (можно донастроить вручную).
 */

const DSM_URL = process.env.NAS_DSM_URL || 'http://192.168.8.3:5000';
const DSM_USER = process.env.NAS_DSM_USER || 'jack';
const DSM_PASS = process.env.NAS_DSM_PASSWORD || '';
const BACKEND_HOST = process.env.NAS_BACKEND_HOST || '192.168.8.145';
const BACKEND_PORT = Number(process.env.NAS_BACKEND_PORT || 80);
const BASE_DOMAIN = process.env.NAS_BASE_DOMAIN || 'welans.cc';

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

/** Правило Reverse Proxy :80 для поддомена организации (редирект на HTTPS) */
function buildEntry(slug: string): Record<string, any> {
  return {
    backend: { fqdn: BACKEND_HOST, port: BACKEND_PORT, protocol: 0 },
    customize_headers: [
      { name: 'Upgrade', value: '$http_upgrade' },
      { name: 'Connection', value: '$connection_upgrade' },
    ],
    description: entryDescription(slug),
    frontend: { fqdn: `${slug}.${BASE_DOMAIN}`, https: { hsts: false }, port: 80, protocol: 0 },
    proxy_connect_timeout: 600,
    proxy_http_version: 1,
    proxy_intercept_errors: false,
    proxy_read_timeout: 600,
    proxy_send_timeout: 600,
  };
}

/**
 * Создаёт правило Reverse Proxy :80 для поддомена организации
 * (редирект HTTP -> HTTPS через серверный nginx). Идемпотентно.
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
    if (entries.some((e) => e.frontend?.fqdn === `${slug}.${BASE_DOMAIN}` && e.frontend?.port === 80)) {
      console.log(`[NAS] Правило :80 для ${slug}.${BASE_DOMAIN} уже существует`);
      return;
    }
    const data = await dsmPost(sid, { method: 'create', entry: JSON.stringify(buildEntry(slug)) });
    if (!data?.success) throw new Error(`create :80: ${JSON.stringify(data?.error)}`);
    console.log(`[NAS] Правило Reverse Proxy создано: ${slug}.${BASE_DOMAIN}:80 -> ${BACKEND_HOST}:${BACKEND_PORT}`);
  } finally {
    try { await fetch(`${DSM_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=1&method=logout&_sid=${sid}`, { signal: AbortSignal.timeout(10_000) }); } catch { /* ignore */ }
  }
}

/** Удаляет правила Reverse Proxy поддомена организации. Идемпотентно. */
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
