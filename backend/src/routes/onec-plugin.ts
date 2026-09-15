import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { runOneCSync, getEntitySync } from '../lib/onec-sync.js';
import { OneCClient } from '../lib/onec.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/onec-plugin — настройки плагина (пароль не возвращается)
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
    res.json({
      isActive: s?.isActive ?? false,
      serviceUrl: s?.serviceUrl ?? '',
      login: s?.login ?? '',
      hasPassword: !!s?.password,
      syncIntervalMinutes: s?.syncIntervalMinutes ?? 15,
      kindFolder: s?.kindFolder ?? '',
      lastSyncAt: s?.lastSyncAt ?? null,
      lastSyncResult: s?.lastSyncResult ?? null,
      entitySync: getEntitySync(s?.entitySync),
    });
  } catch (err: any) {
    console.error('[onec-plugin] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onec-plugin — сохранение настроек (только админ; пустой пароль = не менять)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { isActive, serviceUrl, login, password, syncIntervalMinutes, entitySync, kindFolder } = req.body || {};
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Некорректный флаг активности' });
    }
    if (serviceUrl !== undefined && typeof serviceUrl !== 'string') {
      return res.status(400).json({ error: 'Некорректная ссылка веб-версии 1С' });
    }
    if (kindFolder !== undefined && typeof kindFolder !== 'string') {
      return res.status(400).json({ error: 'Некорректная папка видов номенклатуры' });
    }
    const existing = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
    const data = {
      isActive: isActive !== undefined ? isActive : (existing?.isActive ?? false),
      serviceUrl: serviceUrl !== undefined ? serviceUrl.trim() : (existing?.serviceUrl ?? ''),
      login: login !== undefined ? login.trim() : (existing?.login ?? ''),
      password: password ? String(password) : (existing?.password ?? ''),
      syncIntervalMinutes: syncIntervalMinutes !== undefined
        ? Math.max(5, Math.min(1440, Number(syncIntervalMinutes) || 15))
        : (existing?.syncIntervalMinutes ?? 15),
      entitySync: entitySync !== undefined ? (getEntitySync(entitySync) as any) : (existing?.entitySync ?? (getEntitySync(undefined) as any)),
      kindFolder: kindFolder !== undefined ? kindFolder.trim() : (existing?.kindFolder ?? ''),
      updatedAt: new Date(),
    };
    const saved = await prisma.oneCPluginSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    res.json({
      isActive: saved.isActive,
      serviceUrl: saved.serviceUrl,
      login: saved.login,
      hasPassword: !!saved.password,
      syncIntervalMinutes: saved.syncIntervalMinutes,
      kindFolder: saved.kindFolder,
      lastSyncAt: saved.lastSyncAt,
      lastSyncResult: saved.lastSyncResult,
      entitySync: getEntitySync(saved.entitySync),
    });
  } catch (err: any) {
    console.error('[onec-plugin] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onec-plugin/test — проверка соединения с 1С
router.post('/test', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const s = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
    const url = req.body?.serviceUrl ?? s?.serviceUrl ?? '';
    const login = req.body?.login ?? s?.login ?? '';
    const password = req.body?.password || s?.password || '';
    if (!url || !login || !password) {
      return res.status(400).json({ error: 'Заполните ссылку, логин и пароль' });
    }
    const ok = await new OneCClient(url, login, password).ping();
    res.json({ ok, message: ok ? 'Соединение с 1С установлено' : 'Не удалось подключиться к 1С' });
  } catch (err: any) {
    res.json({ ok: false, message: err.message });
  }
});

// Фоновый запуск синхронизации (полный цикл может занимать минуты — HTTP-запрос не ждёт)
let syncRunning = false;

function startBackgroundSync() {
  syncRunning = true;
  runOneCSync()
    .catch((e: any) => console.error('[onec-plugin] background sync error:', e.message))
    .finally(() => { syncRunning = false; });
}

// POST /api/onec-plugin/sync — ручной запуск синхронизации в фоне
router.post('/sync', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    if (syncRunning) return res.status(409).json({ error: 'Синхронизация уже выполняется, дождитесь завершения' });
    startBackgroundSync();
    res.json({ started: true, message: 'Синхронизация запущена в фоне' });
  } catch (err: any) {
    console.error('[onec-plugin] sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onec-plugin/prune-categories — удалить категории CRM, чьи виды 1С вне выбранной папки kindFolder
// (у товаров categoryId станет NULL по FK SetNull; сами товары не удаляются)
router.post('/prune-categories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const s = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
    const kindFolders = (s?.kindFolder || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (!kindFolders.length) return res.status(400).json({ error: 'Сначала укажите «Папку видов номенклатуры» в настройках' });
    if (!s?.serviceUrl || !s?.login || !s?.password) return res.status(400).json({ error: 'Заполните подключение к 1С (ссылка, логин, пароль)' });

    const client = new OneCClient(s.serviceUrl, s.login, s.password);
    const kindTree = await client.getKindTree();
    const lowers = kindFolders.map((x) => x.toLowerCase());
    const folderIds = new Set(kindTree.filter((n) => n.isGroup && lowers.includes(n.name.trim().toLowerCase())).map((n) => n.onecId));
    if (!folderIds.size) return res.status(404).json({ error: `Папки «${kindFolders.join('», «')}» не найдены в справочнике видов номенклатуры 1С` });

    // onecId узлов выбранной папки и всех её потомков
    const scope = new Set<string>();
    const walk = (id: string) => {
      if (scope.has(id)) return;
      scope.add(id);
      for (const n of kindTree) if (n.parentOnecId === id) walk(n.onecId);
    };
    for (const id of folderIds) walk(id);

    const result = await prisma.productCategory.deleteMany({ where: { onecId: { not: null, notIn: [...scope] } } });
    res.json({ success: true, deleted: result.count });
  } catch (err: any) {
    console.error('[onec-plugin] prune-categories error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/onec-plugin/sync-status — статус фоновой синхронизации
router.get('/sync-status', authMiddleware, async (_req, res) => {
  try {
    const s = await prisma.oneCPluginSettings.findUnique({ where: { id: 1 } });
    res.json({
      running: syncRunning,
      lastSyncAt: s?.lastSyncAt ?? null,
      lastSyncResult: s?.lastSyncResult ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
