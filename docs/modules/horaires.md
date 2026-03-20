# Horaires

## But

Ce module gere :
- les modeles d'horaires de travail
- l'attribution d'un horaire a un agent

## Zone visible principale
Le module est surtout expose dans l'espace admin/agents et non via une page dashboard dediee.

## Fichiers principaux
- `src/components/dashboard/horaires/TableauHorairesTravail.tsx`
- `src/components/dashboard/horaires/TableauHorairesEmploye.tsx`
- `src/app/api/agent/horaireTravail/route.ts`
- `src/app/api/agent/horaireAgent/route.ts`
- `src/app/action/horaireTravail/action.ts`
- `src/app/action/horaireAgent/action.ts`

## Permissions cles
### Horaires standard
- `horaire_travail.read/create/update/delete`

### Horaires agent
- `horaire_agent.read`
- `horaire_agent.update`
- `horaire_agent.delete`
- `horaire_agent.assign`

## Decision importante
`horaire_agent.create` a ete retiree du modele actif.
L'action metier correcte est `horaire_agent.assign`.
