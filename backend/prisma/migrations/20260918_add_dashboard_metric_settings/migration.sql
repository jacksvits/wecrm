-- Персональные настройки метрик дашборда: порядок и видимость метрик для каждого пользователя
CREATE TABLE "dashboard_metric_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metric_key" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_metric_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dashboard_metric_settings_user_id_metric_key_key" ON "dashboard_metric_settings"("user_id", "metric_key");

ALTER TABLE "dashboard_metric_settings" ADD CONSTRAINT "dashboard_metric_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
