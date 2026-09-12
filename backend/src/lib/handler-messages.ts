import { prisma } from './prisma.js';
import { broadcast, CHANNELS } from './events.js';

// === Обработчик: автоматические сообщения в обсуждение задачи ===
// Условие срабатывания: включён хотя бы один из плагинов «MAX», «Telegram», «ВК Группа».
// Если у задачи определён канал-источник (Telegram/MAX/VK) — требуется активность именно этого плагина.

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

async function getHandlerConfig() {
  const settings = await prisma.handlerSettings.findFirst();
  if (!settings) return null;
  const [max, telegram, vk] = await Promise.all([
    prisma.maxSettings.findFirst({ select: { isActive: true } }),
    prisma.telegramSettings.findFirst({ select: { isActive: true } }),
    prisma.vkGroupSettings.findFirst({ select: { isActive: true } }),
  ]);
  return {
    settings,
    plugins: {
      max: max?.isActive ?? false,
      telegram: telegram?.isActive ?? false,
      vk: vk?.isActive ?? false,
    },
  };
}

// Проверка условия плагинов для конкретной задачи
function isChannelAllowed(task: any, plugins: { max: boolean; telegram: boolean; vk: boolean }): boolean {
  const anyActive = plugins.max || plugins.telegram || plugins.vk;
  if (!anyActive) return false;
  const fromTelegram = !!(task?.telegramMessageId || task?.telegramChatId);
  const fromMax = !!(task?.maxMessageId || task?.maxChatId);
  const fromVk = !!(task?.vkMessageId || task?.vkPeerId || task?.vkGroupId);
  if (fromTelegram) return plugins.telegram;
  if (fromMax) return plugins.max;
  if (fromVk) return plugins.vk;
  // Задача без канала-источника (создана вручную/по почте) — достаточно любого активного плагина
  return true;
}

// Публикация автоматического сообщения в обсуждение задачи от имени выбранного пользователя
async function postAutoMessage(taskId: string, content: string): Promise<void> {
  const config = await getHandlerConfig();
  if (!config) return;
  const { settings, plugins } = config;
  if (!settings.userId) return;
  const text = stripHtml(content);
  if (!text) return;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;
  if (!isChannelAllowed(task, plugins)) return;

  const author = await prisma.user.findUnique({ where: { id: settings.userId }, select: { id: true } });
  if (!author) return;

  await prisma.comment.create({
    data: {
      content,
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
