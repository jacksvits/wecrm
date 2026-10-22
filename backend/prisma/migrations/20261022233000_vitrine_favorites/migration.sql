-- Избранное витрины: личные группы у каждого пользователя + товары в группах.
-- Группа может быть передана другому пользователю — у получателя создаётся копия
-- с отметкой «передано от» (sharedById/sharedByName).

-- CreateTable
CREATE TABLE "vitrine_favorite_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "shared_by_id" TEXT,
    "shared_by_name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vitrine_favorite_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vitrine_favorite_items" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vitrine_favorite_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vitrine_favorite_groups_ownerId_idx" ON "vitrine_favorite_groups"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "vitrine_favorite_items_groupId_productId_key" ON "vitrine_favorite_items"("groupId", "productId");

-- CreateIndex
CREATE INDEX "vitrine_favorite_items_productId_idx" ON "vitrine_favorite_items"("productId");

-- AddForeignKey
ALTER TABLE "vitrine_favorite_groups" ADD CONSTRAINT "vitrine_favorite_groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitrine_favorite_items" ADD CONSTRAINT "vitrine_favorite_items_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "vitrine_favorite_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitrine_favorite_items" ADD CONSTRAINT "vitrine_favorite_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
