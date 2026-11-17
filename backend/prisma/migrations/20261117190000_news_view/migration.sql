-- Журнал просмотров новостей: источник периодической статистики «Сегодня / 7 дней / Месяц»
-- (общий счётчик news.views истории по дням не хранит)

-- CreateTable
CREATE TABLE "news_views" (
    "id" TEXT NOT NULL,
    "news_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_views_newsId_createdAt_idx" ON "news_views"("news_id", "createdAt");

-- AddForeignKey
ALTER TABLE "news_views" ADD CONSTRAINT "news_views_newsId_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;
