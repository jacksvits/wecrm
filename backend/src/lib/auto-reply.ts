import { prisma } from './prisma.js';
import { broadcast, CHANNELS } from './events.js';
import { sendToChannel } from './handler-messages.js';
import { htmlToText } from './html-to-text.js';

// === Автоответчик: автоматические ответы по триггерам в обсуждении задачи ===
// Если триггер совпадает (подстрока, без учёта регистра) со словом в комментарии
// обсуждения задачи — в обсуждение добавляется ответ от имени выбранного пользователя.

async function getAutoReplyConfig() {
  const settings = await prisma.autoReplySettings.findFirst({
    include: { triggers: { where: { isActive: true } } },
  });
  if (!settings?.userId || settings.triggers.length === 0) return null;
  return settings;
}

// Проверка триггеров по тексту комментария; при совпадении — публикация ответа
export async function processAutoReply(taskId: string, commentContent: string): Promise<void> {
  try {
    const settings = await getAutoReplyConfig();
    if (!settings) return;
    const userId = settings.userId;
    if (!userId) return;

    const plain = commentContent.replace(/<[^>]*>/g, ' ').toLowerCase();
    const hit = settings.triggers.find(t => t.word && plain.includes(t.word.toLowerCase()));
    if (!hit) return;

    // Защита от зацикливания: не отвечаем, если последний комментарий —
    // наш автоответ с тем же содержимым
    const last = await prisma.comment.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      select: { authorId: true, content: true },
    });
    if (last && last.authorId === userId && last.content === hit.answer) return;

    const author = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!author) return;

    await prisma.comment.create({
      data: {
        content: hit.answer,
        authorId: userId,
        taskId,
      },
    });
    broadcast(CHANNELS.TASKS, { action: 'comment', entity: 'task', id: taskId });
    broadcast(CHANNELS.COMMENTS, { action: 'create', entity: 'comment', taskId });
    console.log('[AutoReply] Триггер "%s" совпал в задаче %s', hit.word, taskId);

    // Дублируем авто-ответ клиенту в канал-источник задачи (MAX / Telegram / ВК)
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (task) {
      await sendToChannel(task, htmlToText(hit.answer));
    }
  } catch (err: any) {
    console.error('[AutoReply] Ошибка:', err?.message || err);
  }
}
