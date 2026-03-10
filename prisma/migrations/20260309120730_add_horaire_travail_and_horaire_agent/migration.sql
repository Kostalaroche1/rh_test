-- CreateTable
CREATE TABLE `HoraireTravail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomHoraire` VARCHAR(191) NOT NULL,
    `heureDebut` TIME NOT NULL,
    `heureFin` TIME NOT NULL,
    `creerParId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HoraireAgent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `horaireId` INTEGER NOT NULL,
    `dateDebut` DATE NOT NULL,
    `dateFin` DATE NULL,
    `creerParId` INTEGER NOT NULL,
    `lundi` BOOLEAN NOT NULL DEFAULT false,
    `mardi` BOOLEAN NOT NULL DEFAULT false,
    `mercredi` BOOLEAN NOT NULL DEFAULT false,
    `jeudi` BOOLEAN NOT NULL DEFAULT false,
    `vendredi` BOOLEAN NOT NULL DEFAULT false,
    `samedi` BOOLEAN NOT NULL DEFAULT false,
    `dimanche` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HoraireAgent_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HoraireTravail` ADD CONSTRAINT `HoraireTravail_creerParId_fkey` FOREIGN KEY (`creerParId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HoraireAgent` ADD CONSTRAINT `HoraireAgent_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HoraireAgent` ADD CONSTRAINT `HoraireAgent_horaireId_fkey` FOREIGN KEY (`horaireId`) REFERENCES `HoraireTravail`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HoraireAgent` ADD CONSTRAINT `HoraireAgent_creerParId_fkey` FOREIGN KEY (`creerParId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
