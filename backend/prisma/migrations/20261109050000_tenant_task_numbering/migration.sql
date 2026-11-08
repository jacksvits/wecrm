-- Каждая БД (платформа и каждый tenant) ведёт собственную непрерывную нумерацию задач.
-- Двухфазное обновление через отрицательные значения исключает коллизии unique-индекса.
DO $$
DECLARE
  next_number integer;
BEGIN
  LOCK TABLE "tasks" IN ACCESS EXCLUSIVE MODE;

  UPDATE "tasks" SET "ticket_number" = -"ticket_number";

  WITH ordered AS (
    SELECT
      "id",
      ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS new_number
    FROM "tasks"
  )
  UPDATE "tasks" AS task
  SET "ticket_number" = ordered.new_number
  FROM ordered
  WHERE task."id" = ordered."id";

  SELECT COALESCE(MAX("ticket_number"), 0) + 1
  INTO next_number
  FROM "tasks";

  -- false: следующий nextval() вернёт ровно next_number; для пустой БД это 1.
  PERFORM setval('tasks_ticket_number_seq', next_number, false);
END $$;
