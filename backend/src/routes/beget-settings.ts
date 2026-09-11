import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const DATA_DIR = '/app/data';
const PARSER_SETTINGS_FILE = path.join(DATA_DIR, 'beget_settings.json');

// Синхронизация с парсером: cron на хосте читает этот файл (scripts/beget-parser.py)
function syncParserFile(login: string, password: string, isActive: boolean, isPartner: boolean, updateTime: string) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      PARSER_SETTINGS_FILE,
      JSON.stringify({ login, password, is_active: isActive, is_partner: isPartner, update_time: updateTime })
    );
  } catch (e: any) {
    console.error('[beget-settings] parser sync error:', e.message);
  }
}

// GET /api/beget-settings — настройки плагина Beget (пароль не возвращается)
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await prisma.begetSettings.findUnique({ where: { id: 1 } });
    res.json({
      login: s?.login ?? '',
      hasPassword: !!s?.password,
      isActive: s?.isActive ?? false,
      isPartner: s?.isPartner ?? false,
      updateTime: s?.updateTime ?? '10:00',
    });
  } catch (err: any) {
    console.error('[beget-settings] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/beget-settings — сохранение настроек (только админ)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Только администратор' });
    }
    const { login, password, isActive, isPartner, updateTime } = req.body || {};
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive обязателен' });
    }
    if (isPartner !== undefined && typeof isPartner !== 'boolean') {
      return res.status(400).json({ error: 'Некорректный флаг партнёрки' });
    }
    if (updateTime !== undefined && !/^\d{2}:\d{2}$/.test(updateTime)) {
      return res.status(400).json({ error: 'Время обновления должно быть в формате ЧЧ:ММ' });
    }
    if (login !== undefined && typeof login !== 'string') {
      return res.status(400).json({ error: 'Некорректный логин' });
    }
    if (password !== undefined && typeof password !== 'string') {
      return res.status(400).json({ error: 'Некорректный пароль' });
    }

    const existing = await prisma.begetSettings.findUnique({ where: { id: 1 } });
    const data = {
      login: login !== undefined ? login : (existing?.login ?? ''),
      password: password !== undefined && password !== '' ? password : (existing?.password ?? ''),
      isActive,
      isPartner: isPartner !== undefined ? isPartner : (existing?.isPartner ?? false),
      updateTime: updateTime !== undefined ? updateTime : (existing?.updateTime ?? '10:00'),
      updatedAt: new Date(),
    };
    await prisma.begetSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    syncParserFile(data.login, data.password, data.isActive, data.isPartner, data.updateTime);
    console.log(`[beget-settings] saved: login=${data.login}, isActive=${isActive}`);
    res.json({ login: data.login, hasPassword: !!data.password, isActive: data.isActive, isPartner: data.isPartner, updateTime: data.updateTime });
  } catch (err: any) {
    console.error('[beget-settings] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
