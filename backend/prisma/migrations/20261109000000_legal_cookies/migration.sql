-- Политика использования cookies (плашка согласия на странице авторизации)
ALTER TABLE "legal_documents" ADD COLUMN IF NOT EXISTS "cookies" TEXT NOT NULL DEFAULT '';
