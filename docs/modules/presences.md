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
- `/pointage/biometrique` (route dediee hors dashboard pour la reconnaissance faciale)

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
- `src/app/pointage/biometrique/page.tsx`
- `src/app/api/biometrie/references/route.ts`
- `src/app/api/biometrie/pointer/route.ts`

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

## Pointage biometrique (face-api.js)
- Le module charge les photos profil agents comme references de reconnaissance.
- Les visages sont detectes sur la camera en temps reel (`video` + `canvas`).
- En cas de reconnaissance stable (plusieurs frames), le pointage arrivee est soumis en asynchrone via `/api/biometrie/pointer`.

### Prerequis modeles
Les modeles face-api.js doivent etre poses dans:
- `public/models/face-api`

Fichiers attendus:
- `tiny_face_detector_model-weights_manifest.json` + shards
- `face_landmark_68_model-weights_manifest.json` + shards
- `face_recognition_model-weights_manifest.json` + shards
