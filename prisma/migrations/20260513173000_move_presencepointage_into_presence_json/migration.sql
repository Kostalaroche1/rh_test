ALTER TABLE `Presence`
  ADD COLUMN `journalPointages` JSON NULL;

SET SESSION group_concat_max_len = 1024 * 1024;

UPDATE `Presence` p
LEFT JOIN (
  SELECT
    pp.`presenceId`,
    CONCAT(
      '[',
      GROUP_CONCAT(
        JSON_OBJECT(
          'id', CAST(pp.`id` AS CHAR),
          'type', pp.`type`,
          'heurePointage', CONCAT(DATE_FORMAT(pp.`heurePointage`, '%Y-%m-%dT%H:%i:%s'), '.000Z'),
          'source', pp.`source`,
          'note', pp.`note`,
          'createdById', pp.`createdById`,
          'updatedById', pp.`updatedById`,
          'createdAt', CONCAT(DATE_FORMAT(pp.`createdAt`, '%Y-%m-%dT%H:%i:%s'), '.000Z'),
          'updatedAt', CONCAT(DATE_FORMAT(pp.`updatedAt`, '%Y-%m-%dT%H:%i:%s'), '.000Z')
        )
        ORDER BY pp.`heurePointage`, pp.`id` SEPARATOR ','
      ),
      ']'
    ) AS journal
  FROM `PresencePointage` pp
  GROUP BY pp.`presenceId`
) aggregated ON aggregated.`presenceId` = p.`id`
SET p.`journalPointages` = COALESCE(aggregated.journal, '[]');

UPDATE `Presence` p
LEFT JOIN (
  SELECT `presenceId`, MIN(`heurePointage`) AS firstArrivee
  FROM `PresencePointage`
  WHERE `type` = 'ARRIVEE'
  GROUP BY `presenceId`
) arr ON arr.`presenceId` = p.`id`
LEFT JOIN (
  SELECT `presenceId`, MAX(`heurePointage`) AS lastDepart
  FROM `PresencePointage`
  WHERE `type` = 'DEPART'
  GROUP BY `presenceId`
) dep ON dep.`presenceId` = p.`id`
SET
  p.`heureArrivee` = COALESCE(arr.firstArrivee, p.`heureArrivee`),
  p.`heureDepart` = COALESCE(dep.lastDepart, p.`heureDepart`);

DROP TABLE `PresencePointage`;
