-- CreateTable
CREATE TABLE `absensi_records` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `tanggal` DATE NOT NULL,
    `jamMasuk` VARCHAR(5) NULL,
    `jamPulang` VARCHAR(5) NULL,
    `status` VARCHAR(10) NOT NULL,
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `absensi_records_employeeId_tanggal_key`(`employeeId`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `absensi_records` ADD CONSTRAINT `absensi_records_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
