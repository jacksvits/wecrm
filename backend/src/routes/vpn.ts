import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { ProxyAgent } from 'undici';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

// === Плагин «Прокси через VPN» ===
// Хранит VPN-подписку (vless, формат Happ/Incy), генерирует конфиг для
// контейнера sing-box (общий том ./vpn/sing-box → /app/vpn-config в бэкенде)
// и проверяет связь. Через этот прокси бэкенд ходит к Telegram API
// (см. lib/telegram-api.ts, переменная TELEGRAM_PROXY_URL).

const router = Router();

const CONFIG_PATH = process.env.VPN_CONFIG_PATH || '/app/vpn-config/config.json';

const settingsSchema = z.object({
  isActive: z.boolean().default(false),
  subscriptionUrl: z.string().min(1),
});

// Разбор vless://-ссылки подписки в outbound sing-box
function parseVless(link: string) {
  const m = link.match(/^vless:\/\/([^@]+)@([^:]+):(\d+)\?(.+)$/);
  if (!m) return null;
  const [, uuid, server, port, rawQuery] = m;
  // отсекаем URI-фрагмент (#название сервера), иначе попадёт в sid
  const params = new URLSearchParams(rawQuery.split('#')[0]);
  if ((params.get('security') || '').toLowerCase() !== 'reality') return null;
  return {
    type: 'vless',
    tag: 'proxy',
    server,
    server_port: Number(port),
    uuid,
    flow: params.get('flow') || undefined,
    network: params.get('type') || 'tcp',
    tls: {
      enabled: true,
      server_name: params.get('sni') || '',
      utls: { enabled: true, fingerprint: params.get('fp') || 'firefox' },
      reality: {
        enabled: true,
        public_key: params.get('pbk') || '',
        short_id: params.get('sid') || '',
      },
    },
  };
}

// Скачивание подписки: base64-список vless://-ссылок (формат v2rayN)
async function fetchSubscriptionServers(subscriptionUrl: string): Promise<string[]> {
  const res = await fetch(subscriptionUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Подписка недоступна: HTTP ${res.status}`);
  const text = (await res.text()).trim();
  let decoded = text;
  try {
    const candidate = Buffer.from(text, 'base64').toString('utf-8');
    if (candidate.includes('://')) decoded = candidate;
  } catch {
    // подписка отдана в открытом виде — используем как есть
  }
  return decoded.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('vless://'));
}

// Быстрая TCP-проверка доступности сервера подписки
function probeTcp(host: string, port: number, timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.once('error', () => { sock.destroy(); resolve(false); });
    sock.connect(port, host);
  });
}

// Генерация config.json для sing-box и запись в общий том.
// Перебирает серверы подписки, пока не найдёт доступный по TCP.
async function writeSingBoxConfig(subscriptionUrl: string): Promise<string> {
  const servers = await fetchSubscriptionServers(subscriptionUrl);
  if (servers.length === 0) throw new Error('В подписке нет vless-серверов');
  let parsed = 0;
  for (const link of servers) {
    const outbound = parseVless(link);
    if (!outbound) continue;
    parsed++;
    if (!(await probeTcp(outbound.server, outbound.server_port))) continue;
    const config = {
      log: { level: 'warn' },
      inbounds: [{ type: 'mixed', tag: 'in', listen: '::', listen_port: 2080 }],
      outbounds: [outbound],
    };
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return `${outbound.server}:${outbound.server_port}`;
  }
  if (parsed === 0) throw new Error('Ни один сервер подписки не распознан (ожидается vless + reality)');
  throw new Error('Все серверы подписки недоступны по TCP — проверьте подписку или сеть');
}

router.get('/settings', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const settings = await prisma.vpnSettings.findFirst();
    if (!settings) return res.json(null);
    const { subscriptionUrl, ...safe } = settings;
    res.json({ ...safe, hasSubscriptionUrl: !!subscriptionUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.vpnSettings.findFirst();
    const payload: any = { ...data, updatedAt: new Date() };
    let settings;
    if (existing) {
      settings = await prisma.vpnSettings.update({ where: { id: existing.id }, data: payload });
    } else {
      settings = await prisma.vpnSettings.create({ data: payload });
    }
    let server: string | null = null;
    let configError: string | null = null;
    if (settings.isActive && settings.subscriptionUrl) {
      try {
        server = await writeSingBoxConfig(settings.subscriptionUrl);
        settings = await prisma.vpnSettings.update({ where: { id: settings.id }, data: { lastConfigAt: new Date() } });
      } catch (err: any) {
        configError = err.message;
      }
    }
    const { subscriptionUrl, ...safe } = settings;
    res.json({ ...safe, hasSubscriptionUrl: !!subscriptionUrl, server, configError });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/settings', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    await prisma.vpnSettings.deleteMany();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Проверка: подписка скачивается, а Telegram API достижим через прокси vpn:2080
router.post('/test', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const settings = await prisma.vpnSettings.findFirst();
    if (!settings?.subscriptionUrl) {
      return res.status(400).json({ error: 'Подписка VPN не настроена' });
    }
    const servers = await fetchSubscriptionServers(settings.subscriptionUrl);
    let telegramReachable = false;
    try {
      const proxy = new ProxyAgent(process.env.TELEGRAM_PROXY_URL || 'http://vpn:2080');
      const check = await fetch('https://api.telegram.org', { dispatcher: proxy, signal: AbortSignal.timeout(15000) } as any);
      telegramReachable = check.status > 0;
    } catch {
      telegramReachable = false;
    }
    res.json({ ok: telegramReachable, servers: servers.length, telegramReachable });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// При старте бэкенда: если плагин активен — синхронизируем config.json sing-box
export async function syncVpnConfigOnStartup() {
  try {
    const settings = await prisma.vpnSettings.findFirst();
    if (!settings?.isActive || !settings.subscriptionUrl) return;
    const server = await writeSingBoxConfig(settings.subscriptionUrl);
    await prisma.vpnSettings.update({ where: { id: settings.id }, data: { lastConfigAt: new Date() } });
    console.log('[VPN] Конфиг sing-box обновлён, сервер:', server);
  } catch (err: any) {
    console.error('[VPN] Не удалось синхронизировать конфиг:', err.message);
  }
}

export default router;
