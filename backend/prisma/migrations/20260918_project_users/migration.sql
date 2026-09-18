-- Привязка пользователей к проектам: только участники (и админ) видят задачи проекта

CREATE TABLE "project_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_users_user_id_project_id_key" ON "project_users"("user_id", "project_id");
CREATE INDEX "project_users_user_id_idx" ON "project_users"("user_id");
CREATE INDEX "project_users_project_id_idx" ON "project_users"("project_id");

ALTER TABLE "project_users" ADD CONSTRAINT "project_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
