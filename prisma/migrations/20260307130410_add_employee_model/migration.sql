/*
  Warnings:

  - You are about to drop the `operators` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `hm_records` ADD COLUMN `employeeId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `operators`;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `pin` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hm_records` ADD CONSTRAINT `hm_records_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
