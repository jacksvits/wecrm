-- Телефон пользователя (только один) + привязка контакта к пользователю по телефону.
-- Совпадение телефона профиля с телефоном контакта даёт пользователю доступ к задачам контакта.
-- У контакта может быть привязан только один пользователь, у пользователя — один телефон.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "contacts_user_id_key" ON "contacts"("user_id");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
