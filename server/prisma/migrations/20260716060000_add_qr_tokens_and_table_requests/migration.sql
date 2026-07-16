-- AlterTable
-- qr_token is @unique, so existing rows can't share a single literal default;
-- add it nullable, backfill each row with a distinct value, then tighten it.
ALTER TABLE `dining_tables` ADD COLUMN `qr_token` VARCHAR(191) NULL;

UPDATE `dining_tables` SET `qr_token` = UUID() WHERE `qr_token` IS NULL;

ALTER TABLE `dining_tables` MODIFY COLUMN `qr_token` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `dining_tables_qr_token_key` ON `dining_tables`(`qr_token`);

-- CreateTable
CREATE TABLE `table_order_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `restaurant_id` INTEGER NOT NULL,
    `table_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `item_name_snapshot` VARCHAR(191) NOT NULL,
    `unit_price` DOUBLE NOT NULL,
    `tax_percent` DOUBLE NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `notes` VARCHAR(191) NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `table_order_requests_table_id_idx`(`table_id`),
    INDEX `table_order_requests_restaurant_id_status_idx`(`restaurant_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `table_order_requests` ADD CONSTRAINT `table_order_requests_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_order_requests` ADD CONSTRAINT `table_order_requests_table_id_fkey` FOREIGN KEY (`table_id`) REFERENCES `dining_tables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
