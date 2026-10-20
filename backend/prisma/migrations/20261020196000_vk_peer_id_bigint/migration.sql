-- vkPeerId хранит VK peer_id, который превышает INT4 (напр. 200002998147) —
-- task.findFirst({ vkPeerId }) падал с ConversionError после исправления vk_user_id
ALTER TABLE "tasks" ALTER COLUMN "vk_peer_id" TYPE BIGINT;
