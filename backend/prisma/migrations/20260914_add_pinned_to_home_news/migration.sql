-- Новости: флаг «Закрепить на главной» для слайдера на дашборде
ALTER TABLE "news" ADD COLUMN "pinned_to_home" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "news_history" ADD COLUMN "pinned_to_home" BOOLEAN NOT NULL DEFAULT false;
