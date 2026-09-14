-- Новости: реакции (лайки/дизлайки) и комментарии
CREATE TABLE "news_reactions" (
    "id" TEXT NOT NULL,
    "news_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_reactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "news_comments" (
    "id" TEXT NOT NULL,
    "news_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_comments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "news_reactions_news_id_user_id_key" ON "news_reactions"("news_id", "user_id");
CREATE INDEX "news_comments_news_id_created_at_idx" ON "news_comments"("news_id", "created_at");

ALTER TABLE "news_reactions" ADD CONSTRAINT "news_reactions_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_reactions" ADD CONSTRAINT "news_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
