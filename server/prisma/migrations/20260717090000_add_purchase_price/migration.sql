-- AlterTable
ALTER TABLE `products_toy_store` ADD COLUMN `purchase_price` DOUBLE NULL;

-- AlterTable
ALTER TABLE `products_electronics` ADD COLUMN `purchase_price` DOUBLE NULL;

-- AlterTable
ALTER TABLE `products_general_retail` ADD COLUMN `purchase_price` DOUBLE NULL;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `purchase_price_snapshot` DOUBLE NULL;

-- AlterTable
ALTER TABLE `inventory_items` ADD COLUMN `purchase_price` DOUBLE NULL;

-- AlterTable
ALTER TABLE `stock_transactions` ADD COLUMN `purchase_price` DOUBLE NULL;
