import { Router } from 'express' ; import { prisma } from '../lib/prisma.js' ;
import { pinTenantContext } from '../lib/tenant.js' ;
import { authMiddleware, AuthRequest } from '../middleware/auth.js' ;
import { withImap } from './mail.js' ;

// Счётчики пунктов меню: «Задачи (N)», «Напоминания (M)», «Почтовый клиент (W)»
const router = Router() ;
router.use(authMiddleware) ;

const isAdmin = (req: AuthRequest) => ['admin', 'developer'].includes(req.user?.role || '') ;

// In-memory кэш счётчиков (per-user, TTL 60 с) — почта ходит в IMAP, без кэша поллинг меню
// создавал бы постоянное подключение к серверу почты у каждого пользователя
const badgesCache = new Map<string, { data: { tasks: number; reminders: number; mailUnread: number }; expiry: number }>() ;
const CACHE_TTL_MS = 60_000 ;

// Активные задачи: статус входит в статусы с isActive=true (как фильтр «Скрывать выполненные» в TaskList)
async function countActiveTasks(req: AuthRequest): Promise<number> {
  const activeStatuses = await prisma.status.findMany({ where: { entityType: 'task', isActive: true }, select: { name: true } }) ;
  if (!activeStatuses.length) return 0 ;
  const where: any = { status: { in: activeStatuses.map(s => s.name) } } ;
  if (!isAdmin(req)) {
    const userId = req.user!.id ;
    where.OR = [
      { creatorId: userId },
      { assignees: { some: { userId } } },
      { curators: { some: { userId } } },
      { project: { users: { some: { userId } } } },
      { contact: { userId } },
    ] ;
  }
  return prisma.task.count({ where }) ;
}

// Активные напоминания: не завершённые, свои или расшаренные текущему пользователю
async function countActiveReminders(req: AuthRequest): Promise<number> {
  const userId = req.user!.id ;
  return prisma.reminder.count({ where: { completedAt: null, OR: [{ userId }, { sharedWith: { some: { userId } } }] } }) ;
}

// Непрочитанные письма со всех ящиков пользователя, кроме «Спам» и «Корзина» (по specialUse IMAP,
// с запасным распознаванием по имени папки для серверов без SPECIAL-USE)
const SKIP_SPECIAL = new Set(['\\Junk', '\\Trash']) ;
const SKIP_NAME_RE = /^(спам|junk|spam|корзина|trash|удал[её]нные?|deleted)$/i ;
function isSkippedFolder(node: any): boolean {
  if (node.specialUse && SKIP_SPECIAL.has(node.specialUse)) return true ;
  if (!node.specialUse && node.name && SKIP_NAME_RE.test(String(node.name).trim())) return true ;
  return false ;
}
async function countMailUnread(userId: string): Promise<number> {
  const accounts = await prisma.mailAccount.findMany({ where: { userId }, select: { id: true } }) ;
  if (!accounts.length) return 0 ;
  let total = 0 ;
  for (const acc of accounts) {
    try {
      const account = await prisma.mailAccount.findUnique({ where: { id: acc.id } }) ;
      if (!account) continue ;
      total += await withImap(account as any, async client => {
        const listed = await client.listTree() ;
        let unseen = 0 ;
        const walk = async (node: any): Promise<void> => {
          if (isSkippedFolder(node)) return ; // спам/корзина и их подпапки не считаем
          try {
            const s = await client.status(node.path, { unseen: true }) ;
            unseen += s.unseen ?? 0 ;
          } catch {
            // отдельные недоступные папки (ACL) не ломают общий счётчик
          }
          for (const sub of node.folders || []) await walk(sub) ;
        } ;
        for (const node of (listed as any)?.folders || []) await walk(node) ;
        return unseen ;
      }) ;
    } catch {
      // недоступный ящик (сеть/пароль) не должен ронять весь эндпоинт — считаем его за 0
    }
  }
  return total ;
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const cacheKey = req.user!.id ;
    const cached = badgesCache.get(cacheKey) ;
    if (cached && cached.expiry > Date.now()) return res.json(cached.data) ;
    const [tasks, reminders] = await Promise.all([countActiveTasks(req), countActiveReminders(req)]) ;
    // почта — отдельно: IMAP может отвечать долго, не блокируем остальные счётчики
    const mailUnread = await countMailUnread(req.user!.id) ;
    const data = { tasks, reminders, mailUnread } ;
    badgesCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS }) ;
    res.json(data) ;
  } catch (err: any) {
    console.error('[menu-badges]', err) ;
    res.status(500).json({ error: err.message }) ;
  }
}) ;

pinTenantContext(router) ;
export default router ;
