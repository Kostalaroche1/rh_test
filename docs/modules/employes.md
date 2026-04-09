# Employes

## But

Ce module couvre :
- les fiches agents
- les utilisateurs applicatifs
- la liaison compte <-> agent
- la fiche detail/parcours d'un agent
- la photo de profil agent (upload dans un dossier stable)

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
- `src/app/api/agent/photo/route.ts`
- `src/app/api/utilisateur/route.ts`
- `src/app/api/utilisateur/utilisateur-role/route.ts`
- `src/app/api/agent/compte-utilisateur/route.ts`

## Permissions cles
- `agent.read/create/update/delete`
- `user.read/create/update/delete`

## Caveat
Ce module passe encore par certaines zones legacy (`tabord`, `agent`).
Il faut refactorer avec prudence.

## Convention photo profil agent
- chemin en base: `dossier/nom-image.ext` (relatif)
- stockage fichier: `public/agent-photos/<dossier>/`
- dossier genere une seule fois: `<idAgentCrypte>-<nom-initial>`
- si le nom de l'agent change plus tard, le dossier ne change pas
- nom du fichier: `<nom-agent>-<date>.ext`
- compression navigateur avant upload: `browser-image-compression` (fallback auto sur fichier original en cas d'erreur)
