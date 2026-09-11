import { prisma } from './prisma.js';

// Исполнители и кураторы по умолчанию из настроек пользователей.
// Зеркалит автоподстановку на фронтенде (TaskList.tsx: defaultAssigneeIds/defaultCuratorIds),
// чтобы задачи из внешних каналов (ВК, MAX, почта, телефония) получали тех же отмеченных пользователей.
export async function getDefaultTaskAssigneeIds(): Promise<string[]> {
  const users = await prisma.user.findMany({ where: { defaultTaskAssignee: true }, select: { id: true } });
  return users.map((u) => u.id);
}

export async function getDefaultTaskCuratorIds(): Promise<string[]> {
  const users = await prisma.user.findMany({ where: { defaultTaskCurator: true, canBeCurator: true }, select: { id: true } });
  return users.map((u) => u.id);
}
