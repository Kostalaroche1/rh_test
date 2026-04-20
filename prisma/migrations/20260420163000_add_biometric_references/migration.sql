CREATE TABLE `BiometricReference` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `agentId` INT NOT NULL,
  `angleCode` VARCHAR(32) NOT NULL,
  `angleLabel` VARCHAR(120) NULL,
  `photoPath` VARCHAR(255) NOT NULL,
  `descriptor` JSON NOT NULL,
  `actif` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),

  INDEX `BiometricReference_agentId_idx`(`agentId`),
  INDEX `BiometricReference_angleCode_idx`(`angleCode`),
  INDEX `BiometricReference_actif_idx`(`actif`),
  CONSTRAINT `BiometricReference_agentId_fkey`
    FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
