-- Индивидуальный предприниматель (ИНН 12 знаков) — это организация:
-- разовая правка уже загруженных карточек
UPDATE "contacts" SET kind = 'organization', position = NULL
WHERE kind = 'contact' AND "inn" IS NOT NULL AND length(regexp_replace("inn", '[^0-9]', '', 'g')) = 12;
