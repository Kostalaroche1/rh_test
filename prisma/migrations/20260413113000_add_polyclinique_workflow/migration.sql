-- CreateTable
CREATE TABLE `DemandeSoinPolyclinique` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `dateDemande` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motif` VARCHAR(191) NOT NULL,
    `symptomes` TEXT NULL,
    `statut` ENUM('EN_ATTENTE', 'VALIDEE_DRH', 'REJETEE_DRH', 'DOSSIER_ETABLI') NOT NULL DEFAULT 'EN_ATTENTE',
    `commentaireDecision` TEXT NULL,
    `dateDecision` DATETIME(3) NULL,
    `valideParId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DemandeSoinPolyclinique_agentId_idx`(`agentId`),
    INDEX `DemandeSoinPolyclinique_statut_idx`(`statut`),
    INDEX `DemandeSoinPolyclinique_dateDemande_idx`(`dateDemande`),
    INDEX `DemandeSoinPolyclinique_valideParId_idx`(`valideParId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DossierMedicalPolyclinique` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `demandeSoinId` INTEGER NOT NULL,
    `agentId` INTEGER NOT NULL,
    `medecinUtilisateurId` INTEGER NOT NULL,
    `resumeTraitements` TEXT NOT NULL,
    `traitementsSuivis` TEXT NULL,
    `observations` TEXT NULL,
    `fichierPath` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DossierMedicalPolyclinique_demandeSoinId_key`(`demandeSoinId`),
    INDEX `DossierMedicalPolyclinique_agentId_idx`(`agentId`),
    INDEX `DossierMedicalPolyclinique_medecinUtilisateurId_idx`(`medecinUtilisateurId`),
    INDEX `DossierMedicalPolyclinique_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DemandeSoinPolyclinique`
    ADD CONSTRAINT `DemandeSoinPolyclinique_agentId_fkey`
    FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DemandeSoinPolyclinique`
    ADD CONSTRAINT `DemandeSoinPolyclinique_valideParId_fkey`
    FOREIGN KEY (`valideParId`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DossierMedicalPolyclinique`
    ADD CONSTRAINT `DossierMedicalPolyclinique_demandeSoinId_fkey`
    FOREIGN KEY (`demandeSoinId`) REFERENCES `DemandeSoinPolyclinique`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DossierMedicalPolyclinique`
    ADD CONSTRAINT `DossierMedicalPolyclinique_agentId_fkey`
    FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DossierMedicalPolyclinique`
    ADD CONSTRAINT `DossierMedicalPolyclinique_medecinUtilisateurId_fkey`
    FOREIGN KEY (`medecinUtilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
