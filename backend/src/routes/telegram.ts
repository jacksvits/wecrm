import { Router } from 'express' ; import { z } from 'zod' ; import { prisma } from '../lib/prisma.js' ; import { authMiddleware, AuthRequest } from '../middleware/auth.js' ; import fs from 'fs' ; import path from 'path' ; import { processTelegramMessage } from '../telegram-worker/processor.js' ; import { telegramFetch, TELEGRAM_API_BASE } from '../lib/telegram-api.js' ; const router = Router() ; const settingsSchema = z.object({ isActive: z.boolean().default(false), botToken: z.string().min(1), chatId: z.string().optional(), botUsername: z.string().optional(), webhookUrl: z.string().optional(), autoNotify: z.boolean().default(true), notifyOn: z.array(z.string()).default(['task', 'comment']), defaultCreatorId: z.string().optional().nullable(), assigneeIds: z.array(z.string()).default([]), autoCreateContact: z.boolean().default(true), autoReply: z.boolean().default(false), }) ; router.get('/settings', authMiddleware, async (_req: AuthRequest, res) => { try { const settings = await prisma.telegramSettings.findFirst({ include: { defaultCreator: { select: { id: true, name: true } } } }) ; if (!settings) { return res.json(null) ; } const { botToken, ...safe } = settings ; res.json({ ...safe, hasToken: !!botToken }) ; } catch (err: any) { res.status(500).json({ error: err.message }) ; } }) ; router.post('/settings', authMiddleware, async (req: AuthRequest, res) => { try { const data = settingsSchema.parse(req.body) ; const existing = await prisma.telegramSettings.findFirst() ; let settings ; if (existing) { settings = await prisma.telegramSettings.update({ where: { id: existing.id }, data: { ...data, updatedAt: new Date() }, }) ; } else { settings = await prisma.telegramSettings.create({ data }) ; } const { botToken, ...safe } = settings ; res.json({ ...safe, hasToken: !!botToken }) ; } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ; router.delete('/settings', authMiddleware, async (_req: AuthRequest, res) => { try { await prisma.telegramSettings.deleteMany() ; res.json({ success: true }) ; } catch (err: any) { res.status(500).json({ error: err.message }) ; } }) ; router.post('/send', authMiddleware, async (req: AuthRequest, res) => { try { const { chatId, text } = z.object({ chatId: z.string().min(1), text: z.string().min(1).max(4096), }).parse(req.body) ; const settings = await prisma.telegramSettings.findFirst({ include: { defaultCreator: { select: { id: true, name: true } } } }) ; if (!settings || !settings.isActive || !settings.botToken) { return res.status(400).json({ error: 'Telegram интеграция не настроена или не активна' }) ; } const response = await telegramFetch(`${TELEGRAM_API_BASE}${settings.botToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', }), }) ; if (!response.ok) { const errorText = await response.text() ; throw new Error(`Telegram API error: ${response.status} ${errorText}`) ; } const result = await response.json() as any ; res.json({ success: true, messageId: result.result?.message_id }) ; } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ; 
/** Обработка входящего Telegram-апдейта (webhook-роут и per-tenant поллер) */
export async function handleTelegramUpdate(body: any): Promise<void> {
  try { console.log('[Telegram Webhook] Raw payload:', JSON.stringify(body, null, 2)) ; const message = body?.message || body?.edited_message ; if (!message) { console.log('[Telegram Webhook] No message object in payload') ; return ; } const chatId = String(message.chat?.id || '') ; const userId = String(message.from?.id || '') ; const text = message.text?.trim() || message.caption?.trim() || '' ; const sender = message.from || {} ; const senderName = [sender.first_name, sender.last_name].filter(Boolean).join(' ') || sender.username || 'Telegram User' ; const senderUsername = sender.username || '' ; const messageId = String(message.message_id || Date.now()) ; const chatType = message.chat?.type || 'private' ; if (!chatId || !userId) { console.log('[Telegram Webhook] No chat_id or user_id found in message') ; return ; } console.log('[Telegram Webhook] Incoming message from', senderName, '(' + chatId + '):', text) ; const telegramSettings = await prisma.telegramSettings.findFirst() ; if (!telegramSettings || !telegramSettings.isActive) { console.log('[Telegram Webhook] Telegram integration is disabled') ; return ; } const lowerText = text.toLowerCase() ; if (lowerText === '/start') { await sendTelegramMessage(chatId, 'Добро пожаловать в WeCRM бот!nОтправьте текст сообщения, и я создам задачу.nКоманды:n/help — справкаn/tasks — мои задачи', telegramSettings.botToken) ; return ; } if (lowerText === '/help') { await sendTelegramMessage(chatId, 'Команды бота WeCRM:n• Отправьте любой текст — создаст задачуn• /tasks — список ваших задачn• /start — приветствие', telegramSettings.botToken) ; return ; } if (lowerText === '/tasks') { const telegramChat = await prisma.telegramUserChat.findUnique({ where: { chatId: String(chatId) }, include: { user: { select: { id: true, name: true } } }, }) ; if (!telegramChat?.userId) { await sendTelegramMessage(chatId, 'Ваш чат не связан с пользователем CRM.nОткройте в CRM: Настройки → Интеграции → Telegram, раздел «Мой чат Telegram» — выберите свой чат и нажмите «Связать».', telegramSettings.botToken) ; return ; } const tasks = await prisma.task.findMany({ where: { assignees: { some: { userId: telegramChat.userId } }, status: { notIn: ['cancelled', 'win'] }, }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, status: true, priority: true, dueDate: true }, }) ; if (tasks.length === 0) { await sendTelegramMessage(chatId, 'У вас нет активных задач.', telegramSettings.botToken) ; } else { const taskList = tasks.map((t, i) => `${i + 1}. ${t.title} (${t.status})`).join('n') ; await sendTelegramMessage(chatId, 'Ваши задачи:nn' + taskList, telegramSettings.botToken) ; } return ; } await prisma.telegramUserChat.upsert({ where: { chatId: String(chatId) }, update: { username: senderUsername, firstName: sender.first_name || '', lastName: sender.last_name || '', updatedAt: new Date(), }, create: { chatId: String(chatId), username: senderUsername, firstName: sender.first_name || '', lastName: sender.last_name || '', }, }) ; const attachments: any[] = [] ; if (message.photo && message.photo.length > 0) { const largest = message.photo[message.photo.length - 1] ; attachments.push({ type: 'photo', file_id: largest.file_id }) ; } if (message.document) { attachments.push({ type: 'document', file_id: message.document.file_id, file_name: message.document.file_name, mime_type: message.document.mime_type, }) ; } if (message.voice) { attachments.push({ type: 'voice', file_id: message.voice.file_id }) ; } if (message.video) { attachments.push({ type: 'video', file_id: message.video.file_id }) ; } if (message.audio) { attachments.push({ type: 'audio', file_id: message.audio.file_id }) ; } if (message.sticker) { attachments.push({ type: 'sticker', file_id: message.sticker.file_id }) ; } await processTelegramMessage({ id: messageId, chat_id: String(chatId), user_id: String(userId), text, sender_name: senderName, sender_username: senderUsername, sender_avatar: undefined, sender_description: `Telegram: ${senderUsername ? '@' + senderUsername + ' · ' : ''}ID ${sender.id}`, attachments, }, telegramSettings) ; console.log('[Telegram Webhook] Message processed via processTelegramMessage') ; 
  } catch (err: any) { console.error('[Telegram Webhook] Error:', err.message, err.stack) ; }
}

router.post('/webhook', async (req, res) => { await handleTelegramUpdate(req.body) ; res.json({ ok: true }) ; }) ;  router.get('/webhook', async (_req, res) => { res.json({ ok: true, service: 'wecrm-telegram-integration' }) ; }) ; // Список известных чатов (писавших боту) — для выбора при привязке к пользователю CRM
router.get('/chats', authMiddleware, async (_req: AuthRequest, res) => { try { const chats = await prisma.telegramUserChat.findMany({ orderBy: { updatedAt: 'desc' }, take: 50, include: { user: { select: { id: true, name: true } } } }) ; res.json(chats) ; } catch (err: any) { res.status(500).json({ error: err.message }) ; } }) ;
router.post('/link-chat', authMiddleware, async (req: AuthRequest, res) => { try { const { chatId } = z.object({ chatId: z.string().min(1), }).parse(req.body) ; const telegramChat = await prisma.telegramUserChat.upsert({ where: { chatId }, update: { userId: req.user!.id }, create: { chatId, userId: req.user!.id }, }) ; res.json({ success: true, telegramChat }) ; } catch (err: any) { res.status(400).json({ error: err.message }) ; } }) ; router.get('/my-chat', authMiddleware, async (req: AuthRequest, res) => { try { const telegramChat = await prisma.telegramUserChat.findFirst({ where: { userId: req.user!.id }, }) ; res.json(telegramChat) ; } catch (err: any) { res.status(500).json({ error: err.message }) ; } }) ; async function sendTelegramMessage(chatId: string, text: string, botToken: string) { try { console.log('[Telegram Send] Sending to chat_id:', chatId, 'text:', text.substring(0, 50)) ; const response = await telegramFetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', }), }) ; if (!response.ok) { console.error('[Telegram Send] Failed:', response.status, await response.text()) ; } else { console.log('[Telegram Send] OK, chat_id:', chatId) ; } } catch (err: any) { console.error('[Telegram Send] Error:', err.message) ; } } export default router ;

// === Поллер getUpdates (per-tenant) ===
// Дата-центры Telegram не могут достучаться до сервера по webhook (провайдер
// блокирует входящие соединения от Telegram), поэтому входящие сообщения
// забираются опросом через VPN-прокси (telegramFetch). Для каждой организации
// (tenant'а) работает свой поллер со своим offset-файлом и обработкой
// сообщений напрямую (в контексте tenant'а — prisma маршрутизируется в БД
// организации). Синхронизацией экземпляров управляет lib/tenant-loop.ts.
import { TenantInfo, tenantContext } from '../lib/tenant.js' ;

class TelegramTenantPoller {
  private stopped = false ;
  constructor(private tenant: TenantInfo) {}

  private offsetFile(): string {
    // Главная организация — прежний файл (непрерывность offset при обновлении)
    const key = this.tenant.isMain ? '' : `-${this.tenant.slug}` ;
    return `/app/data/tg-poller-offset${key}.json` ;
  }

  async run() {
    const file = this.offsetFile() ;
    let offset = 0 ;
    try { offset = JSON.parse(fs.readFileSync(file, 'utf-8')).offset || 0 } catch { /* первый запуск */ }
    // снимаем webhook, но сохраняем накопленные апдейты — их разберёт поллер
    try {
      const s = await prisma.telegramSettings.findFirst() ;
      if (s?.botToken) {
        await telegramFetch(`${TELEGRAM_API_BASE}${s.botToken}/deleteWebhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drop_pending_updates: false }) }) ;
        console.log(`[Telegram Poller] Webhook снят (${this.tenant.slug}), переход на опрос getUpdates`) ;
      }
    } catch (err: any) { console.log('[Telegram Poller] deleteWebhook:', err.message) }
    while (!this.stopped) {
      try {
        const settings = await prisma.telegramSettings.findFirst() ;
        if (!settings || !settings.isActive || !settings.botToken) {
          await new Promise((r) => setTimeout(r, 30000)) ;
          continue ;
        }
        const res = await telegramFetch(`${TELEGRAM_API_BASE}${settings.botToken}/getUpdates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ offset, timeout: 25, allowed_updates: ['message', 'edited_message'] }) }) ;
        if (!res.ok) { console.log('[Telegram Poller] HTTP', res.status) ; await new Promise((r) => setTimeout(r, 5000)) ; continue }
        const data: any = await res.json() ;
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = update.update_id + 1 ;
            try { fs.mkdirSync(path.dirname(file), { recursive: true }) ; fs.writeFileSync(file, JSON.stringify({ offset })) } catch { /* offset некритичен */ }
            try {
              await handleTelegramUpdate(update) ;
            } catch (err: any) { console.log('[Telegram Poller] handle error:', err.message) }
          }
        }
      } catch (err: any) {
        console.log('[Telegram Poller] error:', err.message) ;
        await new Promise((r) => setTimeout(r, 5000)) ;
      }
    }
    console.log(`[Telegram Poller] Остановлен для tenant ${this.tenant.slug}`) ;
  }

  stop() { this.stopped = true ; }
}

const pollers = new Map<string, TelegramTenantPoller>() ;

/** Синхронизирует набор работающих поллеров со списком активных tenant'ов */
export function syncTelegramPollers(tenants: TenantInfo[]): void {
  const wanted = new Map(tenants.map((t) => [t.isMain ? 'main' : t.slug, t])) ;
  for (const [key, p] of pollers) {
    if (!wanted.has(key)) { p.stop() ; pollers.delete(key) ; }
  }
  for (const [key, t] of wanted) {
    if (!pollers.has(key)) {
      const p = new TelegramTenantPoller(t) ;
      pollers.set(key, p) ;
      // Поллер запускается в контексте tenant'а: все prisma-обращения
      // (settings, задачи, чаты) идут в БД организации
      tenantContext.run(t, () => { p.run() ; }) ;
      console.log(`[Telegram Poller] Запущен для tenant ${t.slug}`) ;
    }
  }
}
