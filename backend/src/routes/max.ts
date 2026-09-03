import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { processMaxMessage } from '../max-worker/processor.js';

const router = Router();
const MAX_API_BASE = 'https://platform-api2.max.ru';

const settingsSchema = z.object({
  isActive: z.boolean().default(false),
  apiToken: z.string().min(1),
  chatId: z.string().optional(),
  botUsername: z.string().optional(),
  webhookUrl: z.string().optional(),
  autoNotify: z.boolean().default(true),
  notifyOn: z.array(z.string()).default(['task', 'comment']),
  defaultCreatorId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).default([]),
  autoCreateContact: z.boolean().default(true),
});

// GET /api/max/settings — получить настройки (требует авторизации)
router.get('/settings', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const settings = await prisma.maxSettings.findFirst({
      include: { defaultCreator: { select: { id: true, name: true } } }
    });
    if (!settings) {
      return res.json(null);
    }
    const { apiToken, ...safe } = settings;
    res.json({ ...safe, hasToken: !!apiToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/max/settings — сохранить настройки (требует авторизации)
router.post('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = settingsSchema.parse(req.body);
    const existing = await prisma.maxSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.maxSettings.update({
        where: { id: existing.id },
        data: { ...data, updatedAt: new Date() },
      });
    } else {
      settings = await prisma.maxSettings.create({ data });
    }

    const { apiToken, ...safe } = settings;
    res.json({ ...safe, hasToken: !!apiToken });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/max/settings — удалить настройки (требует авторизации)
router.delete('/settings', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    await prisma.maxSettings.deleteMany();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/max/send — отправить сообщение в MAX (требует авторизации)
router.post('/send', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { chatId, text } = z.object({
      chatId: z.string().min(1),
      text: z.string().min(1).max(4096),
    }).parse(req.body);

    const settings = await prisma.maxSettings.findFirst({
      include: { defaultCreator: { select: { id: true, name: true } } }
    });
    if (!settings || !settings.isActive || !settings.apiToken) {
      return res.status(400).json({ error: 'MAX интеграция не настроена или не активна' });
    }

    // Исправлен формат отправки: message: { text } вместо content: { text }
    // chat_id должен быть числом (int64) согласно документации MAX API
    const response = await fetch(`${MAX_API_BASE}/messages?chat_id=${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': settings.apiToken,
      },
      body: JSON.stringify({
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MAX API error: ${response.status} ${errorText}`);
    }

    const result = await response.json() as any;
    res.json({ success: true, messageId: result.message_id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/max/webhook — входящий webhook от MAX (без авторизации)
// Формат payload согласно документации MAX Bot API:
// {
//   update_type: 'message_created',
//   timestamp: 123,
//   message: {
//     sender: { ... },
//     recipient: { chat_id: 123 },
//     body: { text: '...', attachments: [...] }
//   }
// }
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Логируем raw payload для отладки
    console.log('[MAX Webhook] Raw payload:', JSON.stringify(body, null, 2));

    // Проверяем тип события — обрабатываем только новые сообщения
    const updateType = body?.update_type;
    if (updateType !== 'message_created') {
      console.log('[MAX Webhook] Ignoring update type:', updateType);
      return res.json({ ok: true });
    }

    const maxMessage = body?.message;
    if (!maxMessage) {
      console.log('[MAX Webhook] No message object in payload');
      return res.json({ ok: true });
    }

    // Извлекаем данные из корректных полей MAX API
    const chatId = String(maxMessage.recipient?.chat_id || '');
    const userId = String(maxMessage.sender?.user_id || '');
    const text = maxMessage.body?.text?.trim() || '';
    const sender = maxMessage.sender || {};
    const senderName = sender.name || 'MAX User';
    const senderUsername = sender.username || '';
    const messageId = String(maxMessage.body?.mid || maxMessage.timestamp || Date.now());
    const attachments = maxMessage.body?.attachments || [];

    if (!chatId || !userId) {
      console.log('[MAX Webhook] No chat_id or user_id found in message');
      return res.json({ ok: true });
    }

    console.log('[MAX Webhook] Incoming message from', senderName, '(' + chatId + '):', text, '| attachments:', attachments.length);

    const maxSettings = await prisma.maxSettings.findFirst();
    if (!maxSettings || !maxSettings.isActive) {
      console.log('[MAX Webhook] MAX integration is disabled');
      return res.json({ ok: true });
    }

    // Check if this is a command
    const lowerText = text.toLowerCase();

    // /start command — show help
    if (lowerText === '/start') {
      await sendMaxMessage(chatId, 'Добро пожаловать в WeCRM бот!\n\nОтправьте текст сообщения, и я создам задачу.\n\nКоманды:\n/help — справка\n/tasks — мои задачи', maxSettings.apiToken);
      return res.json({ ok: true });
    }

    // /help command
    if (lowerText === '/help') {
      await sendMaxMessage(chatId, 'Команды бота WeCRM:\n\n• Отправьте любой текст — создаст задачу\n• /tasks — список ваших задач\n• /start — приветствие', maxSettings.apiToken);
      return res.json({ ok: true });
    }

    // /tasks command — list user's tasks
    if (lowerText === '/tasks') {
      const maxChat = await prisma.maxUserChat.findUnique({
        where: { chatId: String(chatId) },
        include: { user: { select: { id: true, name: true } } },
      });

      if (!maxChat?.userId) {
        await sendMaxMessage(chatId, 'Ваш чат не связан с пользователем CRM.\nПожалуйста, свяжите аккаунт в настройках CRM.', maxSettings.apiToken);
        return res.json({ ok: true });
      }

      const tasks = await prisma.task.findMany({
        where: {
          assignees: { some: { userId: maxChat.userId } },
          status: { notIn: ['cancelled', 'win'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
      });

      if (tasks.length === 0) {
        await sendMaxMessage(chatId, 'У вас нет активных задач.', maxSettings.apiToken);
      } else {
        const taskList = tasks.map((t, i) => `${i + 1}. ${t.title} (${t.status})`).join('\n');
        await sendMaxMessage(chatId, 'Ваши задачи:\n\n' + taskList, maxSettings.apiToken);
      }
      return res.json({ ok: true });
    }

    // Save or update chat info
    await prisma.maxUserChat.upsert({
      where: { chatId: String(chatId) },
      update: {
        username: senderUsername,
        firstName: senderName,
        updatedAt: new Date(),
      },
      create: {
        chatId: String(chatId),
        username: senderUsername,
        firstName: senderName,
      },
    });

    await processMaxMessage({
      id: messageId,
      chat_id: String(chatId),
      user_id: String(userId),
      text,
      sender_name: senderName,
      sender_username: senderUsername,
      sender_avatar: maxMessage.sender?.avatar_url,
      sender_description: maxMessage.sender?.description,
      attachments,
    }, maxSettings);

    console.log('[MAX Webhook] Message processed via processMaxMessage');

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[MAX Webhook] Error:', err.message, err.stack);
    res.status(200).json({ ok: true });
  }
});

// GET /api/max/webhook — верификация webhook
router.get('/webhook', async (_req, res) => {
  res.json({ ok: true, service: 'wecrm-max-integration' });
});

// POST /api/max/link-chat — связать чат MAX с пользователем CRM
router.post('/link-chat', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { chatId } = z.object({
      chatId: z.string().min(1),
    }).parse(req.body);

    const maxChat = await prisma.maxUserChat.upsert({
      where: { chatId },
      update: { userId: req.user!.id },
      create: { chatId, userId: req.user!.id },
    });

    res.json({ success: true, maxChat });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/max/my-chat — получить связанный чат текущего пользователя
router.get('/my-chat', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const maxChat = await prisma.maxUserChat.findFirst({
      where: { userId: req.user!.id },
    });
    res.json(maxChat);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to send message to MAX
async function sendMaxMessage(chatId: string, text: string, apiToken: string) {
  try {
    console.log('[MAX Send] Sending to chat_id:', chatId, 'text:', text.substring(0, 50));
    const response = await fetch(`${MAX_API_BASE}/messages?chat_id=${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiToken,
      },
      body: JSON.stringify({
        text,
      }),
    });

    if (!response.ok) {
      console.error('[MAX Send] Failed:', response.status, await response.text());
    } else {
      console.log('[MAX Send] OK, chat_id:', chatId);
    }
  } catch (err: any) {
    console.error('[MAX Send] Error:', err.message);
  }
}

export default router;
