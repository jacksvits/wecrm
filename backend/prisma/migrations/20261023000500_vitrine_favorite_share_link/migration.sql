-- Ссылка-приглашение для передачи группы избранного: по токену любой авторизованный
-- пользователь может посмотреть группу и принять её копию в своё избранное.

-- AlterTable
ALTER TABLE "vitrine_favorite_groups" ADD COLUMN "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "vitrine_favorite_groups_share_token_key" ON "vitrine_favorite_groups"("share_token");
