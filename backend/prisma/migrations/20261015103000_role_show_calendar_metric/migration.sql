-- Роли: опция «Метрика календаря» — видимость виджета календаря (задачи + напоминания + расписание) на дашборде

ALTER TABLE "roles" ADD COLUMN "show_calendar_metric" BOOLEAN NOT NULL DEFAULT true;
