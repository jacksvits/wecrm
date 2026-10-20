-- VK peer_id превышает INT4 (напр. 200002998147) — переводим vk_user_id на BIGINT,
-- иначе contact.findUnique({ vkUserId }) падает с ConversionError в VK Community Worker
ALTER TABLE "contacts" ALTER COLUMN "vk_user_id" TYPE BIGINT;
