-- AlterTable
ALTER TABLE `restaurants`
  ADD COLUMN `billing_cycle` ENUM('monthly', 'half_yearly', 'yearly') NULL,
  ADD COLUMN `subscription_expires_at` DATETIME(3) NULL;
