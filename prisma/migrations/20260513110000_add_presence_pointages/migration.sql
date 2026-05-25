CREATE TABLE `PresencePointage` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `presenceId` INT NOT NULL,
  `agentId` INT NOT NULL,
  `date` DATE NOT NULL,
  `type` ENUM('ARRIVEE', 'DEPART') NOT NULL,
  `heurePointage` DATETIME(3) NOT NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'BIOMETRIE',
  `note` VARCHAR(191) NULL,
  `createdById` INT NULL,
  `updatedById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),

  INDEX `PresencePointage_agentId_date_idx`(`agentId`, `date`),
  INDEX `PresencePointage_presenceId_idx`(`presenceId`),
  INDEX `PresencePointage_heurePointage_idx`(`heurePointage`),
  CONSTRAINT `PresencePointage_presenceId_fkey`
    FOREIGN KEY (`presenceId`) REFERENCES `Presence`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PresencePointage_agentId_fkey`
    FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PresencePointage_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `Utilisateur`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PresencePointage_updatedById_fkey`
    FOREIGN KEY (`updatedById`) REFERENCES `Utilisateur`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
