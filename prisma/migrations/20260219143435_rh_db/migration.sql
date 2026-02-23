-- CreateTable
CREATE TABLE `Utilisateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `login` VARCHAR(191) NOT NULL,
    `motDePasse` VARCHAR(191) NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Utilisateur_login_key`(`login`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NULL,
    `nom` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Role_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UtilisateurRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateurId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `dateAttribution` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `attribuePar` INTEGER NOT NULL,

    UNIQUE INDEX `UtilisateurRole_utilisateurId_roleId_key`(`utilisateurId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matricule` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `genre` VARCHAR(191) NULL,
    `photo` VARCHAR(191) NULL DEFAULT '',
    `datenais` DATETIME(3) NULL,
    `statut` VARCHAR(191) NOT NULL,
    `dateEntree` DATETIME(3) NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Agent_matricule_key`(`matricule`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompteAgent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `utilisateurId` INTEGER NOT NULL,
    `dateLiaison` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `liePar` INTEGER NOT NULL,

    UNIQUE INDEX `CompteAgent_agentId_key`(`agentId`),
    UNIQUE INDEX `CompteAgent_utilisateurId_key`(`utilisateurId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoriqueAgent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `champ` VARCHAR(191) NOT NULL,
    `ancienneValeur` VARCHAR(191) NULL,
    `nouvelleValeur` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Direction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Direction_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Departement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `directionId` INTEGER NOT NULL,

    UNIQUE INDEX `Departement_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Site` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `adresse` VARCHAR(191) NOT NULL,
    `ville` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteDepartement` (
    `siteId` INTEGER NOT NULL,
    `departementId` INTEGER NOT NULL,

    PRIMARY KEY (`siteId`, `departementId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Poste` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `departementId` INTEGER NOT NULL,

    UNIQUE INDEX `Poste_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fonction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `posteId` INTEGER NULL,

    UNIQUE INDEX `Fonction_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `indiceSalarial` INTEGER NOT NULL,

    UNIQUE INDEX `Grade_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Affectation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `posteId` INTEGER NOT NULL,
    `fonctionId` INTEGER NULL,
    `gradeId` INTEGER NOT NULL,
    `departementId` INTEGER NOT NULL,
    `directionId` INTEGER NOT NULL,
    `siteId` INTEGER NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NULL,
    `statut` ENUM('EN_ATTENTE', 'CONFIRME', 'VALIDE', 'REJETE') NULL DEFAULT 'EN_ATTENTE',
    `motif` VARCHAR(191) NULL,
    `typeContrat` ENUM('CDI', 'CDD', 'STAGE', 'CONSULTANT', 'INTERIM', 'PRESTATION') NULL,
    `statutContrat` ENUM('ACTIF', 'TERMINE', 'SUSPENDU', 'RESILIE') NULL,
    `type` ENUM('PROMOTION', 'MUTATION', 'NOMINATION', 'AFFECTATION', 'INTERIM', 'REINTEGRATION', 'DETACHEMENT', 'MONTEE_GRADE', 'RETROGRADATION') NULL DEFAULT 'AFFECTATION',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoriqueAffectation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affectationId` INTEGER NOT NULL,
    `dateChangement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ancienPoste` VARCHAR(191) NULL,
    `nouveauPoste` VARCHAR(191) NULL,
    `ancienGrade` VARCHAR(191) NULL,
    `nouveauGrade` VARCHAR(191) NULL,
    `motif` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paie` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `datePaiement` DATETIME(3) NULL,
    `salaireBase` DECIMAL(65, 30) NOT NULL,
    `brut` DECIMAL(65, 30) NOT NULL,
    `net` DECIMAL(65, 30) NOT NULL,
    `etat` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prime` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paieId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `montant` DECIMAL(65, 30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `compteId` INTEGER NULL,
    `dateEnvoi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `titre` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `roleId` INTEGER NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'NON_LU',
    `expedider` VARCHAR(191) NOT NULL DEFAULT 'NON',
    `icon` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rapport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `compteId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `Libelle` VARCHAR(191) NULL,
    `periodeDebut` DATETIME(3) NOT NULL,
    `periodeFin` DATETIME(3) NOT NULL,
    `dateGeneration` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fichierPath` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TypeConge` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `dureeMax` INTEGER NOT NULL,
    `allocationConge` DOUBLE NOT NULL DEFAULT 0,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createurId` INTEGER NOT NULL,

    UNIQUE INDEX `TypeConge_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DemandeConge` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `typeCongeId` INTEGER NOT NULL,
    `dateDemande` DATETIME(3) NOT NULL,
    `dateDebut` DATETIME(3) NULL,
    `dateFin` DATETIME(3) NULL,
    `motif` VARCHAR(191) NULL,
    `statut` ENUM('EN_ATTENTE', 'CONFIRME', 'VALIDE', 'REJETE') NOT NULL DEFAULT 'EN_ATTENTE',
    `statusAllocation` BOOLEAN NOT NULL DEFAULT true,
    `dateValidation` DATETIME(3) NULL,
    `confirmePar` INTEGER NULL,
    `validePar` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Presence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `heureArrivee` DATETIME(3) NULL,
    `heureDepart` DATETIME(3) NULL,
    `statut` ENUM('BROUILLON', 'PRESENT', 'ABSENT', 'RETARD') NOT NULL DEFAULT 'BROUILLON',
    `confirmeParId` INTEGER NULL,
    `valideParId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Presence_agentId_date_key`(`agentId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UtilisateurRole` ADD CONSTRAINT `UtilisateurRole_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UtilisateurRole` ADD CONSTRAINT `UtilisateurRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompteAgent` ADD CONSTRAINT `CompteAgent_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompteAgent` ADD CONSTRAINT `CompteAgent_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistoriqueAgent` ADD CONSTRAINT `HistoriqueAgent_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Departement` ADD CONSTRAINT `Departement_directionId_fkey` FOREIGN KEY (`directionId`) REFERENCES `Direction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteDepartement` ADD CONSTRAINT `SiteDepartement_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteDepartement` ADD CONSTRAINT `SiteDepartement_departementId_fkey` FOREIGN KEY (`departementId`) REFERENCES `Departement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Poste` ADD CONSTRAINT `Poste_departementId_fkey` FOREIGN KEY (`departementId`) REFERENCES `Departement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fonction` ADD CONSTRAINT `Fonction_posteId_fkey` FOREIGN KEY (`posteId`) REFERENCES `Poste`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_posteId_fkey` FOREIGN KEY (`posteId`) REFERENCES `Poste`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_fonctionId_fkey` FOREIGN KEY (`fonctionId`) REFERENCES `Fonction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `Grade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_departementId_fkey` FOREIGN KEY (`departementId`) REFERENCES `Departement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_directionId_fkey` FOREIGN KEY (`directionId`) REFERENCES `Direction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistoriqueAffectation` ADD CONSTRAINT `HistoriqueAffectation_affectationId_fkey` FOREIGN KEY (`affectationId`) REFERENCES `Affectation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paie` ADD CONSTRAINT `Paie_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prime` ADD CONSTRAINT `Prime_paieId_fkey` FOREIGN KEY (`paieId`) REFERENCES `Paie`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `CompteAgent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rapport` ADD CONSTRAINT `Rapport_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `CompteAgent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TypeConge` ADD CONSTRAINT `TypeConge_createurId_fkey` FOREIGN KEY (`createurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DemandeConge` ADD CONSTRAINT `DemandeConge_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DemandeConge` ADD CONSTRAINT `DemandeConge_typeCongeId_fkey` FOREIGN KEY (`typeCongeId`) REFERENCES `TypeConge`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DemandeConge` ADD CONSTRAINT `DemandeConge_confirmePar_fkey` FOREIGN KEY (`confirmePar`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DemandeConge` ADD CONSTRAINT `DemandeConge_validePar_fkey` FOREIGN KEY (`validePar`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Presence` ADD CONSTRAINT `Presence_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Presence` ADD CONSTRAINT `Presence_confirmeParId_fkey` FOREIGN KEY (`confirmeParId`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Presence` ADD CONSTRAINT `Presence_valideParId_fkey` FOREIGN KEY (`valideParId`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
