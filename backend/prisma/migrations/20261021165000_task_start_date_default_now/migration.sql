-- Начало срока: значение по умолчанию на уровне БД (дата/время создания задачи).
-- Задачи создаются из многих мест (API, телефония, email, telegram, vk, max, support-chat),
-- поэтому дефолт задаётся здесь, а не только в API-роуте.
-- Также заполняем startDate для ранее созданных задач (равным дате создания).

ALTER TABLE "tasks" ALTER COLUMN "startDate" SET DEFAULT now();

UPDATE "tasks" SET "startDate" = "createdAt" WHERE "startDate" IS NULL;
