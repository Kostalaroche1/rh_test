# Presences

## But

Ce module gere :
- le pointage
- la confirmation
- la validation
- la generation automatique des statuts journaliers
- les vues de suivi des presences

## Route montee principale
- `/dashboard/presenceAbsence`

## Fichiers principaux
- `src/app/dashboard/presenceAbsence/page.tsx`
- `src/components/dashboard/AbscencePresence/composant.tsx`
- `src/components/dashboard/presences/VuePresencePersonnelle.tsx`
- `src/components/dashboard/presences/RevuePresencesUnite.tsx`
- `src/components/dashboard/presences/RevueValidationPresences.tsx`
- `src/components/dashboard/presences/VueEnsemblePresences.tsx`
- `src/app/api/agent/presence/route.ts`
- `src/app/api/agent/presence/today/route.ts`
- `src/app/api/agent/presence/admin/route.ts`

## Regle metier importante
Le modele separe :
- `statut` : resultat metier (`PRESENCE`, `RETARD`, `ABSENT`, `CONGE`, `OFF`, ...)
- `statutWorkflow` : etat du workflow (`BROUILLON`, `CONFIRME`, `VALIDE`)

## Permissions cles
- `presence.read`
- `presence.update`
- `presence.delete`
- `presence.sign`
- `presence.confirm`
- `presence.validate`

## Decision importante
`presence.signal_absence` a ete retiree du modele actif.
Les absences normales sont determinees automatiquement.
