# Architecture

## 1. But de l'application

Cette application est un systeme RH et de gestion du personnel.

Blocs metier principaux :
- controle d'acces
- organisation
- employes et comptes utilisateurs
- presences et absences
- conges
- paie
- horaires
- carrieres
- notifications
- rapports

L'objectif est de rester dynamique :
- la structure d'entreprise n'est pas codee en dur
- les roles metier ne sont pas supposes a l'avance
- l'acces depend des permissions et de la portee, pas du nom du role

## 2. Couches techniques principales

### A. Couche application et routes
Situee dans `src/app`.

Responsabilites :
- pages Next.js
- API routes
- layouts et erreurs de route
- actions serveur utilisees par l'UI

### B. Couche UI et composants metier
Situee surtout dans `src/components`.

Responsabilites :
- pages dashboard
- tableaux, dialogues, onglets, cartes
- composants UI partages dans `src/components/ui`

### C. Couche securite et acces
Situee dans :
- `src/security`
- `src/server/access`

Responsabilites :
- authentification
- verification des permissions
- resolution de la portee
- construction du contexte d'acces courant

### D. Couche services et acces aux donnees
Situee dans :
- `src/server/services`
- `src/repositories`
- `src/services`

Responsabilites :
- services secondaires
- helpers d'acces aux donnees
- utilitaires de formatage et de reporting

### E. Couche base de donnees
Situee dans `prisma`.

Responsabilites :
- schema Prisma
- migrations
- seed des metadonnees systeme comme les permissions

## 3. Principes d'architecture

### Organisation dynamique
Le modele d'organisation repose sur :
- `TypeUniteOrganisationnelle`
- `UniteOrganisationnelle`
- `Poste`
- `Affectation`

Chaque entreprise peut ainsi definir sa propre hierarchie.

### Acces base sur les permissions
L'acces repose sur :
- `Role`
- `Permisions`
- `RolePermission`
- `ReglePorteeRole`

Le role n'est qu'un conteneur.
Il ne doit pas piloter le comportement par son nom.

### Filtrage par portee
Une permission seule ne suffit pas.
Il faut aussi savoir sur quelles donnees elle s'applique.

Portees supportees :
- `SOI_MEME`
- `UNITE`
- `UNITE_ET_DESCENDANTS`
- `TOUTE_ORGANISATION`

## 4. Zones actives et zones legacy

### Zones actives a privilegier
- `src/components/dashboard/acces`
- `src/components/dashboard/commun`
- `src/components/dashboard/conges`
- `src/components/dashboard/espaceTravail`
- `src/components/dashboard/horaires`
- `src/components/dashboard/organisation`
- `src/components/dashboard/presences`
- `src/components/dashboard/paie`
- `src/components/dashboard/carrieres`

### Zones encore presentes mais legacy
- `src/components/dashboard/agent`
- `src/components/dashboard/tabord`
- `src/components/dashboard/AbscencePresence`
- `src/components/dashboard/AdminDashboard`
- `src/components/dashboard/RH`

Regle pratique :
- preferer les dossiers neutres et metier
- ne toucher aux dossiers legacy que si la page montee en depend encore

## 5. Routes dashboard principales

Routes montees :
- `/dashboard`
- `/dashboard/access`
- `/dashboard/agents`
- `/dashboard/agents/[id]`
- `/dashboard/carrieres`
- `/dashboard/conges`
- `/dashboard/organisation`
- `/dashboard/paie`
- `/dashboard/presenceAbsence`

Route de compatibilite :
- `/dashboard/tabord`

## 6. Fichiers critiques d'acces

- `src/security/auth.ts`
- `src/security/authorization.ts`
- `src/security/permissions.ts`
- `src/server/access/context.ts`
- `src/server/access/permission-catalog.ts`
- `src/server/access/scope.ts`

Ces fichiers ont un impact transversal sur toute l'application.

## 7. Contraintes actuelles

### Nommage mixte dans le code
Le code melange encore francais, anglais et anciens noms.
C'est normal pour l'etat actuel.
Ne pas renommer les dossiers de routes publiques sans verifier l'impact URL.

### Client Prisma genere dans `src/generated/prisma`
Sous Windows, les fichiers Prisma peuvent etre verrouilles par le serveur Next ou un autre processus.
