/*
  Warnings:

  - You are about to drop the column `provinceId` on the `affectation` table. All the data in the column will be lost.
  - You are about to drop the column `uniteOrganisationnelleId` on the `affectation` table. All the data in the column will be lost.
  - You are about to drop the column `provinceId` on the `uniteorganisationnelle` table. All the data in the column will be lost.
  - You are about to drop the column `typeUniteId` on the `uniteorganisationnelle` table. All the data in the column will be lost.
  - Added the required column `typeOrgaUniteProvinceId` to the `Affectation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `affectation` DROP FOREIGN KEY `Affectation_provinceId_fkey`;

-- DropForeignKey
ALTER TABLE `affectation` DROP FOREIGN KEY `Affectation_uniteOrganisationnelleId_fkey`;

-- DropForeignKey
ALTER TABLE `uniteorganisationnelle` DROP FOREIGN KEY `UniteOrganisationnelle_provinceId_fkey`;

-- DropForeignKey
ALTER TABLE `uniteorganisationnelle` DROP FOREIGN KEY `UniteOrganisationnelle_typeUniteId_fkey`;

-- DropIndex
DROP INDEX `Affectation_provinceId_idx` ON `affectation`;

-- DropIndex
DROP INDEX `Affectation_uniteOrganisationnelleId_idx` ON `affectation`;

-- DropIndex
DROP INDEX `UniteOrganisationnelle_provinceId_idx` ON `uniteorganisationnelle`;

-- DropIndex
DROP INDEX `UniteOrganisationnelle_typeUniteId_idx` ON `uniteorganisationnelle`;

-- AlterTable
ALTER TABLE `affectation` DROP COLUMN `provinceId`,
    DROP COLUMN `uniteOrganisationnelleId`,
    ADD COLUMN `affectationOrigineId` INTEGER NULL,
    ADD COLUMN `typeOrgaUniteProvinceId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `typeuniteorganisationnelle` ADD COLUMN `parentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `uniteorganisationnelle` DROP COLUMN `provinceId`,
    DROP COLUMN `typeUniteId`;

-- CreateTable
CREATE TABLE `TYP_ORGA_UNI_PROV` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `typeUniteId` INTEGER NOT NULL,
    `uniteOrganisationnelleId` INTEGER NULL,
    `provinceId` INTEGER NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TYP_ORGA_UNI_PROV_typeUniteId_idx`(`typeUniteId`),
    INDEX `TYP_ORGA_UNI_PROV_uniteOrganisationnelleId_idx`(`uniteOrganisationnelleId`),
    INDEX `TYP_ORGA_UNI_PROV_provinceId_idx`(`provinceId`),
    INDEX `TYP_ORGA_UNI_PROV_actif_idx`(`actif`),
    UNIQUE INDEX `TYP_ORGA_UNI_PROV_typeUniteId_uniteOrganisationnelleId_provi_key`(`typeUniteId`, `uniteOrganisationnelleId`, `provinceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Affectation_typeOrgaUniteProvinceId_idx` ON `Affectation`(`typeOrgaUniteProvinceId`);

-- CreateIndex
CREATE INDEX `Affectation_affectationOrigineId_idx` ON `Affectation`(`affectationOrigineId`);

-- CreateIndex
CREATE INDEX `TypeUniteOrganisationnelle_parentId_idx` ON `TypeUniteOrganisationnelle`(`parentId`);

-- AddForeignKey
ALTER TABLE `TypeUniteOrganisationnelle` ADD CONSTRAINT `TypeUniteOrganisationnelle_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `TypeUniteOrganisationnelle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TYP_ORGA_UNI_PROV` ADD CONSTRAINT `TYP_ORGA_UNI_PROV_typeUniteId_fkey` FOREIGN KEY (`typeUniteId`) REFERENCES `TypeUniteOrganisationnelle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TYP_ORGA_UNI_PROV` ADD CONSTRAINT `TYP_ORGA_UNI_PROV_uniteOrganisationnelleId_fkey` FOREIGN KEY (`uniteOrganisationnelleId`) REFERENCES `UniteOrganisationnelle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TYP_ORGA_UNI_PROV` ADD CONSTRAINT `TYP_ORGA_UNI_PROV_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_typeOrgaUniteProvinceId_fkey` FOREIGN KEY (`typeOrgaUniteProvinceId`) REFERENCES `TYP_ORGA_UNI_PROV`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_affectationOrigineId_fkey` FOREIGN KEY (`affectationOrigineId`) REFERENCES `Affectation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
