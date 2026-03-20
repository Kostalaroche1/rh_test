# Conges

## But

Ce module gere :
- les types de conge
- les demandes personnelles
- la confirmation
- la validation
- les vues de revue et de suivi

## Route montee principale
- `/dashboard/conges`

## Fichiers principaux
- `src/app/dashboard/conges/page.tsx`
- `src/components/dashboard/conges/PageGestionConges.tsx`
- `src/components/dashboard/conges/VueDemandesCongePersonnelles.tsx`
- `src/components/dashboard/conges/RevueDemandesCongeUnite.tsx`
- `src/components/dashboard/conges/RevueValidationDemandesConge.tsx`
- `src/components/dashboard/conges/SelectionTypeConge.tsx`
- `src/components/dashboard/conges/TableauTypeConge.tsx`
- `src/app/api/agent/conge/route.ts`
- `src/app/api/agent/conge/demande/route.ts`
- `src/app/api/agent/conge/demande/all/route.ts`

## Permissions cles
### Types de conge
- `type_conge.read/create/update/delete`

### Workflow de conge
- `demande_conge.read`
- `demande_conge.update`
- `demande_conge.delete`
- `demande_conge.request`
- `demande_conge.confirm`
- `demande_conge.validate`

## Decision importante
`demande_conge.create` a ete retiree du modele actif.
L'action metier correcte est `demande_conge.request`.
