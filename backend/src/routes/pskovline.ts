import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();
const DATA_FILE = '/app/data/pskovline.json';

// Получить данные всех аккаунтов
router.get('/', async (_req, res) => {
  try {
    let data: any = { accounts: [], status: 'error', error: 'Данные не найдены' };
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// Получить настройки (без auth — нужно для публичного виджета dashboard)
router.get('/settings', async (_req, res) => {
  try {
    let settings = await prisma.pskovlineSettings.findFirst();
    if (!settings) {
      settings = await prisma.pskovlineSettings.create({
        data: {
          label: 'Псковлайн', login: '91868', password: 'e5yvku2a',
          label2: 'Псковлайн телефон', login2: 'upl69777', password2: 'i9rmh2s9'
        }
      });
    }
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Обновить настройки
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { label, login, password, label2, login2, password2 } = req.body;
    let settings = await prisma.pskovlineSettings.findFirst();
    if (settings) {
      settings = await prisma.pskovlineSettings.update({
        where: { id: settings.id },
        data: { label, login, password, label2, login2, password2 }
      });
    } else {
      settings = await prisma.pskovlineSettings.create({
        data: {
          label: label || 'Псковлайн', login: login || '91868', password: password || 'e5yvku2a',
          label2: label2 || 'Псковлайн телефон', login2: login2 || 'upl69777', password2: password2 || 'i9rmh2s9'
        }
      });
    }
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
