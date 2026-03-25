-- CreateTable
CREATE TABLE `Province` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Province_code_key`(`code`),
    UNIQUE INDEX `Province_nom_key`(`nom`),
    INDEX `Province_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `UniteOrganisationnelle`
    ADD COLUMN `provinceId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Affectation`
    ADD COLUMN `provinceId` INTEGER NULL;

-- AlterTable
ALTER TABLE `ReglePorteeRole`
    MODIFY `portee` ENUM('SOI_MEME', 'UNITE', 'UNITE_ET_DESCENDANTS', 'PROVINCE', 'TOUTE_ORGANISATION') NOT NULL;

-- CreateIndex
CREATE INDEX `UniteOrganisationnelle_provinceId_idx` ON `UniteOrganisationnelle`(`provinceId`);

-- CreateIndex
CREATE INDEX `Affectation_provinceId_idx` ON `Affectation`(`provinceId`);

-- AddForeignKey
ALTER TABLE `UniteOrganisationnelle`
    ADD CONSTRAINT `UniteOrganisationnelle_provinceId_fkey`
    FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation`
    ADD CONSTRAINT `Affectation_provinceId_fkey`
    FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
