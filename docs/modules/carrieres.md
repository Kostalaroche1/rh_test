# Carrieres

## But

Ce module gere la vue carriere autour des affectations :
- suivi des affectations
- decisions en attente
- proximite retraite

## Route montee principale
- `/dashboard/carrieres`

## Fichiers principaux
- `src/app/dashboard/carrieres/page.tsx`
- `src/components/dashboard/carrieres/composant.tsx`
- `src/app/api/carrieres/route.ts`
- `src/app/api/carrieres/agents/route.ts`
- `src/app/api/carrieres/retraite/proche/route.ts`
- `src/app/api/affectations/historique/route.ts`

## Permissions cles
- `affectation.read`
- `affectation.assign`
- `affectation.update`
- `agent.read`

## Caveat
Ce module est surtout une vue metier sur les affectations, pas un modele central autonome.
