import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

/**
 * API Windows-агента «Устройства клиентов».
 * Без user-auth: агент идентифицируется связкой (contactKey + deviceKey + token).
 *  - POST /report    — полный отчёт: регистрация нового устройства или
 *                      обновление существующего + онлайн-статус;
 *  - POST /heartbeat — лёгкий пинг, поддерживающий статус «включено».
 * Маршрут висит под /api, tenantMiddleware уже определил организацию по Host.
 */
const router = Router();

// Агент онлайн, если отчёт/пинг был не старше этого порога
export const AGENT_ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

const diskSchema = z.object({
  model: z.string().default(''),
  sizeGb: z.number().int().min(0).default(0),
  freeGb: z.number().int().min(0).default(0),
  serial: z.string().default(''),
}).passthrough();

const pnpSchema = z.object({
  class: z.string().default(''),
  name: z.string().default(''),
  manufacturer: z.string().default(''),
  status: z.string().default(''),
  deviceId: z.string().default(''),
}).passthrough();

const infoSchema = z.object({
  hostname: z.string().min(1),
  username: z.string().default(''),
  workgroup: z.string().default(''),
  osCaption: z.string().default(''),
  osVersion: z.string().default(''),
  osBuild: z.string().default(''),
  osArch: z.string().default(''),
  osInstallDate: z.string().optional().nullable(),
  manufacturer: z.string().default(''),
  model: z.string().default(''),
  serialNumber: z.string().default(''),
  cpu: z.string().default(''),
  cpuCores: z.number().int().min(0).default(0),
  cpuThreads: z.number().int().min(0).default(0),
  ramTotalMb: z.number().int().min(0).default(0),
  disks: z.array(diskSchema).default([]),
  pnpDevices: z.array(pnpSchema).default([]),
  ipAddress: z.string().default(''),
  macAddress: z.string().default(''),
  gpu: z.string().default(''),
  lastBootAt: z.string().optional().nullable(),
  agentVersion: z.string().default(''),
}).passthrough();

const reportSchema = z.object({
  contactKey: z.string().regex(/^\d{3}-\d{3}-\d{3}$/),
  deviceKey: z.string().min(8).max(128),
  token: z.string().max(128).optional().nullable(),
  info: infoSchema,
});

function toDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Обрезаем список PnP-устройств, чтобы отчёт не раздувал БД без меры */
function sanitizePnp(list: any[]): any[] {
  return list.slice(0, 500).map((d) => ({
    class: String(d.class || '').slice(0, 100),
    name: String(d.name || '').slice(0, 300),
    manufacturer: String(d.manufacturer || '').slice(0, 200),
    status: String(d.status || '').slice(0, 50),
    deviceId: String(d.deviceId || '').slice(0, 300),
  }));
}

router.post('/report', async (req, res) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Некорректный отчёт агента', details: parsed.error.issues });
    }
    const { contactKey, deviceKey, token, info } = parsed.data;

    const contact = await (prisma as any).contact.findUnique({ where: { clientKey: contactKey } });
    if (!contact) {
      return res.status(404).json({ error: 'Контакт с таким ID не найден' });
    }

    const existing = await (prisma as any).clientDevice.findUnique({ where: { deviceKey } });

    // Повторная регистрация/обновление — обязуемся знать токен устройства,
    // чтобы посторонний не мог перезаписать чужую запись, зная deviceKey
    if (existing && (!token || token !== existing.token)) {
      return res.status(403).json({ error: 'Неверный токен устройства' });
    }

    const data = {
      contactId: contact.id,
      hostname: info.hostname.slice(0, 120),
      username: info.username.slice(0, 120),
      workgroup: info.workgroup.slice(0, 120),
      osCaption: info.osCaption.slice(0, 200),
      osVersion: info.osVersion.slice(0, 100),
      osBuild: info.osBuild.slice(0, 100),
      osArch: info.osArch.slice(0, 50),
      osInstallDate: toDate(info.osInstallDate),
      manufacturer: info.manufacturer.slice(0, 200),
      model: info.model.slice(0, 200),
      serialNumber: info.serialNumber.slice(0, 120),
      cpu: info.cpu.slice(0, 200),
      cpuCores: info.cpuCores,
      cpuThreads: info.cpuThreads,
      ramTotalMb: info.ramTotalMb,
      disks: (info.disks || []).slice(0, 32),
      pnpDevices: sanitizePnp(info.pnpDevices || []),
      ipAddress: info.ipAddress.slice(0, 60),
      macAddress: info.macAddress.slice(0, 60),
      gpu: info.gpu.slice(0, 300),
      lastBootAt: toDate(info.lastBootAt),
      agentVersion: info.agentVersion.slice(0, 50),
      lastSeenAt: new Date(),
    };

    let device;
    if (existing) {
      device = await (prisma as any).clientDevice.update({ where: { id: existing.id }, data });
    } else {
      const newToken = crypto.randomBytes(24).toString('hex');
      device = await (prisma as any).clientDevice.create({ data: { ...data, deviceKey, token: newToken } });
    }

    return res.json({ ok: true, deviceId: device.id, token: device.token });
  } catch (e: any) {
    console.error('[agent] report error:', e.message);
    res.status(500).json({ error: 'Ошибка обработки отчёта агента' });
  }
});

const heartbeatSchema = z.object({
  deviceKey: z.string().min(8).max(128),
  token: z.string().min(8).max(128),
});

router.post('/heartbeat', async (req, res) => {
  try {
    const parsed = heartbeatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Некорректный heartbeat' });
    const { deviceKey, token } = parsed.data;
    const device = await (prisma as any).clientDevice.findUnique({ where: { deviceKey } });
    if (!device || device.token !== token) {
      return res.status(403).json({ error: 'Неверный токен устройства' });
    }
    await (prisma as any).clientDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[agent] heartbeat error:', e.message);
    res.status(500).json({ error: 'Ошибка heartbeat' });
  }
});

export default router;
