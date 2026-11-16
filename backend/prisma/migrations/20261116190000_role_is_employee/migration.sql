-- «Сотрудник»: пометка роли как сотрудник (используется как фильтр)
ALTER TABLE "roles" ADD COLUMN "is_employee" BOOLEAN NOT NULL DEFAULT false;
