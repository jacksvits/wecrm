import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { GUEST_EMAIL } from '../lib/guest-demo.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    allowedPages?: string[];
    canAccessChat?: boolean;
    canAccessSupportChat?: boolean;
    canSeeAllSupportTickets?: boolean;
    showFinancesTab?: boolean;
    stockAccess?: boolean;
    impersonatorId?: string;
    canCreateNews?: boolean;
    canEditNews?: boolean;
      canHandleSpam?: boolean;
      canReadContactAccesses?: boolean;
      canEditContactAccesses?: boolean;
      canDeleteContactAccesses?: boolean;
      isGuest?: boolean;
      // Призрачная сессия: вход главного админа платформы в тенант кнопкой «Сменить тенант»
      // (heartbeat не обновляет lastActiveAt — пользователь не светится «онлайн»/«был в сети»)
      ghost?: boolean;
  };
}



function extractToken(req: AuthRequest): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (typeof req.headers['x-auth-token'] === 'string') {
    // кастомный заголовок: обход ложных блокировок WAF на Authorization (Bearer JWT)
    return req.headers['x-auth-token'] as string;
  }
  if (typeof req.query.token === 'string') {
    return req.query.token;
  }
  return undefined;
}

/** Загружает пользователя по токену; null если токен невалиден или пользователь не найден */
async function loadUserByToken(token: string): Promise<AuthRequest['user'] | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Always load fresh user data from DB to get current role and name
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: { select: { name: true, allowedPages: true, canAccessChat: true, canAccessSupportChat: true, canSeeAllSupportTickets: true, showFinancesTab: true, stockAccess: true, canChangeTaskStatus: true, allowedTaskStatuses: true, canCreateNews: true, canEditNews: true, canHandleSpam: true, canReadContactAccesses: true, canEditContactAccesses: true, canDeleteContactAccesses: true } } },
    });
    if (!user) {
      return null;
    }
    // Гостевая сессия: только просмотр — без склада, создания новостей и записей
    const isGuest = user.email === GUEST_EMAIL;
    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role?.name || 'user',
      allowedPages: user.role?.allowedPages || [],
      canAccessChat: user.role?.canAccessChat ?? true,
      canAccessSupportChat: user.role?.canAccessSupportChat ?? false,
      canSeeAllSupportTickets: user.role?.canSeeAllSupportTickets ?? false,
      showFinancesTab: user.role?.showFinancesTab ?? false,
      isGuest,
      // Складской учёт: персональный флаг пользователя ИЛИ флаг его роли
      stockAccess: isGuest ? false : (user.stockAccess || user.role?.stockAccess || false),
      canCreateNews: isGuest ? false : (user.role?.canCreateNews ?? true),
      canEditNews: isGuest ? false : (user.role?.canEditNews ?? true),
      canHandleSpam: user.role?.canHandleSpam ?? false,
      // Вкладка «Доступы» у контактов и организаций
      canReadContactAccesses: user.role?.canReadContactAccesses ?? true,
      canEditContactAccesses: isGuest ? false : (user.role?.canEditContactAccesses ?? false),
      canDeleteContactAccesses: isGuest ? false : (user.role?.canDeleteContactAccesses ?? false),
      impersonatorId: decoded.imp,
      ghost: decoded.ghost === true,
    };
  } catch {
    return null;
  }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await loadUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = user;
  next();
}

/**
 * Публичный доступ: токен проверяется, если передан (req.user заполняется),
 * гость пропускается без пользователя. Мутации защищаются отдельным requireUser.
 */
export async function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const user = await loadUserByToken(token);
    if (user) req.user = user;
  }
  next();
}


// Гостевой доступ: запрет создания данных (контакты, сделки, задачи и т.п.)
export function guestCreateGuard(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.isGuest) {
    return res.status(403).json({ error: 'Гостевой доступ: создание записей недоступно' });
  }
  next();
}
