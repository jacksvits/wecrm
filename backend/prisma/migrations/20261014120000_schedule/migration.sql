-- Расписание (календарь): кабинеты, шаблоны смен, смены на даты, записи клиентов.
-- Записи привязаны к сотруднику, а не к кабинету: кабинет вычисляется из смены,
-- поэтому перенос смены в другой кабинет автоматически «переносит» и записи.

CREATE TABLE "schedule_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "note" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "schedule_rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedule_shift_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_min" INTEGER NOT NULL,
    "end_min" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "schedule_shift_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedule_shifts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "start_min" INTEGER NOT NULL,
    "end_min" INTEGER NOT NULL,
    "template_id" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "schedule_shifts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedule_appointments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "client_name" TEXT NOT NULL,
    "client_phone" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "start_min" INTEGER NOT NULL,
    "end_min" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "comment" TEXT NOT NULL DEFAULT '',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "schedule_appointments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "schedule_shift_templates_user_id_idx" ON "schedule_shift_templates"("user_id");
CREATE INDEX "schedule_shifts_date_idx" ON "schedule_shifts"("date");
CREATE INDEX "schedule_shifts_user_id_date_idx" ON "schedule_shifts"("user_id", "date");
CREATE INDEX "schedule_shifts_template_id_date_idx" ON "schedule_shifts"("template_id", "date");
CREATE INDEX "schedule_appointments_date_idx" ON "schedule_appointments"("date");
CREATE INDEX "schedule_appointments_user_id_date_idx" ON "schedule_appointments"("user_id", "date");

ALTER TABLE "schedule_shift_templates" ADD CONSTRAINT "schedule_shift_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_shift_templates" ADD CONSTRAINT "schedule_shift_templates_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "schedule_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_shifts" ADD CONSTRAINT "schedule_shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_shifts" ADD CONSTRAINT "schedule_shifts_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "schedule_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_shifts" ADD CONSTRAINT "schedule_shifts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "schedule_shift_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_appointments" ADD CONSTRAINT "schedule_appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_appointments" ADD CONSTRAINT "schedule_appointments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
