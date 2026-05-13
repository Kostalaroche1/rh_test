/*
  Warnings:

  - You are about to alter the column `photoPath` on the `biometricreference` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `biometricreference` MODIFY `angleCode` VARCHAR(191) NOT NULL,
    MODIFY `angleLabel` VARCHAR(191) NULL,
    MODIFY `photoPath` VARCHAR(191) NOT NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;
