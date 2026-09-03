import webpush from 'web-push' ; import { prisma } from './prisma.js' ; const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '' ; const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '' ; const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@welans.cc' ; webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey) ; export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }, type?: 'task' | 'comment' | 'chat' | 'call' | 'deal' | 'news') { const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushEnabled: true, notifyTask: true, notifyComment: true, notifyChat: true, notifyCall: true, notifyDeal: true, notifyNews: true }, }) ; if (!user || !user.pushEnabled) { console.log(`[Push] Skipped for user ${userId}: push disabled`) ; return ; } if (type) { const typeMap: Record<string, boolean | undefined> = { task: user.notifyTask, comment: user.notifyComment, chat: user.notifyChat, call: user.notifyCall, deal: user.notifyDeal, news: user.notifyNews, } ; if (typeMap[type] === false) { console.log(`[Push] Skipped for user ${userId}: ${type} notifications disabled`) ; return ; } } const subs = await prisma.pushSubscription.findMany({ where: { userId } }) ; if (!subs.length) { console.log(`[Push] No subscriptions for user ${userId}`) ; return ; } console.log(`[Push] Sending to user ${userId}, subscriptions: ${subs.length}`) ; const data = JSON.stringify(payload) ; const results = await Promise.allSettled( subs.map(sub => webpush.sendNotification( { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, data ) ) ) ; const toDelete: string[] = [] ; results.forEach((res, i) => { if (res.status === 'rejected') { const err = res.reason as any ; console.error(`[Push] Failed for ${subs[i].endpoint.slice(0, 60)}... Status: ${err.statusCode}, Message: ${err.message || err.body}`) ; if (err.statusCode === 404 || err.statusCode === 410) { toDelete.push(subs[i].id) ; } } else { console.log(`[Push] Success for ${subs[i].endpoint.slice(0, 60)}...`) ; } }) ; if (toDelete.length) { console.log(`[Push] Deleting ${toDelete.length} expired subscriptions`) ; await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } }) ; } } export async function sendPushToTaskAssignees(taskId: string, payload: { title: string; body: string; url?: string }, excludeUserId?: string) { const assignees = await prisma.taskAssignee.findMany({ where: { taskId }, select: { userId: true }, }) ; const targets = assignees.map(a => a.userId).filter(id => id !== excludeUserId) ; await Promise.all(targets.map(uid => sendPushToUser(uid, payload, 'task'))) ; } export async function sendPushToTaskCurators(taskId: string, payload: { title: string; body: string; url?: string }, excludeUserId?: string) { const curators = await prisma.taskCurator.findMany({ where: { taskId }, select: { userId: true }, }) ; const targets = curators.map(c => c.userId).filter(id => id !== excludeUserId) ; await Promise.all(targets.map(uid => sendPushToUser(uid, payload, 'task'))) ; } export async function sendPushToAllUsers(payload: { title: string; body: string; url?: string }, excludeUserId?: string) { const allUsers = await prisma.user.findMany({ select: { id: true } }) ; const targets = allUsers.map(u => u.id).filter(id => id !== excludeUserId) ; await Promise.all(targets.map(uid => sendPushToUser(uid, payload, 'chat'))) ; }

// === Grouped push notifications (Variant 4) ===
const groupedBuffers = new Map<string, { count: number; timer: NodeJS.Timeout; payload: any; type?: string }>() ;
function flushGroupedPush(key: string) {
  const buf = groupedBuffers.get(key) ;
  if (!buf) return ;
  groupedBuffers.delete(key) ;
  const [userId] = key.split(':') ;
  const payload = buf.count > 1
    ? { ...buf.payload, body: `${buf.count} новых задачи` }
    : buf.payload ;
  sendPushToUser(userId, payload, buf.type as any).catch(() => {}) ;
}
export async function sendGroupedPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
  type?: 'task' | 'comment' | 'chat' | 'call' | 'deal' | 'news',
  delayMs = 30000
) {
  const key = `${userId}:${type || 'default'}` ;
  const existing = groupedBuffers.get(key) ;
  if (existing) {
    existing.count++ ;
    clearTimeout(existing.timer) ;
    existing.timer = setTimeout(() => flushGroupedPush(key), delayMs) ;
    return ;
  }
  const timer = setTimeout(() => flushGroupedPush(key), delayMs) ;
  groupedBuffers.set(key, { count: 1, timer, payload, type }) ;
}

export async function sendPushToRoleUsers(
  roleNames: string[],
  payload: { title: string; body: string; url?: string },
  type?: 'task' | 'comment' | 'chat' | 'call' | 'deal' | 'news',
  excludeUserId?: string
) {
  const users = await prisma.user.findMany({
    where: {
      role: { name: { in: roleNames } },
      pushEnabled: true,
    },
    select: { id: true },
  }) ;
  const targets = users.map(u => u.id).filter(id => id !== excludeUserId) ;
  await Promise.all(targets.map(uid => sendGroupedPushToUser(uid, payload, type))) ;
}

export { webpush } ; 