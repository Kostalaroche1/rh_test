# Employes

## But

Ce module couvre :
- les fiches agents
- les utilisateurs applicatifs
- la liaison compte <-> agent
- la fiche detail/parcours d'un agent

## Routes montees principales
- `/dashboard/agents`
- `/dashboard/agents/[id]`

## Fichiers principaux
- `src/app/dashboard/agents/page.tsx`
- `src/app/dashboard/agents/[id]/page.tsx`
- `src/components/dashboard/espaceTravail/EspaceEmployes.tsx`
- `src/components/dashboard/tabord/tables/tableUser.tsx`
- `src/components/dashboard/agent/fiches/AgentParcoursPage.tsx`
- `src/app/api/agent/route.ts`
- `src/app/api/utilisateur/route.ts`
- `src/app/api/utilisateur/utilisateur-role/route.ts`
- `src/app/api/agent/compte-utilisateur/route.ts`

## Permissions cles
- `agent.read/create/update/delete`
- `user.read/create/update/delete`

## Caveat
Ce module passe encore par certaines zones legacy (`tabord`, `agent`).
Il faut refactorer avec prudence.
