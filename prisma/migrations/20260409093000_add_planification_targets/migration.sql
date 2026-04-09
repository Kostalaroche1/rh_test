-- AlterTable
ALTER TABLE `Planification`
  ADD COLUMN `cible` ENUM('INDIVIDUEL', 'UNITE', 'PROVINCE', 'TOUTE_ORGANISATION') NOT NULL DEFAULT 'INDIVIDUEL',
  ADD COLUMN `provinceId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Planification_cible_idx` ON `Planification`(`cible`);

-- CreateIndex
CREATE INDEX `Planification_provinceId_idx` ON `Planification`(`provinceId`);

-- AddForeignKey
ALTER TABLE `Planification`
  ADD CONSTRAINT `Planification_provinceId_fkey`
  FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
