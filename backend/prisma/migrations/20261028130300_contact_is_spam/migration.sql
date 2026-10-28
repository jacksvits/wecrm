-- Контакт может быть помечен как СПАМ (кнопка «череп» на задаче из письма)
ALTER TABLE "contacts" ADD COLUMN "is_spam" BOOLEAN NOT NULL DEFAULT false;
