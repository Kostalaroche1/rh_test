# Notifications

## But

Ce module gere l'envoi et la lecture des notifications applicatives.

## Fichiers principaux
- `src/app/api/notification/route.ts`
- `src/server/services/notification.service.ts`
- `prisma/schema.prisma` (`Notification`)

## Modele actuel
Voie preferee :
- notification ciblee par `compteId`
- notification generale par lignes sans cible explicite

Compatibilite legacy encore presente :
- `roleId` pour lire d'anciennes notifications basees sur les roles

## Permissions cles
- `notification.read`
- `notification.create`
- `notification.update`
- `notification.delete`

## Caveat
`roleId` reste surtout pour compatibilite historique.
