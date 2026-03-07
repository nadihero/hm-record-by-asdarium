/*
  Warnings:

  - You are about to drop the column `hmAkhir` on the `hm_records` table. All the data in the column will be lost.
  - You are about to drop the column `hmAwal` on the `hm_records` table. All the data in the column will be lost.
  - You are about to drop the column `namaOperator` on the `hm_records` table. All the data in the column will be lost.
  - You are about to drop the column `totalJam` on the `hm_records` table. All the data in the column will be lost.
  - You are about to drop the column `unitAlat` on the `hm_records` table. All the data in the column will be lost.
  - Added the required column `totalHM` to the `hm_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `hm_records` DROP COLUMN `hmAkhir`,
    DROP COLUMN `hmAwal`,
    DROP COLUMN `namaOperator`,
    DROP COLUMN `totalJam`,
    DROP COLUMN `unitAlat`,
    ADD COLUMN `totalHM` DOUBLE NOT NULL;
