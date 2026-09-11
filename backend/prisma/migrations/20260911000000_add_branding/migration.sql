-- Модель брендинга: кастомные иконка приложения (PWA/favicon/уведомления) и логотип компании
CREATE TABLE "branding" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "icon_path" TEXT,
    "logo_path" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branding_pkey" PRIMARY KEY ("id")
);
