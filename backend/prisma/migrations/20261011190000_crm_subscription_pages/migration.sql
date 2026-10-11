-- Вид товара Подписка CRM: разрешённые страницы для поддоменов организаций

ALTER TABLE "products" ADD COLUMN "crm_allowed_pages" JSONB;
