import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrateAvatars() {
  const avatarDir = '/app/uploads/avatars';
  if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
  }

  const users = await prisma.user.findMany({
    where: { avatar: { not: null } },
    select: { id: true, avatar: true },
  });

  console.log(`Found ${users.length} users with avatars to migrate`);

  for (const user of users) {
    if (!user.avatar || !user.avatar.startsWith('data:image/')) {
      console.log(`Skipping user ${user.id} - already a URL or empty`);
      continue;
    }

    const match = user.avatar.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      console.log(`Skipping user ${user.id} - invalid format`);
      continue;
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const base64Data = match[2];
    const filePath = path.join(avatarDir, `${user.id}.${ext}`);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    const avatarUrl = `/uploads/avatars/${user.id}.${ext}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    });

    console.log(`Migrated user ${user.id} -> ${avatarUrl}`);
  }

  console.log('Migration complete!');
}

migrateAvatars()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
