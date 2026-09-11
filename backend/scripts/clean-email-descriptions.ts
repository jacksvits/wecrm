// Одноразовая очистка описаний задач, созданных из писем:
// применяет normalizeEmailDescription к description задач с emailMessageId.
// Запуск на сервере: docker exec wecrm-backend-1 npx tsx scripts/clean-email-descriptions.ts

import { prisma } from '../src/lib/prisma.js';
import { normalizeEmailDescription } from '../src/lib/email-description.js';

async function main() {
  const tasks = await prisma.task.findMany({
    where: { emailMessageId: { not: null }, description: { not: null } },
    select: { id: true, title: true, description: true },
  });
  console.log(`[clean] Найдено задач из писем с описанием: ${tasks.length}`);

  let updated = 0;
  let unchanged = 0;
  for (const task of tasks) {
    const cleaned = normalizeEmailDescription(task.description, undefined);
    if (cleaned && cleaned !== task.description) {
      await prisma.task.update({ where: { id: task.id }, data: { description: cleaned } });
      updated++;
      console.log(`[clean] #${task.id} "${task.title.slice(0, 60)}" — обновлено`);
    } else {
      unchanged++;
    }
  }
  console.log(`[clean] Готово: обновлено ${updated}, без изменений ${unchanged}`);
}

main()
  .catch((err) => {
    console.error('[clean] Ошибка:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
