-- Префиксы номеров резервов и заказов (Каталог).
-- Номера по-прежнему Int, префикс до 3 символов применяется при отображении —
-- смена префикса мгновенно действует на уже созданные документы.
-- Пустое значение = префикс по умолчанию (00We- для резервов, WE- для заказов).
CREATE TABLE "number_prefix_settings" (
    "id" SERIAL NOT NULL,
    "reserve_prefix" TEXT NOT NULL DEFAULT '',
    "sale_prefix" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "number_prefix_settings_pkey" PRIMARY KEY ("id")
);
