import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const adminRole = await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin', label: 'Администраторы', color: '#dcfce7', textColor: '#166534', sortOrder: 1 } });
    const managerRole = await prisma.role.upsert({ where: { name: 'manager' }, update: {}, create: { name: 'manager', label: 'Менеджеры', color: '#fef3c7', textColor: '#92400e', sortOrder: 2 } });
    const devRole = await prisma.role.upsert({ where: { name: 'developer' }, update: {}, create: { name: 'developer', label: 'Разработчики', color: '#dbeafe', textColor: '#1e40af', sortOrder: 3 } });
    const userRole = await prisma.role.upsert({ where: { name: 'user' }, update: {}, create: { name: 'user', label: 'Пользователи', color: '#f0f0f0', textColor: '#666', sortOrder: 4 } });
    await prisma.user.upsert({ where: { email: 'admin@wecrm.local' }, update: {}, create: { email: 'admin@wecrm.local', password: await bcrypt.hash('admin123', 10), name: 'Администратор', roleId: adminRole.id } });
    await prisma.user.upsert({ where: { email: 'ivan@wecrm.local' }, update: {}, create: { email: 'ivan@wecrm.local', password: await bcrypt.hash('password', 10), name: 'Иван Петров', roleId: managerRole.id } });
    await prisma.user.upsert({ where: { email: 'anna@wecrm.local' }, update: {}, create: { email: 'anna@wecrm.local', password: await bcrypt.hash('password', 10), name: 'Анна Козлова', roleId: devRole.id } });
    await prisma.user.upsert({ where: { email: 'dmitry@wecrm.local' }, update: {}, create: { email: 'dmitry@wecrm.local', password: await bcrypt.hash('password', 10), name: 'Дмитрий Смирнов', roleId: devRole.id } });
    await prisma.user.upsert({ where: { email: 'elena@wecrm.local' }, update: {}, create: { email: 'elena@wecrm.local', password: await bcrypt.hash('password', 10), name: 'Елена Волкова', roleId: userRole.id } });
    await prisma.user.upsert({ where: { email: 'sergey@wecrm.local' }, update: {}, create: { email: 'sergey@wecrm.local', password: await bcrypt.hash('password', 10), name: 'Сергей Новиков', roleId: managerRole.id } });
    console.log('Seed OK');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map