-- Вкладка «Автоответчик»: триггеры и ответы в обсуждениях задач
CREATE TABLE "auto_reply_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_reply_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auto_reply_triggers" (
    "id" TEXT NOT NULL,
    "settings_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_reply_triggers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "auto_reply_settings" ADD CONSTRAINT "auto_reply_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_reply_triggers" ADD CONSTRAINT "auto_reply_triggers_settings_id_fkey" FOREIGN KEY ("settings_id") REFERENCES "auto_reply_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
