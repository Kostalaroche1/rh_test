-- CreateTable
CREATE TABLE `TypePlanification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `systeme` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TypePlanification_code_key`(`code`),
    INDEX `TypePlanification_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Planification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `typePlanificationId` INTEGER NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NULL,
    `statut` ENUM('BROUILLON', 'PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE', 'REPORTE') NOT NULL DEFAULT 'BROUILLON',
    `priorite` ENUM('FAIBLE', 'NORMALE', 'ELEVEE', 'CRITIQUE') NOT NULL DEFAULT 'NORMALE',
    `uniteOrganisationnelleId` INTEGER NULL,
    `creeParId` INTEGER NOT NULL,
    `assigneParId` INTEGER NULL,
    `valideParId` INTEGER NULL,
    `dateValidation` DATETIME(3) NULL,
    `demandeCongeId` INTEGER NULL,
    `affectationId` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Planification_typePlanificationId_idx`(`typePlanificationId`),
    INDEX `Planification_uniteOrganisationnelleId_idx`(`uniteOrganisationnelleId`),
    INDEX `Planification_creeParId_idx`(`creeParId`),
    INDEX `Planification_assigneParId_idx`(`assigneParId`),
    INDEX `Planification_valideParId_idx`(`valideParId`),
    INDEX `Planification_demandeCongeId_idx`(`demandeCongeId`),
    INDEX `Planification_affectationId_idx`(`affectationId`),
    INDEX `Planification_statut_idx`(`statut`),
    INDEX `Planification_dateDebut_dateFin_idx`(`dateDebut`, `dateFin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanificationParticipant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planificationId` INTEGER NOT NULL,
    `agentId` INTEGER NOT NULL,
    `roleDansPlan` ENUM('BENEFICIAIRE', 'RESPONSABLE', 'SUPERVISEUR', 'INTERVENANT') NOT NULL DEFAULT 'BENEFICIAIRE',
    `obligatoire` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PlanificationParticipant_planificationId_agentId_key`(`planificationId`, `agentId`),
    INDEX `PlanificationParticipant_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RappelPlanification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planificationId` INTEGER NOT NULL,
    `dateRappel` DATETIME(3) NOT NULL,
    `canal` ENUM('APP', 'EMAIL', 'SMS') NOT NULL DEFAULT 'APP',
    `message` VARCHAR(191) NULL,
    `envoye` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RappelPlanification_planificationId_idx`(`planificationId`),
    INDEX `RappelPlanification_dateRappel_envoye_idx`(`dateRappel`, `envoye`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Planification`
    ADD CONSTRAINT `Planification_typePlanificationId_fkey`
    FOREIGN KEY (`typePlanificationId`) REFERENCES `TypePlanification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planification`
    ADD CONSTRAINT `Planification_uniteOrganisationnelleId_fkey`
    FOREIGN KEY (`uniteOrganisationnelleId`) REFERENCES `UniteOrganisationnelle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planification`
    ADD CONSTRAINT `Planification_creeParId_fkey`
    FOREIGN KEY (`creeParId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planification`
    ADD CONSTRAINT `Planification_assigneParId_fkey`
    FOREIGN KEY (`assigneParId`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planification`
    ADD CONSTRAINT `Planification_valideParId_fkey`
    FOREIGN KEY (`valideParId`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planification`
    ADD CONSTRAINT `Planification_demandeCongeId_fkey`
    FOREIGN KEY (`demandeCongeId`) REFERENCES `DemandeConge`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planification`
    ADD CONSTRAINT `Planification_affectationId_fkey`
    FOREIGN KEY (`affectationId`) REFERENCES `Affectation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanificationParticipant`
    ADD CONSTRAINT `PlanificationParticipant_planificationId_fkey`
    FOREIGN KEY (`planificationId`) REFERENCES `Planification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanificationParticipant`
    ADD CONSTRAINT `PlanificationParticipant_agentId_fkey`
    FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RappelPlanification`
    ADD CONSTRAINT `RappelPlanification_planificationId_fkey`
    FOREIGN KEY (`planificationId`) REFERENCES `Planification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
