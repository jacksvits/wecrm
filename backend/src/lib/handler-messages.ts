import { prisma } from './prisma.js';
import { broadcast, CHANNELS } from './events.js';

// === Обработчик: автоматические сообщения в обсуждение задачи ===
// Условие срабатывания: задача пришла из канала (Telegram/MAX/VK), у которого
// в настройках плагина включена опция «Автоматические ответы» (autoReply).
// Задачи без канала-источника (созданные вручную или из почты) авто-сообщения не получают.

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

async function getHandlerConfig() {
  const settings = await prisma.handlerSettings.findFirst();
  if (!settings) return null;
  const [max, telegram, vk] = await Promise.all([
    prisma.maxSettings.findFirst({ select: { isActive: true, autoReply: true } }),
    prisma.telegramSettings.findFirst({ select: { isActive: true, autoReply: true } }),
    prisma.vkGroupSettings.findFirst({ select: { isActive: true, autoReply: true } }),
  ]);
  return {
    settings,
    plugins: {
      max: (max?.isActive ?? false) && (max?.autoReply ?? false),
      telegram: (telegram?.isActive ?? false) && (telegram?.autoReply ?? false),
      vk: (vk?.isActive ?? false) && (vk?.autoReply ?? false),
    },
  };
}

// Проверка условия для конкретной задачи: канал-источник задачи должен быть
// с включённой опцией «Автоматические ответы» в соответствующем плагине
function isChannelAllowed(task: any, plugins: { max: boolean; telegram: boolean; vk: boolean }): boolean {
  const fromTelegram = !!(task?.telegramMessageId || task?.telegramChatId);
  const fromMax = !!(task?.maxMessageId || task?.maxChatId);
  const fromVk = !!(task?.vkMessageId || task?.vkPeerId || task?.vkGroupId);
  if (fromTelegram) return plugins.telegram;
  if (fromMax) return plugins.max;
  if (fromVk) return plugins.vk;
  // Задача без канала-источника — авто-ответы не применяются
  return false;
}

// Подстановка переменных из данных задачи:
// [name] — имя контакта, который обратился; [task] — номер задачи (ticketNumber)
function applyTaskVariables(content: string, task: any): string {
  const contactName = task?.contact?.name?.trim() || 'клиент';
  const ticket = task?.ticketNumber != null ? String(task.ticketNumber) : '';
  return content
    .replace(/\[name\]/gi, contactName)
    .replace(/\[task\]/gi, ticket);
}

// Публикация автоматического сообщения в обсуждение задачи от имени выбранного пользователя
async function postAutoMessage(taskId: string, content: string): Promise<void> {
  const config = await getHandlerConfig();
  if (!config) return;
  const { settings, plugins } = config;
  if (!settings.userId) return;
  const text = stripHtml(content);
  if (!text) return;

  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { contact: { select: { name: true } } } });
  if (!task) return;
  if (!isChannelAllowed(task, plugins)) return;

  const author = await prisma.user.findUnique({ where: { id: settings.userId }, select: { id: true } });
  if (!author) return;

  await prisma.comment.create({
    data: {
      content: applyTaskVariables(content, task),
      authorId: settings.userId,
      taskId,
    },
  });
  broadcast(CHANNELS.TASKS, { action: 'comment', entity: 'task', id: taskId });
  broadcast(CHANNELS.COMMENTS, { action: 'create', entity: 'comment', taskId });
}

// «Приветствие» — при создании новой задачи
export async function postHandlerGreeting(taskId: string): Promise<void> {
  try {
    const config = await getHandlerConfig();
    if (!config || !stripHtml(config.settings.greeting)) return;
    await postAutoMessage(taskId, config.settings.greeting);
  } catch (err: any) {
    console.error('[Handler] Failed to post greeting:', err?.message || err);
  }
}

// «Завершение задачи» — при смене статуса задачи на «Выполнена» (win)
export async function postHandlerCompletion(taskId: string): Promise<void> {
  try {
    const config = await getHandlerConfig();
    if (!config || !stripHtml(config.settings.completion)) return;
    await postAutoMessage(taskId, config.settings.completion);
  } catch (err: any) {
    console.error('[Handler] Failed to post completion:', err?.message || err);
  }
}
