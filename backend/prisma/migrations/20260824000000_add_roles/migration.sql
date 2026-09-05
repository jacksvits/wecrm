CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#f0f0f0',
    "textColor" TEXT NOT NULL DEFAULT '#666',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

INSERT INTO "roles" ("id", "name", "label", "color", "textColor", "sortOrder") VALUES
('role_admin', 'admin', 'Администраторы', '#dcfce7', '#166534', 1),
('role_manager', 'manager', 'Менеджеры', '#fef3c7', '#92400e', 2),
('role_developer', 'developer', 'Разработчики', '#dbeafe', '#1e40af', 3),
('role_user', 'user', 'Пользователи', '#f0f0f0', '#666', 4);

ALTER TABLE "users" ADD COLUMN "roleId" TEXT;
UPDATE "users" SET "roleId" = 'role_admin' WHERE "role" = 'admin';
UPDATE "users" SET "roleId" = 'role_manager' WHERE "role" = 'manager';
UPDATE "users" SET "roleId" = 'role_developer' WHERE "role" = 'developer';
UPDATE "users" SET "roleId" = 'role_user' WHERE "role" = 'user' OR "role" IS NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" DROP COLUMN "role";
