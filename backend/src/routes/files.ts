import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Получить все настройки вкладок
router.get('/tabs', authMiddleware, async (_req, res) => {
  try {
    const tabs = await prisma.fileTabSetting.findMany();
    const defaults = [
      { tabKey: 'programs', label: 'Программы', url: '' },
      { tabKey: 'drivers', label: 'Драйвера', url: '' },
      { tabKey: 'documents', label: 'Документы', url: '' },
      { tabKey: 'games', label: 'Игры', url: '' },
    ];
    const merged = defaults.map(d => {
      const found = tabs.find(t => t.tabKey === d.tabKey);
      return { ...d, url: found?.url || '', id: found?.id || null };
    });
    res.json(merged);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка загрузки настроек' });
  }
});

// Обновить URL вкладки
router.post('/tabs/:tabKey', authMiddleware, async (req, res) => {
  const { tabKey } = req.params;
  const { url } = req.body;
  const allowed = ['programs', 'drivers', 'documents', 'games'];
  if (!allowed.includes(tabKey)) {
    return res.status(400).json({ error: 'Неверная вкладка' });
  }
  try {
    const setting = await prisma.fileTabSetting.upsert({
      where: { tabKey },
      update: { url: url || '' },
      create: { tabKey, url: url || '' },
    });
    res.json(setting);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// Получить список файлов из папки игр (NFS)
router.get('/games', authMiddleware, (_req, res) => {
  const gameDir = '/app/games';
  try {
    if (!fs.existsSync(gameDir)) {
      return res.status(404).json({ error: 'Папка не найдена' });
    }
    const items = fs.readdirSync(gameDir, { withFileTypes: true }).map(dirent => {
      const stat = fs.statSync(path.join(gameDir, dirent.name));
      return {
        name: dirent.name,
        isDirectory: dirent.isDirectory(),
        size: stat.size,
        updatedAt: stat.mtime,
      };
    }).sort((a, b) => {
      // Папки первыми, затем по имени
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, 'ru');
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка чтения папки' });
  }
});

export default router;
