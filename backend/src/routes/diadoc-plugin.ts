import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { DiadocClient, DiadocError, invalidateDiadocTokenCache } from '../lib/diadoc.js';

const router = Router();

// Загрузка настроек и готового клиента (бросает понятную ошибку, если не настроено)
async function loadClient() {
  const s = await prisma.diadocPluginSettings.findUnique({ where: { id: 1 } });
  if (!s || !s.apiKey || !s.login || !s.password) {
    throw new DiadocError('Плагин не настроен: укажите API-ключ разработчика, логин и пароль Диадока');
  }
  return { settings: s, client: new DiadocClient(s.login, s.password, s.apiKey) };
}

async function requireBox(settings: { boxId: string | null }) {
  if (!settings.boxId) throw new DiadocError('Не выбран ящик Диадока (организация)');
  return settings.boxId;
}

// GET /api/diadoc-plugin — состояние: настройки (без пароля), ящики, счётчики документов
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const s = await prisma.diadocPluginSettings.findUnique({ where: { id: 1 } });
    const base = {
      isActive: s?.isActive ?? false,
      login: s?.login ?? '',
      passwordSet: !!s?.password,
      apiKey: s?.apiKey ?? '',
      boxId: s?.boxId ?? '',
      boxName: s?.boxName ?? '',
      updateIntervalMinutes: s?.updateIntervalMinutes ?? 15,
      boxes: [] as any[],
      counts: null as any,
      error: null as string | null,
    };
    if (!s?.apiKey || !s.login || !s.password) return res.json(base);
    try {
      const client = new DiadocClient(s.login, s.password, s.apiKey);
      base.boxes = await client.getBoxes();
      if (s.boxId) base.counts = await client.getDocumentCounts(s.boxId);
    } catch (e: any) {
      base.error = e.message;
    }
    res.json(base);
  } catch (err: any) {
    console.error('[diadoc-plugin] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diadoc-plugin — сохранить подключение (admin; пустой пароль = не менять).
// После сохранения выполняется проверка подключения: authenticate → isActive true/false.
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { login, password, apiKey, updateIntervalMinutes } = req.body || {};
    if (login !== undefined && typeof login !== 'string') return res.status(400).json({ error: 'Некорректный логин' });
    if (apiKey !== undefined && typeof apiKey !== 'string') return res.status(400).json({ error: 'Некорректный API-ключ' });

    const existing = await prisma.diadocPluginSettings.findUnique({ where: { id: 1 } });
    const data = {
      login: login !== undefined ? login.trim() : (existing?.login ?? ''),
      password: password ? String(password) : (existing?.password ?? ''),
      apiKey: apiKey !== undefined ? apiKey.trim() : (existing?.apiKey ?? ''),
      updateIntervalMinutes:
        updateIntervalMinutes !== undefined
          ? Math.max(1, Math.min(1440, Number(updateIntervalMinutes) || 15))
          : (existing?.updateIntervalMinutes ?? 15),
    };
    invalidateDiadocTokenCache(); // настройки поменялись — кэш токенов сбрасываем

    // Проверка подключения при сохранении
    let isActive = false;
    let error: string | null = null;
    let boxes: any[] = [];
    if (data.login && data.password && data.apiKey) {
      try {
        const client = new DiadocClient(data.login, data.password, data.apiKey);
        boxes = await client.getBoxes();
        isActive = true;
        // если ящик ещё не выбран и ящик ровно один — выбираем автоматически
        if (!existing?.boxId && boxes.length === 1) {
          (data as any).boxId = boxes[0].boxId;
          (data as any).boxName = boxes[0].title;
        } else if (existing?.boxId) {
          const still = boxes.find((b) => b.boxId === existing.boxId);
          (data as any).boxId = existing.boxId;
          (data as any).boxName = still?.title ?? existing.boxName;
        }
      } catch (e: any) {
        error = e.message;
      }
    }

    const saved = await prisma.diadocPluginSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data, isActive } as any,
      update: { ...data, isActive } as any,
    });
    res.json({
      isActive: saved.isActive,
      login: saved.login,
      passwordSet: !!saved.password,
      apiKey: saved.apiKey,
      boxId: saved.boxId,
      boxName: saved.boxName,
      updateIntervalMinutes: saved.updateIntervalMinutes,
      boxes,
      error,
    });
  } catch (err: any) {
    console.error('[diadoc-plugin] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diadoc-plugin/box — выбрать ящик (admin)
router.post('/box', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { boxId } = req.body || {};
    if (typeof boxId !== 'string' || !boxId.trim()) return res.status(400).json({ error: 'Не указан boxId' });
    const { client } = await loadClient();
    const boxes = await client.getBoxes();
    const box = boxes.find((b) => b.boxId === boxId.trim());
    const saved = await prisma.diadocPluginSettings.upsert({
      where: { id: 1 },
      create: { id: 1, boxId: boxId.trim(), boxName: box?.title ?? '' },
      update: { boxId: boxId.trim(), boxName: box?.title ?? '', updatedAt: new Date() },
    });
    res.json({ boxId: saved.boxId, boxName: saved.boxName });
  } catch (err: any) {
    console.error('[diadoc-plugin] POST /box error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diadoc-plugin/test — проверить подключение (можно с несохранёнными значениями из формы)
router.post('/test', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const s = await prisma.diadocPluginSettings.findUnique({ where: { id: 1 } });
    const login = (req.body?.login ?? s?.login ?? '').trim();
    const password = req.body?.password || s?.password || '';
    const apiKey = (req.body?.apiKey ?? s?.apiKey ?? '').trim();
    const client = new DiadocClient(login, password, apiKey);
    const boxes = await client.getBoxes();
    res.json({ ok: true, message: `Подключение успешно, ящиков: ${boxes.length}`, boxes });
  } catch (err: any) {
    res.json({ ok: false, message: err.message });
  }
});

// GET /api/diadoc-plugin/counteragents — контрагенты выбранного ящика (для формы отправки)
router.get('/counteragents', authMiddleware, async (_req, res) => {
  try {
    const { settings, client } = await loadClient();
    const boxId = await requireBox(settings);
    res.json({ items: await client.getCounteragents(boxId) });
  } catch (err: any) {
    console.error('[diadoc-plugin] counteragents error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/diadoc-plugin/documents?type=inbound|outbound|requireSignature
router.get('/documents', authMiddleware, async (req, res) => {
  try {
    const { settings, client } = await loadClient();
    const boxId = await requireBox(settings);
    const type = String(req.query.type || 'inbound');
    if (!['inbound', 'outbound', 'requireSignature'].includes(type)) {
      return res.status(400).json({ error: 'type должен быть inbound, outbound или requireSignature' });
    }
    const items = await client.getDocuments(boxId, type as any);
    res.json({ items });
  } catch (err: any) {
    console.error('[diadoc-plugin] documents error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/diadoc-plugin/documents/:messageId/:entityId/content — скачать файл документа
router.get('/documents/:messageId/:entityId/content', authMiddleware, async (req, res) => {
  try {
    const { settings, client } = await loadClient();
    const boxId = await requireBox(settings);
    const { content, fileName } = await client.getDocumentContent(boxId, req.params.messageId, req.params.entityId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', String(content.length));
    res.send(content);
  } catch (err: any) {
    console.error('[diadoc-plugin] content error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diadoc-plugin/send — отправить неформализованный файл контрагенту
// body: { toBoxId? | inn?, kpp?, fileName, contentBase64 }
router.post('/send', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { toBoxId, inn, kpp, fileName, contentBase64 } = req.body || {};
    if (!fileName || typeof fileName !== 'string') return res.status(400).json({ error: 'Не указано имя файла' });
    if (!contentBase64 || typeof contentBase64 !== 'string') return res.status(400).json({ error: 'Нет содержимого файла (contentBase64)' });
    if (Buffer.from(contentBase64, 'base64').length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Файл слишком большой (максимум 10 МБ)' });
    }
    const { settings, client } = await loadClient();
    const boxId = await requireBox(settings);
    const result = await client.sendDocument({ boxId, toBoxId, inn, kpp, fileName, contentBase64 });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[diadoc-plugin] send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diadoc-plugin/sign — подписать входящий документ облачной подписью
// body: { messageId, entityId, confirmCode? }
router.post('/sign', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Только администратор' });
    const { messageId, entityId, confirmCode } = req.body || {};
    if (!messageId || !entityId) return res.status(400).json({ error: 'Укажите messageId и entityId документа' });
    const { settings, client } = await loadClient();
    const boxId = await requireBox(settings);
    const result = await client.signDocument(boxId, String(messageId), String(entityId), confirmCode ? String(confirmCode) : undefined);
    res.json(result);
  } catch (err: any) {
    console.error('[diadoc-plugin] sign error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
