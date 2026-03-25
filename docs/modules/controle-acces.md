# Controle d'acces

## But

Ce module gere :
- les roles
- le catalogue de permissions
- l'attribution des permissions aux roles
- la portee de chaque permission attribuee

## Route montee principale
- `/dashboard/access`

## Fichiers principaux
- `src/app/dashboard/access/page.tsx`
- `src/components/dashboard/acces/PageControleAcces.tsx`
- `src/components/dashboard/acces/MatricePermissions.tsx`
- `src/components/dashboard/acces/GestionnairePermissions.tsx`
- `src/app/api/agent/role/route.ts`
- `src/app/api/agent/role-permission/route.ts`
- `src/app/api/agent/role-permission/bootstrap/route.ts`
- `src/app/api/agent/permission/bootstrap/route.ts`
- `src/server/access/permission-catalog.ts`
- `src/server/access/scope.ts`

## Permissions cles
- `role.read/create/update/delete`
- `permission.read/create/update/delete`
- `regle_portee_role.read/create/update/delete`

## Regles importantes
- le nom du role ne doit pas piloter l'autorisation
- la portee doit etre choisie explicitement
- `seed.js` ne doit pas creer les roles metier de l'entreprise
