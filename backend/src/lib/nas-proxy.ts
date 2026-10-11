/**
 * Управление правилами Reverse Proxy на Synology NAS (DSM Web API).
 *
 * Внешний HTTPS-трафик поддоменов организаций проходит через NAS
 * (192.168.8.3), поэтому при регистрации tenant'а здесь автоматически
 * создаётся правило <slug>.welans.cc:443 → CRM-сервер (HTTP :80,
 * серверный nginx терминирует TLS wildcard-сертификатом). Правило
 * удаляется вместе с организацией. Все операции идемпотентны; ошибки
 * логируются и не прерывают регистрацию (правило можно добавить вручную).
 */

const DSM_URL = process.env.NAS_DSM_URL || 'http://192.168.8.3:5000';
const DSM_USER = process.env.NAS_DSM_USER || 'jack';
const DSM_PASS = process.env.NAS_DSM_PASSWORD || '';
const BACKEND_HOST = process.env.NAS_BACKEND_HOST || '192.168.8.145';
const BACKEND_PORT = Number(process.env.NAS_BACKEND_PORT || 80);

function entryDescription(slug: string): string {
  return `CRM tenant ${slug}`;
}

interface DsmEntry {
  UUID: string;
  description?: string;
  frontend?: { fqdn?: string };
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

/** Создаёт правило Reverse Proxy для поддомена организации (идемпотентно) */
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
    if (entries.some((e) => e.frontend?.fqdn === `${slug}.welans.cc` || e.description === entryDescription(slug))) {
      console.log(`[NAS] Правило для ${slug}.welans.cc уже существует`);
      return;
    }
    const entry = {
      backend: { fqdn: BACKEND_HOST, port: BACKEND_PORT, protocol: 0 },
      customize_headers: [
        { name: 'Upgrade', value: '$http_upgrade' },
        { name: 'Connection', value: '$connection_upgrade' },
      ],
      description: entryDescription(slug),
      frontend: { fqdn: `${slug}.welans.cc`, https: { hsts: false }, port: 443, protocol: 1 },
      proxy_connect_timeout: 600,
      proxy_http_version: 1,
      proxy_intercept_errors: false,
      proxy_read_timeout: 600,
      proxy_send_timeout: 600,
    };
    const data = await dsmPost(sid, { method: 'create', entry: JSON.stringify(entry) });
    if (!data?.success) throw new Error(`create: ${JSON.stringify(data?.error)}`);
    console.log(`[NAS] Правило Reverse Proxy создано: ${slug}.welans.cc -> ${BACKEND_HOST}:${BACKEND_PORT}`);
  } finally {
    try { await fetch(`${DSM_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=1&method=logout&_sid=${sid}`, { signal: AbortSignal.timeout(10_000) }); } catch { /* ignore */ }
  }
}

/** Удаляет правило Reverse Proxy поддомена организации (идемпотентно) */
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
    const match = entries.find((e) => e.frontend?.fqdn === `${slug}.welans.cc` || e.description === entryDescription(slug));
    if (!match) return;
    const data = await dsmPost(sid, { method: 'delete', UUID: match.UUID });
    if (!data?.success) throw new Error(`delete: ${JSON.stringify(data?.error)}`);
    console.log(`[NAS] Правило Reverse Proxy удалено: ${slug}.welans.cc`);
  } finally {
    try { await fetch(`${DSM_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=1&method=logout&_sid=${sid}`, { signal: AbortSignal.timeout(10_000) }); } catch { /* ignore */ }
  }
}
