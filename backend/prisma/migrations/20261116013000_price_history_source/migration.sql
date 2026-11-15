-- Источник изменения цены: manual (руками) | import-xls (импорт «Цены XLS»)
ALTER TABLE "price_history" ADD COLUMN "source" TEXT;
