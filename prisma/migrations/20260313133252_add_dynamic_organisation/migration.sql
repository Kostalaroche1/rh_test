/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Permisions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `affectation` ADD COLUMN `actif` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `principale` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `statutOrganisationnel` ENUM('ACTIVE', 'SUSPENDUE', 'TERMINEE') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `uniteOrganisationnelleId` INTEGER NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `permisions` ADD COLUMN `actif` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `libelle` VARCHAR(191) NULL,
    ADD COLUMN `module` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `poste` ADD COLUMN `actif` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `uniteOrganisationnelleId` INTEGER NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `role` ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `rolepermission` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `TypeUniteOrganisationnelle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `systeme` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TypeUniteOrganisationnelle_code_key`(`code`),
    INDEX `TypeUniteOrganisationnelle_actif_idx`(`actif`),
    INDEX `TypeUniteOrganisationnelle_ordre_idx`(`ordre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniteOrganisationnelle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `typeUniteId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `chemin` VARCHAR(191) NULL,
    `niveau` INTEGER NOT NULL DEFAULT 0,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UniteOrganisationnelle_code_key`(`code`),
    INDEX `UniteOrganisationnelle_typeUniteId_idx`(`typeUniteId`),
    INDEX `UniteOrganisationnelle_parentId_idx`(`parentId`),
    INDEX `UniteOrganisationnelle_actif_idx`(`actif`),
    INDEX `UniteOrganisationnelle_chemin_idx`(`chemin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReglePorteeRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `portee` ENUM('SOI_MEME', 'UNITE', 'UNITE_ET_DESCENDANTS', 'TOUTE_ORGANISATION') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReglePorteeRole_permissionId_idx`(`permissionId`),
    INDEX `ReglePorteeRole_portee_idx`(`portee`),
    UNIQUE INDEX `ReglePorteeRole_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Affectation_uniteOrganisationnelleId_idx` ON `Affectation`(`uniteOrganisationnelleId`);

-- CreateIndex
CREATE INDEX `Affectation_actif_principale_idx` ON `Affectation`(`actif`, `principale`);

-- CreateIndex
CREATE INDEX `Affectation_dateDebut_dateFin_idx` ON `Affectation`(`dateDebut`, `dateFin`);

-- CreateIndex
CREATE UNIQUE INDEX `Permisions_code_key` ON `Permisions`(`code`);

-- CreateIndex
CREATE INDEX `Permisions_module_idx` ON `Permisions`(`module`);

-- CreateIndex
CREATE INDEX `Permisions_actif_idx` ON `Permisions`(`actif`);

-- CreateIndex
CREATE INDEX `Poste_uniteOrganisationnelleId_idx` ON `Poste`(`uniteOrganisationnelleId`);

-- CreateIndex
CREATE INDEX `Poste_actif_idx` ON `Poste`(`actif`);

-- CreateIndex
CREATE UNIQUE INDEX `Role_code_key` ON `Role`(`code`);

-- CreateIndex
CREATE INDEX `Role_actif_idx` ON `Role`(`actif`);

-- AddForeignKey
ALTER TABLE `Poste` ADD CONSTRAINT `Poste_uniteOrganisationnelleId_fkey` FOREIGN KEY (`uniteOrganisationnelleId`) REFERENCES `UniteOrganisationnelle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UniteOrganisationnelle` ADD CONSTRAINT `UniteOrganisationnelle_typeUniteId_fkey` FOREIGN KEY (`typeUniteId`) REFERENCES `TypeUniteOrganisationnelle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UniteOrganisationnelle` ADD CONSTRAINT `UniteOrganisationnelle_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `UniteOrganisationnelle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_uniteOrganisationnelleId_fkey` FOREIGN KEY (`uniteOrganisationnelleId`) REFERENCES `UniteOrganisationnelle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReglePorteeRole` ADD CONSTRAINT `ReglePorteeRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReglePorteeRole` ADD CONSTRAINT `ReglePorteeRole_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permisions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `rolepermission` RENAME INDEX `RolePermission_permissionId_fkey` TO `RolePermission_permissionId_idx`;
