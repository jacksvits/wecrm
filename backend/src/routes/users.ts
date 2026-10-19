import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores').optional(),
  roleId: z.string().optional(),
  canBeCurator: z.boolean().optional(),
  defaultTaskAssignee: z.boolean().optional(),
  defaultTaskCurator: z.boolean().optional(),
  stockAccess: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  roleId: z.string().optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores').optional().nullable(),
  emails: z.array(z.string().email()).optional(),
  canBeCurator: z.boolean().optional(),
  defaultTaskAssignee: z.boolean().optional(),
  defaultTaskCurator: z.boolean().optional(),
  stockAccess: z.boolean().optional(),
  novofonExtension: z.string().optional().nullable(),
});

const adminOnly = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, username: true, emails: true, avatar: true, roleId: true, role: true, createdAt: true, lastActiveAt: true, canBeCurator: true, defaultTaskAssignee: true, defaultTaskCurator: true, stockAccess: true, novofonExtension: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

router.post('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const data = createSchema.parse(req.body);
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

    if (data.username) {
      const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
      if (existingUsername) return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, username: data.username || null, password: hash, name: data.name, roleId: data.roleId || null, canBeCurator: data.canBeCurator ?? false, defaultTaskAssignee: data.defaultTaskAssignee ?? false, defaultTaskCurator: data.defaultTaskCurator ?? false, stockAccess: data.stockAccess ?? false },
      select: { id: true, name: true, email: true, username: true, emails: true, avatar: true, roleId: true, role: true, createdAt: true, lastActiveAt: true, canBeCurator: true, defaultTaskAssignee: true, defaultTaskCurator: true, stockAccess: true, novofonExtension: true },
    });
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, username: true, emails: true, avatar: true, roleId: true, role: true, createdAt: true, lastActiveAt: true, canBeCurator: true, defaultTaskAssignee: true, defaultTaskCurator: true, stockAccess: true, novofonExtension: true },
    });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Администратор меняет пароль пользователя без ввода текущего пароля
const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

router.post('/:id/reset-password', adminOnly, async (req: AuthRequest, res) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
    const hash = await bcrypt.hash(data.password, 10);
    await prisma.user.update({ where: { id: target.id }, data: { password: hash } });
    await prisma.activity.create({
      data: {
        action: 'reset-password',
        entity: 'user',
        entityId: target.id,
        details: `Администратор ${req.user!.name} сменил пароль пользователя ${target.name}`,
        userId: req.user!.id,
      },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Avatar routes must be defined BEFORE /:id to avoid "avatar" being treated as user id
router.post('/avatar', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { image } = z.object({ image: z.string().min(1) }).parse(req.body);
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Неверный формат изображения' });
    }
    // Extract base64 data and save as file
    const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Неверный формат изображения' });
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const base64Data = match[2];
    const avatarDir = '/app/uploads/avatars';
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }
    const filePath = path.join(avatarDir, `${req.user!.id}.${ext}`);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    const avatarUrl = `/uploads/avatars/${req.user!.id}.${ext}`;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
      select: { id: true, name: true, email: true, username: true, avatar: true, role: true, allowedPages: true, darkTheme: true, emails: true },
    });
    res.json(user);
  } catch (err: any) {
    console.error('[Avatar Upload] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/avatar', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Delete avatar file if exists
    const avatarDir = '/app/uploads/avatars';
    const files = fs.readdirSync(avatarDir).filter(f => f.startsWith(req.user!.id + '.'));
    for (const file of files) {
      fs.unlinkSync(path.join(avatarDir, file));
    }
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: null },
      select: { id: true, name: true, email: true, username: true, avatar: true, role: true, allowedPages: true, darkTheme: true, emails: true },
    });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Связи пользователя с другими сущностями: что будет переназначено, а что удалено
const USER_LINKS = {
  // Переназначаются на выбранного пользователя
  reassign: [
    { key: 'createdTasks', label: 'Созданные задачи', fk: 'creatorId' },
    { key: 'supportTickets', label: 'Тикеты поддержки', fk: 'supportOwnerId' },
    { key: 'taskAssignments', label: 'Назначенные задачи (исполнитель)', fk: 'userId' },
    { key: 'taskCurations', label: 'Задачи в кураторстве', fk: 'userId' },
    { key: 'comments', label: 'Комментарии к задачам', fk: 'authorId' },
    { key: 'activities', label: 'Записи активности', fk: 'userId' },
    { key: 'chatMessages', label: 'Сообщения в чатах', fk: 'authorId' },
    { key: 'attachments', label: 'Вложения', fk: 'authorId' },
    { key: 'notes', label: 'Заметки', fk: 'userId' },
    { key: 'reminders', label: 'Напоминания', fk: 'userId' },
    { key: 'news', label: 'Новости', fk: 'authorId' },
    { key: 'newsComments', label: 'Комментарии к новостям', fk: 'authorId' },
    { key: 'taskHistory', label: 'История изменений задач', fk: 'userId' },
    { key: 'webCallsMade', label: 'Исходящие звонки', fk: 'callerId' },
    { key: 'webCallsReceived', label: 'Входящие звонки', fk: 'calleeId' },
    { key: 'reservations', label: 'Бронирования', fk: 'userId' },
    { key: 'sales', label: 'Продажи', fk: 'userId' },
    { key: 'stockMovements', label: 'Движения по складу', fk: 'userId' },
    { key: 'priceHistory', label: 'История цен', fk: 'userId' },
    { key: 'scheduleShiftTemplates', label: 'Шаблоны смен', fk: 'userId' },
    { key: 'scheduleShifts', label: 'Смены в расписании', fk: 'userId' },
    { key: 'scheduleAppointments', label: 'Записи расписания', fk: 'userId' },
    { key: 'telegramSettings', label: 'Настройки Telegram-интеграций', fk: 'userId' },
    { key: 'telegramSettingsDefaultCreator', label: 'Telegram — создатель по умолчанию', fk: 'defaultCreatorId' },
    { key: 'telegramUserChats', label: 'Telegram-чаты', fk: 'userId' },
    { key: 'handlerSettings', label: 'Настройки обработчика', fk: 'userId' },
    { key: 'autoReplySettings', label: 'Настройки автоответов', fk: 'userId' },
    { key: 'maxSettings', label: 'MAX — создатель по умолчанию', fk: 'defaultCreatorId' },
    { key: 'maxUserChats', label: 'MAX-чаты', fk: 'userId' },
    { key: 'vkCommunitySettings', label: 'VK — создатель по умолчанию', fk: 'defaultCreatorId' },
    { key: 'telephonySettings', label: 'Настройки телефонии', fk: 'defaultUserId' },
    { key: 'productSubscriptions', label: 'Подписки на продукты', fk: 'userId' },
    { key: 'projectUsers', label: 'Участие в проектах', fk: 'userId' },
  ],
  // Удаляются вместе с пользователем (персональные данные)
  remove: [
    { key: 'taskFavorites', label: 'Избранные задачи' },
    { key: 'messageRecipients', label: 'Отметки прочтения сообщений' },
    { key: 'chatReactions', label: 'Реакции в чате' },
    { key: 'newsReactions', label: 'Реакции на новости' },
    { key: 'reminderRecipients', label: 'Получатели напоминаний' },
    { key: 'pushSubscriptions', label: 'Push-подписки устройств' },
    { key: 'notifications', label: 'Уведомления' },
    { key: 'dashboardMetricSettings', label: 'Настройки дашборда' },
  ],
} as const;

const deletePreviewSelect = {
  _count: {
    select: Object.fromEntries(
      [...USER_LINKS.reassign, ...USER_LINKS.remove].map(l => [l.key, true]),
    ) as Record<string, true>,
  },
} as const;

// Предпросмотр: какие записи связаны с пользователем и кому их можно переназначить
router.get('/:id/delete-preview', adminOnly, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, ...deletePreviewSelect },
    });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const counts = user._count as Record<string, number>;
    const reassign = USER_LINKS.reassign
      .map(l => ({ key: l.key, label: l.label, count: counts[l.key] || 0 }))
      .filter(l => l.count > 0);
    const remove = USER_LINKS.remove
      .map(l => ({ key: l.key, label: l.label, count: counts[l.key] || 0 }))
      .filter(l => l.count > 0);
    const candidates = await prisma.user.findMany({
      where: { id: { not: req.params.id } },
      select: { id: true, name: true, email: true, avatar: true, role: { select: { label: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ user: { id: user.id, name: user.name }, reassign, remove, candidates });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Переназначение связанных записей: для связей с уникальным ключом (taskId/projectId + userId)
// сначала удаляем дубли, где целевой пользователь уже привязан, затем обновляем остальные
async function reassignJunction(
  tx: any,
  model: 'taskAssignee' | 'taskCurator' | 'projectUser',
  uid: string,
  rid: string,
  entityField: 'taskId' | 'projectId',
) {
  const targetEntityIds = (await tx[model].findMany({
    where: { userId: rid },
    select: { [entityField]: true } as any,
  })).map((r: any) => r[entityField]);
  await tx[model].deleteMany({ where: { userId: uid, [entityField]: { in: targetEntityIds } } });
  await tx[model].updateMany({ where: { userId: uid }, data: { userId: rid } });
}

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.user?.id) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, ...deletePreviewSelect },
    });
    if (!target) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const reassignToId = (req.body as any)?.reassignToId as string | undefined;
    let reassignTo: { id: string; name: string } | null = null;
    const counts = target._count as Record<string, number>;
    const totalLinks = [...USER_LINKS.reassign, ...USER_LINKS.remove]
      .reduce((sum, l) => sum + (counts[l.key] || 0), 0);

    if (reassignToId) {
      reassignTo = await prisma.user.findUnique({
        where: { id: reassignToId },
        select: { id: true, name: true },
      });
      if (!reassignTo) {
        return res.status(400).json({ error: 'Пользователь для переназначения не найден' });
      }
    } else if (totalLinks > 0) {
      return res.status(400).json({
        error: 'У пользователя есть связанные записи. Выберите, на кого их переназначить.',
      });
    }

    const uid = req.params.id;
    await prisma.$transaction(async (tx) => {
      if (reassignTo) {
        const rid = reassignTo.id;
        // Junction-таблицы с уникальными ключами — переназначение с разрешением конфликтов
        await reassignJunction(tx, 'taskAssignee', uid, rid, 'taskId');
        await reassignJunction(tx, 'taskCurator', uid, rid, 'taskId');
        await reassignJunction(tx, 'projectUser', uid, rid, 'projectId');
        // Остальные связи — прямое переназначение
        await tx.task.updateMany({ where: { creatorId: uid }, data: { creatorId: rid } });
        await tx.task.updateMany({ where: { supportOwnerId: uid }, data: { supportOwnerId: rid } });
        await tx.comment.updateMany({ where: { authorId: uid }, data: { authorId: rid } });
        await tx.activity.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.chatMessage.updateMany({ where: { authorId: uid }, data: { authorId: rid } });
        await tx.fileAttachment.updateMany({ where: { authorId: uid }, data: { authorId: rid } });
        await tx.note.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.reminder.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.news.updateMany({ where: { authorId: uid }, data: { authorId: rid } });
        await tx.newsComment.updateMany({ where: { authorId: uid }, data: { authorId: rid } });
        await tx.taskHistory.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.webCall.updateMany({ where: { callerId: uid }, data: { callerId: rid } });
        await tx.webCall.updateMany({ where: { calleeId: uid }, data: { calleeId: rid } });
        await tx.reservation.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.sale.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.stockMovement.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.priceHistory.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.scheduleShiftTemplate.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.scheduleShift.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.scheduleAppointment.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.telegramSettings.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.telegramSettings.updateMany({ where: { defaultCreatorId: uid }, data: { defaultCreatorId: rid } });
        await tx.telegramUserChat.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.handlerSettings.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.autoReplySettings.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.maxSettings.updateMany({ where: { defaultCreatorId: uid }, data: { defaultCreatorId: rid } });
        await tx.maxUserChat.updateMany({ where: { userId: uid }, data: { userId: rid } });
        await tx.vkCommunitySettings.updateMany({ where: { defaultCreatorId: uid }, data: { defaultCreatorId: rid } });
        await tx.telephonySettings.updateMany({ where: { defaultUserId: uid }, data: { defaultUserId: rid } });
        await tx.productSubscription.updateMany({ where: { userId: uid }, data: { userId: rid } });
      }
      // Персональные данные удаляются вместе с пользователем
      await tx.taskFavorite.deleteMany({ where: { userId: uid } });
      await tx.chatMessageRecipient.deleteMany({ where: { userId: uid } });
      await tx.chatReaction.deleteMany({ where: { userId: uid } });
      await tx.newsReaction.deleteMany({ where: { userId: uid } });
      await tx.reminderRecipient.deleteMany({ where: { userId: uid } });
      await tx.pushSubscription.deleteMany({ where: { userId: uid } });
      await tx.notification.deleteMany({ where: { userId: uid } });
      await tx.dashboardMetricSetting.deleteMany({ where: { userId: uid } });
      await tx.user.delete({ where: { id: uid } });
      await tx.activity.create({
        data: {
          action: 'delete-user',
          entity: 'user',
          entityId: uid,
          details: `Администратор ${req.user!.name} удалил пользователя ${target.name}${reassignTo ? ` (записи переназначены на ${reassignTo.name})` : ''}`,
          userId: req.user!.id,
        },
      });
    });

    // Удаляем файлы аватаров пользователя
    try {
      const avatarDir = '/app/uploads/avatars';
      if (fs.existsSync(avatarDir)) {
        for (const file of fs.readdirSync(avatarDir).filter(f => f.startsWith(uid + '.'))) {
          fs.unlinkSync(path.join(avatarDir, file));
        }
      }
    } catch { /* аватары не критичны */ }

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/online', authMiddleware, async (_req, res) => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    const users = await prisma.user.findMany({
      where: { lastActiveAt: { gte: oneMinuteAgo } },
      select: {
        id: true, name: true, email: true, username: true, avatar: true,
        role: { select: { name: true } }, lastActiveAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/heartbeat', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Призрачная сессия (главный админ платформы вошёл в тенант через «Сменить тенант»):
    // не трогаем lastActiveAt — админ организации не отображается «онлайн», его «был в сети» не меняется
    if (req.user?.ghost) {
      return res.json({ ok: true });
    }
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { lastActiveAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/push-status', adminOnly, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        pushEnabled: true,
        role: { select: { name: true, label: true, isSystemHandler: true } },
        _count: { select: { pushSubscriptions: true } },
      },
      orderBy: { name: 'asc' },
    });
    // «Системный обработчик»: пользователи таких ролей в виджете push-статуса Директора не учитываются
    const mapped = users.filter(u => !u.role?.isSystemHandler).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      pushEnabled: u.pushEnabled,
      hasSubscription: u._count.pushSubscriptions > 0,
      subscriptionCount: u._count.pushSubscriptions,
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
