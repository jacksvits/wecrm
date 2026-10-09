-- Роль: видит все запросы тех. поддержки
ALTER TABLE "roles" ADD COLUMN "can_see_all_support_tickets" BOOLEAN NOT NULL DEFAULT false;
