import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const DATA_DIR = '/app/data';
const PARSER_SETTINGS_FILE = path.join(DATA_DIR, 'pskovline_settings.json');

// Синхронизация с парсером: cron на хосте читает этот файл (scripts/pskovline-parser.py)
function syncParserFile(
  isActive: boolean,
  updateTime: string,
  accounts: { label: string; login: string; password: string }[]
) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      PARSER_SETTINGS_FILE,
      JSON.stringify({ is_active: isActive, update_time: updateTime, accounts })
    );
  } catch (e: any) {
    console.error('[pskovline-plugin] parser sync error:', e.message);
  }
}

// Миграция legacy-настроек (одна строка pskovline_settings) в аккаунты плагина
async function migrateLegacy(): Promise<void> {
  const plugin = await prisma.pskovlinePluginSettings.findUnique({ where: { id: 1 } });
  if (plugin) return;
  if (await prisma.pskovlinePluginAccount.count() > 0) return;
  const legacy = await prisma.pskovlineSettings.findFirst();
  const accounts: { label: string; login: string; password: string; sortOrder: number }[] = [];
  if (legacy?.login && legacy?.password) {
    accounts.push({ label: legacy.label || 'Псковлайн', login: legacy.login, password: legacy.password, sortOrder: 0 });
  }
  if (legacy?.login2 && legacy?.password2) {
    accounts.push({ label: legacy.label2 || 'Псковлайн 2', login: legacy.login2, password: legacy.password2, sortOrder: 1 });
  }
  // Активируем плагин автоматически, если были настроенные аккаунты
  await prisma.pskovlinePluginSettings.create({
    data: { id: 1, isActive: accounts.length > 0, updateTime: '08:00' },
  });
  if (accounts.length) {
    await prisma.pskovlinePluginAccount.createMany({ data: accounts });
    syncParserFile(true, '08:00', accounts.map((a) => ({ label: a.label, login: a.login, password: a.password })));
  }
}

// GET /api/pskovline-plugin — настройки плагина (пароли не возвращаются)
router.get('/', authMiddleware, async (_req, res) => {
  try {
    await migrateLegacy();
    const s = await prisma.pskovlinePluginSettings.findUnique({ where: { id: 1 } });
    const accounts = await prisma.pskovlinePluginAccount.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({
      isActive: s?.isActive ?? false,
      updateTime: s?.updateTime ?? '08:00',
      accounts: accounts.map((a) => ({ id: a.id, label: a.label, login: a.login, hasPassword: !!a.password })),
    });
  } catch (err: any) {
    console.error('[pskovline-plugin] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pskovline-plugin — сохранение настроек (только админ)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Только администратор' });
    }
    const { isActive, updateTime, accounts } = req.body || {};
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Некорректный флаг активности' });
    }
    if (updateTime !== undefined && !/^\d{2}:\d{2}$/.test(updateTime)) {
      return res.status(400).json({ error: 'Время обновления должно быть в формате ЧЧ:ММ' });
    }
    if (accounts !== undefined && !Array.isArray(accounts)) {
      return res.status(400).json({ error: 'Некорректный список аккаунтов' });
    }

    const existing = await prisma.pskovlinePluginSettings.findUnique({ where: { id: 1 } });
    const data = {
      isActive: isActive !== undefined ? isActive : (existing?.isActive ?? false),
      updateTime: updateTime !== undefined ? updateTime : (existing?.updateTime ?? '08:00'),
      updatedAt: new Date(),
    };
    await prisma.pskovlinePluginSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });

    let savedAccounts: { id: number; label: string; login: string; password: string }[] = [];
    if (accounts !== undefined) {
      const old = await prisma.pskovlinePluginAccount.findMany();
      await prisma.pskovlinePluginAccount.deleteMany();
      const rows: { label: string; login: string; password: string; sortOrder: number }[] = [];
      for (let i = 0; i < accounts.length; i++) {
        const a = accounts[i];
        if (typeof a?.label !== 'string' || typeof a?.login !== 'string' || typeof a?.password !== 'string') continue;
        if (!a.login) continue; // без логина аккаунт не валиден
        const prev = a.id ? old.find((o) => o.id === a.id) : undefined;
        rows.push({
          label: a.label,
          login: a.login,
          password: a.password || prev?.password || '', // пустой пароль = не менять
          sortOrder: i,
        });
      }
      if (rows.length) await prisma.pskovlinePluginAccount.createMany({ data: rows });
      savedAccounts = await prisma.pskovlinePluginAccount.findMany({ orderBy: { sortOrder: 'asc' } });
    } else {
      savedAccounts = await prisma.pskovlinePluginAccount.findMany({ orderBy: { sortOrder: 'asc' } });
    }
    syncParserFile(
      data.isActive,
      data.updateTime,
      savedAccounts.map((a) => ({ label: a.label, login: a.login, password: a.password }))
    );
    res.json({
      isActive: data.isActive,
      updateTime: data.updateTime,
      accounts: savedAccounts.map((a) => ({ id: a.id, label: a.label, login: a.login, hasPassword: !!a.password })),
    });
  } catch (err: any) {
    console.error('[pskovline-plugin] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
