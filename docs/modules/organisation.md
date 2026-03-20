# Organisation

## But

Ce module gere la structure dynamique de l'entreprise :
- types d'unite
- unites organisationnelles
- postes
- fonctions
- grades
- affectations

## Route montee principale
- `/dashboard/organisation`

## Fichiers principaux
- `src/app/dashboard/organisation/page.tsx`
- `src/components/dashboard/organisation/composant.tsx`
- `src/app/api/type-unites-organisationnelles/route.ts`
- `src/app/api/unites-organisationnelles/route.ts`
- `src/app/api/postes/route.ts`
- `src/app/api/fonctions/route.ts`
- `src/app/api/grades/route.ts`
- `src/app/api/affectations/route.ts`

## Permissions cles
- `type_unite_organisationnelle.read/create/update/delete`
- `unite_organisationnelle.read/create/update/delete`
- `poste.read/create/update/delete`
- `fonction.read/create/update/delete`
- `grade.read/create/update/delete`
- `affectation.read/update/delete`
- `affectation.assign`

## Decision importante
`affectation.assign` est la permission metier de creation d'affectation.
`affectation.create` a ete retiree du modele actif.
