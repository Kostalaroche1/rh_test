# Paie

## But

Ce module gere :
- la creation des paies
- la modification et suppression
- la lecture et consultation
- la publication
- les primes via `Prime`

## Route montee principale
- `/dashboard/paie`

## Fichiers principaux
- `src/app/dashboard/paie/page.tsx`
- `src/components/dashboard/paie/composant.tsx`
- `src/components/dashboard/paie/bulletinPdf.tsx`
- `src/components/dashboard/paie/chartPaie.tsx`
- `src/app/api/paie/route.ts`
- `src/app/api/paie/getPaiesByAgent/route.ts`
- `src/app/api/paie/prime/route.ts`

## Permissions cles
- `paie.read`
- `paie.create`
- `paie.update`
- `paie.delete`
- `paie.publish`

## Decision importante
`paie.publish` reste distinct de `paie.create` car publier une paie n'est pas la meme action que la preparer.
