import { Router } from 'express';
import { z } from 'zod';
import path from 'path';
import { createRequire } from 'module';
// CJS-модуль: в ESM-сборке подключаем через createRequire.
// archiver v8 — классовый API: new ZipArchive(...) вместо archiver('zip', ...)
const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

/**
 * Устройства клиентов (Windows-агент) — чтение/редактирование/удаление
 * из интерфейса CRM. Создание записей — только через /api/agent/*.
 */
const router = Router();
router.use(authMiddleware);

const isAdmin = (req: AuthRequest) => req.user?.role === 'admin';
const isManagerOrAdmin = (req: AuthRequest) => req.user?.role === 'admin' || req.user?.role === 'manager';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function withOnline(d: any) {
  return { ...d, isOnline: d.lastSeenAt && (Date.now() - new Date(d.lastSeenAt).getTime()) < ONLINE_THRESHOLD_MS };
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const contactId = req.query.contactId as string | undefined;
    if (!contactId) return res.status(400).json({ error: 'Необходим contactId' });

    // Для организации показываем устройства всех её сотрудников
    const contact = await (prisma as any).contact.findUnique({
      where: { id: contactId },
      select: { id: true, kind: true },
    });
    let contactIds = [contactId];
    if (contact?.kind === 'organization') {
      const employees = await (prisma as any).contact.findMany({
        where: { organizationId: contactId },
        select: { id: true },
      });
      contactIds = contactIds.concat(employees.map((e: any) => e.id));
    }

    const devices = await (prisma as any).clientDevice.findMany({
      where: { contactId: { in: contactIds } },
      orderBy: { hostname: 'asc' },
      include: { contact: { select: { id: true, name: true } } },
    });
    res.json(devices.map(withOnline));
  } catch (e: any) {
    console.error('[client-devices] list error:', e.message);
    res.status(500).json({ error: 'Ошибка загрузки устройств' });
  }
});

const updateSchema = z.object({
  comment: z.string().max(20000).optional(),
});


// Скачивание агента Windows с предзаполненными параметрами текущего
// тенанта (Host запроса) и контакта (clientKey). Менеджер передаёт архив
// клиенту — установщик спросит только права администратора.
router.get('/installer', async (req: AuthRequest, res) => {
  try {
    // Разрешено всем авторизованным пользователям CRM
    const contactId = req.query.contactId as string | undefined;
    if (!contactId) return res.status(400).json({ error: 'Необходим contactId' });
    const contact = await (prisma as any).contact.findUnique({
      where: { id: contactId },
      select: { id: true, clientKey: true },
    });
    if (!contact || !contact.clientKey) {
      return res.status(404).json({ error: 'У контакта нет ID для агента' });
    }

    const proto = String(req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
    const serverUrl = `${proto}://${req.get('host')}`;
    const key: string = contact.clientKey;

    const archive: any = new ZipArchive({ zlib: { level: 9 } });
    archive.on('warning', (e: any) => console.warn('[client-devices] installer zip warning:', e.message));
    archive.on('error', (e: any) => {
      console.error('[client-devices] installer zip error:', e.message);
      if (!res.headersSent) res.status(500).json({ error: 'Ошибка формирования установщика' });
      else res.end();
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="WeAGENT.zip"`);
    archive.pipe(res);

    // Файлы агента (копия agent/windows, зашитая в образ backend)
    const agentDir = path.join(process.cwd(), 'agent-windows');
    archive.directory(agentDir, false);

    // Персонализированный установщик: подставляет URL тенанта и ID контакта
    const runner = [
      '@echo off',
      'REM ==========================================================',
      `REM  WeCRM Agent - personalized installer for contact ${key}`,
      `REM  Server: ${serverUrl}`,
      'REM  Run as Administrator!',
      'REM ==========================================================',
      'call "%~dp0install.bat" "' + serverUrl + '" "' + key + '"',
      '',
    ].join('\r\n');
    // Тот же запуск, но через единый exe-установщик (если есть в архиве)
    const exeRunner = [
      '@echo off',
      'if exist "%~dp0WeAGENT.exe" (',
      '  "%~dp0WeAGENT.exe" "' + serverUrl + '" "' + key + '"',
      ') else (',
      '  call "%~dp0install.bat" "' + serverUrl + '" "' + key + '"',
      ')',
      '',
    ].join('\r\n');
    archive.append(runner, { name: `INSTALL-${key}.bat` });
    archive.append(exeRunner, { name: `WeAGENT-${key}.bat` });
    archive.append(exeRunner, { name: `WeAGENT-${key}.bat` });

    await archive.finalize();
  } catch (e: any) {
    console.error('[client-devices] installer error:', e.message);
    if (!res.headersSent) res.status(500).json({ error: 'Ошибка формирования установщика' });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!isManagerOrAdmin(req)) return res.status(403).json({ error: 'Недостаточно прав' });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные' });
    const device = await (prisma as any).clientDevice.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(withOnline(device));
  } catch (e: any) {
    console.error('[client-devices] update error:', e.message);
    res.status(500).json({ error: 'Ошибка обновления устройства' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Недостаточно прав' });
    await (prisma as any).clientDevice.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[client-devices] delete error:', e.message);
    res.status(500).json({ error: 'Ошибка удаления устройства' });
  }
});

export default router;
