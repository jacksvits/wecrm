-- Товары: номенклатура, склады, остатки, движения, виды цен, цены, история цен

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'шт',
    "barcode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_category_idx" ON "products"("category");

CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_balances" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reserved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_balances_product_id_warehouse_id_key" ON "stock_balances"("product_id", "warehouse_id");
CREATE INDEX "stock_balances_warehouse_id_idx" ON "stock_balances"("warehouse_id");

CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION,
    "comment" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "stock_movements_product_id_date_idx" ON "stock_movements"("product_id", "date");
CREATE INDEX "stock_movements_warehouse_id_date_idx" ON "stock_movements"("warehouse_id", "date");

CREATE TABLE "price_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#f0f0f0',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "price_types_name_key" ON "price_types"("name");

CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price_type_id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_prices_product_id_price_type_id_key" ON "product_prices"("product_id", "price_type_id");

CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price_type_id" TEXT NOT NULL,
    "old_price" DOUBLE PRECISION NOT NULL,
    "new_price" DOUBLE PRECISION NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "price_history_product_id_created_at_idx" ON "price_history"("product_id", "created_at");

ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_price_type_id_fkey" FOREIGN KEY ("price_type_id") REFERENCES "price_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_price_type_id_fkey" FOREIGN KEY ("price_type_id") REFERENCES "price_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===== Демо-данные =====

INSERT INTO "warehouses" ("id","name","location","sort_order") VALUES
('wh-main','Основной склад','Складская зона',1),
('wh-hall','Торговый зал','Зал',2);

INSERT INTO "price_types" ("id","name","label","color","sort_order") VALUES
('pt-purchase','purchase','Закупочная','#dbeafe',1),
('pt-wholesale','wholesale','Оптовая','#fef3c7',2),
('pt-retail','retail','Розничная','#dcfce7',3);

INSERT INTO "products" ("id","sku","name","description","category","unit","created_at","updated_at") VALUES
('prod-0001','KTR-CE285A','Картридж HP 85A (CE285A)','<p>Оригинальный лазерный картридж. Ресурс: ~1600 страниц (A4).</p>','Расходные материалы','шт',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-0002','CBL-HDMI-1.5','Кабель HDMI 2.0, 1.5 м','<p>Высокоскоростной кабель HDMI 2.0. Поддержка 4K@60Hz.</p>','Комплектующие','шт',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('prod-0003','NB-TP-E14','Ноутбук Lenovo ThinkPad E14','<p>Бизнес-ноутбук: Intel Core i5, 16 ГБ ОЗУ, SSD 512 ГБ, 14".</p>','Техника','шт',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "product_prices" ("id","product_id","price_type_id","price","updated_at") VALUES
('pp-0001','prod-0001','pt-purchase',1450,CURRENT_TIMESTAMP),
('pp-0002','prod-0001','pt-wholesale',1900,CURRENT_TIMESTAMP),
('pp-0003','prod-0001','pt-retail',2400,CURRENT_TIMESTAMP),
('pp-0004','prod-0002','pt-purchase',180,CURRENT_TIMESTAMP),
('pp-0005','prod-0002','pt-wholesale',280,CURRENT_TIMESTAMP),
('pp-0006','prod-0002','pt-retail',420,CURRENT_TIMESTAMP),
('pp-0007','prod-0003','pt-purchase',62000,CURRENT_TIMESTAMP),
('pp-0008','prod-0003','pt-wholesale',71500,CURRENT_TIMESTAMP),
('pp-0009','prod-0003','pt-retail',82990,CURRENT_TIMESTAMP);

INSERT INTO "stock_balances" ("id","product_id","warehouse_id","quantity","updated_at") VALUES
('sb-0001','prod-0001','wh-main',25,CURRENT_TIMESTAMP),
('sb-0002','prod-0001','wh-hall',5,CURRENT_TIMESTAMP),
('sb-0003','prod-0002','wh-main',60,CURRENT_TIMESTAMP),
('sb-0004','prod-0002','wh-hall',10,CURRENT_TIMESTAMP),
('sb-0005','prod-0003','wh-main',3,CURRENT_TIMESTAMP),
('sb-0006','prod-0003','wh-hall',1,CURRENT_TIMESTAMP);

INSERT INTO "stock_movements" ("id","product_id","warehouse_id","type","quantity","price","comment","date","created_at") VALUES
('mov-0001','prod-0001','wh-main','income',25,1450,'Начальный остаток',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('mov-0002','prod-0001','wh-hall','income',5,1450,'Начальный остаток',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('mov-0003','prod-0002','wh-main','income',60,180,'Начальный остаток',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('mov-0004','prod-0002','wh-hall','income',10,180,'Начальный остаток',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('mov-0005','prod-0003','wh-main','income',3,62000,'Начальный остаток',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('mov-0006','prod-0003','wh-hall','income',1,62000,'Начальный остаток',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
