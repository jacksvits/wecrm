-- Расписание: настройки страницы — собственные названия кнопок «Кабинеты»/«Смены»

CREATE TABLE "schedule_settings" (
    "id" TEXT NOT NULL,
    "rooms_label" TEXT NOT NULL DEFAULT 'Кабинеты',
    "shifts_label" TEXT NOT NULL DEFAULT 'Смены',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_settings_pkey" PRIMARY KEY ("id")
);
