# Guide de maintenance

## 1. Routine recommandee

Quand une modification est necessaire :
1. identifier la route montee et le vrai composant actif
2. decider si le changement concerne l'UI, l'API, l'acces ou le schema
3. verifier le modele Prisma si la logique depend des donnees
4. valider localement
5. mettre a jour la documentation si le comportement ou l'architecture changent

## 2. Commandes utiles

Depuis la racine du projet :

```powershell
npm run build
npx tsc --noEmit
npx prisma generate
node prisma/seed.js
```

Role des commandes :
- `npm run build` : validation complete de l'application
- `npx tsc --noEmit` : validation TypeScript
- `npx prisma generate` : regeneration du client Prisma
- `node prisma/seed.js` : synchronisation du catalogue de permissions et nettoyage des codes obsoletes

## 3. Maintenance Prisma

### Lors d'un changement de schema
1. modifier `prisma/schema.prisma`
2. appliquer la mise a jour a la base
3. regenerer Prisma
4. relancer la validation TypeScript et build

### Cas Windows frequents
Le client Prisma peut echouer si le moteur est verrouille.
Causes frequentes :
- serveur Next encore lance
- Prisma Studio ouvert
- processus tenant `src/generated/prisma/query_engine-windows.dll.node`

Correctif :
1. arreter le serveur de dev
2. fermer Prisma Studio
3. relancer `npx prisma generate`

## 4. Regles sur `seed.js`

Le seed doit rester limite a :
- synchroniser le catalogue de permissions
- migrer les anciens codes de permission
- supprimer les permissions depreciees

Il ne doit pas :
- creer des roles d'entreprise
- creer la structure d'une entreprise
- creer des employes, conges ou paies de demonstration

## 5. Ou ajouter du nouveau code

### A privilegier
- `src/components/dashboard/acces`
- `src/components/dashboard/conges`
- `src/components/dashboard/horaires`
- `src/components/dashboard/organisation`
- `src/components/dashboard/presences`
- `src/components/dashboard/paie`
- `src/components/dashboard/espaceTravail`

### A traiter avec prudence
- `src/components/dashboard/agent`
- `src/components/dashboard/tabord`
- `src/components/dashboard/AbscencePresence`
- `src/components/dashboard/RH`

## 6. Checklist de refactor safe

Avant suppression ou renommage :
1. chercher les imports avec `rg`
2. verifier les routes montees
3. verifier les references indirectes
4. lancer `npx tsc --noEmit`
5. lancer `npm run build`

Avant de modifier la logique d'acces :
1. verifier `src/server/access/scope.ts`
2. verifier `src/security/permissions.ts`
3. verifier l'alignement UI/API
4. eviter toute logique basee sur le nom du role

## 7. Regle de documentation

Si vous changez :
- les routes
- la structure des dossiers actifs
- le schema Prisma
- le catalogue des permissions
- la logique de portee

alors il faut mettre a jour :
- `docs/architecture.md`
- `docs/codebase-tree.md`
- `docs/data-model.md`
- `docs/access-control.md`
- `docs/modules/*` si un module est impacte
