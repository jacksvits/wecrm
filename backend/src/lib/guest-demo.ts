// Демо-данные для гостевого доступа: генерация при каждой гостевой сессии
// и полный сброс данных предыдущей демо-сессии.
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

// Скрытый маркер демо-контактов: по нему данные гостя находятся и удаляются
export const GUEST_DEMO_TAG = 'wecrm-demo';

// Создаёт (или находит) гостевого пользователя с правами обычного пользователя (роль "user")
export async function ensureGuestUser() {
  let role = await prisma.role.findUnique({ where: { name: 'user' } });
  if (!role) {
    role = await prisma.role.create({
      data: { name: 'user', label: 'Пользователи', color: '#f0f0f0', textColor: '#666', sortOrder: 4 },
    });
  }

  let user = await prisma.user.findUnique({ where: { email: 'guest@wecrm.local' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'guest@wecrm.local',
        username: 'guest',
        password: await bcrypt.hash(Math.random().toString(36).slice(2) + Date.now(), 10),
        name: 'Гость',
        roleId: role.id,
      },
    });
  } else if (user.roleId !== role.id) {
    user = await prisma.user.update({ where: { id: user.id }, data: { roleId: role.id } });
  }
  return user;
}

// Удаляет все данные предыдущей гостевой демо-сессии
export async function resetGuestDemoData(guestId: string) {
  const demoContacts = await prisma.contact.findMany({
    where: { tags: { has: GUEST_DEMO_TAG } },
    select: { id: true },
  });
  const contactIds = demoContacts.map(c => c.id);

  const demoDeals = await prisma.deal.findMany({
    where: { contactId: { in: contactIds } },
    select: { id: true },
  });
  const dealIds = demoDeals.map(d => d.id);

  const demoTasks = await prisma.task.findMany({
    where: {
      OR: [
        { creatorId: guestId },
        { contactId: { in: contactIds } },
        { dealId: { in: dealIds } },
      ],
    },
    select: { id: true },
  });
  const taskIds = demoTasks.map(t => t.id);

  // Сначала зависимости без каскадного удаления, затем сами сущности
  await prisma.comment.deleteMany({ where: { authorId: guestId } });
  await prisma.activity.deleteMany({ where: { OR: [{ userId: guestId }, { taskId: { in: taskIds } }] } });
  await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  await prisma.deal.deleteMany({ where: { OR: [{ id: { in: dealIds } }, { contactId: { in: contactIds } }] } });
  await prisma.contact.deleteMany({ where: { id: { in: contactIds } } });
  await prisma.chatMessage.deleteMany({ where: { authorId: guestId } });
}

// Генерирует набор демо-данных для гостевой сессии
export async function generateGuestDemoData(guestId: string) {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const [contact1, contact2, contact3, contact4, org1] = await Promise.all([
    prisma.contact.create({
      data: {
        name: 'Марина Соколова',
        kind: 'contact',
        type: 'client',
        phone: '+7 (921) 555-01-14',
        email: 'marina.sokolova@example.com',
        tags: [GUEST_DEMO_TAG, 'vip'],
        position: 'Руководитель отдела закупок',
        notes: 'Предпочитает связь по email, активно интересуется обновлениями каталога.',
        lastActivityTime: new Date(now - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.contact.create({
      data: {
        name: 'ООО «Вектор»',
        kind: 'organization',
        type: 'client',
        phone: '+7 (812) 300-45-67',
        email: 'info@vector.example.com',
        tags: [GUEST_DEMO_TAG],
        inn: '7812345678',
        legalAddress: 'г. Санкт-Петербург, Невский пр., д. 28',
        description: 'Оптовый покупатель, работает с нами с 2024 года.',
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Денис Кравцов',
        kind: 'contact',
        type: 'client',
        phone: '+7 (903) 777-88-99',
        email: 'd.kravtsov@example.com',
        tags: [GUEST_DEMO_TAG],
        position: 'Инженер',
        notes: 'Звонит обычно после 15:00.',
        lastActivityTime: new Date(now - 26 * 60 * 60 * 1000),
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Алиса Герман',
        kind: 'contact',
        type: 'partner',
        phone: '+7 (495) 123-45-67',
        email: 'alisa.german@example.com',
        tags: [GUEST_DEMO_TAG],
        position: 'Менеджер по партнёрствам',
      },
    }),
    prisma.contact.create({
      data: {
        name: 'ИП Заречный А.В.',
        kind: 'organization',
        type: 'supplier',
        phone: '+7 (383) 209-11-22',
        email: 'zarechny@example.com',
        tags: [GUEST_DEMO_TAG],
        inn: '5401123456',
        description: 'Поставщик расходных материалов.',
      },
    }),
  ]);

  const deal1 = await prisma.deal.create({
    data: {
      title: 'Поставка оборудования для ООО «Вектор»',
      value: 1250000,
      currency: 'RUB',
      stage: 'proposal',
      probability: 60,
      contactId: contact2.id,
      expectedClose: new Date(now + 14 * day),
    },
  });
  const deal2 = await prisma.deal.create({
    data: {
      title: 'Абонемент на сервис для Марины Соколовой',
      value: 96000,
      currency: 'RUB',
      stage: 'lead',
      probability: 25,
      contactId: contact1.id,
      expectedClose: new Date(now + 30 * day),
    },
  });
  const deal3 = await prisma.deal.create({
    data: {
      title: 'Партнёрская программа с Алисой Герман',
      value: 450000,
      currency: 'RUB',
      stage: 'won',
      probability: 100,
      contactId: contact4.id,
      expectedClose: new Date(now - 5 * day),
    },
  });

  const task1 = await prisma.task.create({
    data: {
      title: 'Подготовить коммерческое предложение для ООО «Вектор»',
      description: 'Сформировать КП по поставке оборудования, указать сроки и условия оплаты.',
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date(now + 2 * day),
      creatorId: guestId,
      contactId: contact2.id,
      dealId: deal1.id,
      price: 1250000,
      assignees: { create: [{ userId: guestId }] },
    },
  });
  const task2 = await prisma.task.create({
    data: {
      title: 'Перезвонить Денису Кравцову',
      description: 'Уточнить решение по заявке на подключение, договориться о встрече.',
      status: 'open',
      priority: 'medium',
      dueDate: new Date(now + 1 * day),
      creatorId: guestId,
      contactId: contact3.id,
      assignees: { create: [{ userId: guestId }] },
    },
  });
  const task3 = await prisma.task.create({
    data: {
      title: 'Согласовать демонстрацию системы для Марины Соколовой',
      status: 'load',
      priority: 'low',
      dueDate: new Date(now + 5 * day),
      creatorId: guestId,
      contactId: contact1.id,
      dealId: deal2.id,
      assignees: { create: [{ userId: guestId }] },
    },
  });
  const task4 = await prisma.task.create({
    data: {
      title: 'Подписать акт по партнёрской программе',
      description: 'Акт готов, осталось согласование у контрагента.',
      status: 'done',
      priority: 'medium',
      dueDate: new Date(now - 1 * day),
      creatorId: guestId,
      contactId: contact4.id,
      dealId: deal3.id,
      assignees: { create: [{ userId: guestId }] },
    },
  });
  await prisma.task.create({
    data: {
      title: 'Запросить прайс у ИП Заречного',
      status: 'done',
      priority: 'low',
      dueDate: new Date(now - 6 * day),
      creatorId: guestId,
      contactId: org1.id,
    },
  });
  await prisma.task.create({
    data: {
      title: 'Перенести архив демо-периода',
      status: 'load',
      priority: 'low',
      creatorId: guestId,
    },
  });

  await prisma.comment.createMany({
    data: [
      { content: 'КП почти готово, жду согласования сроков поставки.', authorId: guestId, taskId: task1.id },
      { content: 'Договорились о звонке завтра в 11:00.', authorId: guestId, taskId: task2.id },
      { content: 'Акт отправлен на подписание.', authorId: guestId, taskId: task4.id },
    ],
  });

  await prisma.chatMessage.createMany({
    data: [
      { content: 'Привет! Это демо-режим wecrm — смотрите, всё можно потрогать руками.', authorId: guestId },
      { content: 'Задачи, контакты, сделки и чат заполнены примерными данными.', authorId: guestId },
    ],
  });
}
