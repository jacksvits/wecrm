-- CreateTable
CREATE TABLE "news_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#007AFF',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_categories_slug_key" ON "news_categories"("slug");

-- CreateTable
CREATE TABLE "news_subcategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_subcategories_slug_categoryId_key" ON "news_subcategories"("slug", "categoryId");

-- CreateTable
CREATE TABLE "news_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#10b981',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_tags_name_key" ON "news_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "news_tags_slug_key" ON "news_tags"("slug");

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "cover_image" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_isPublished_publishedAt_idx" ON "news"("is_published", "published_at");

-- CreateIndex
CREATE INDEX "news_categoryId_idx" ON "news"("categoryId");

-- CreateIndex
CREATE INDEX "news_authorId_idx" ON "news"("authorId");

-- CreateTable
CREATE TABLE "news_history" (
    "id" TEXT NOT NULL,
    "news_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "tagIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cover_image" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "editorId" TEXT NOT NULL,
    "editorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_history_newsId_createdAt_idx" ON "news_history"("news_id", "createdAt");

-- CreateTable
CREATE TABLE "_NewsToNewsTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NewsToNewsTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_NewsToNewsTag_B_index" ON "_NewsToNewsTag"("B");

-- AddForeignKey
ALTER TABLE "news_subcategories" ADD CONSTRAINT "news_subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "news_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "news_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "news_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsToNewsTag" ADD CONSTRAINT "_NewsToNewsTag_A_fkey" FOREIGN KEY ("A") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsToNewsTag" ADD CONSTRAINT "_NewsToNewsTag_B_fkey" FOREIGN KEY ("B") REFERENCES "news_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
