# Arborescence du code

## 1. Structure principale

```text
prisma/
src/
package.json
```

### `prisma/`
Contient :
- `schema.prisma` : modele principal de donnees
- `seed.js` : synchronisation du catalogue de permissions et nettoyage
- `migrations/` : historique des migrations

### `src/`
Contient le code applicatif principal.

Sous-dossiers importants :
- `app/` : pages, layouts, API routes, actions serveur
- `components/` : UI et composants metier
- `features/` : hooks et logique par fonctionnalite
- `generated/` : client Prisma genere
- `hooks/` : hooks React partages
- `lib/` : utilitaires bas niveau et acces Prisma
- `repositories/` : helpers d'acces aux donnees
- `security/` : auth et permissions
- `server/` : logique serveur d'acces et services
- `services/` : utilitaires plus anciens
- `utilities/` : helpers applicatifs divers

## 2. Routes dashboard

```text
src/app/dashboard/
  page.tsx
  layout.tsx
  access/page.tsx
  agents/page.tsx
  agents/[id]/page.tsx
  carrieres/page.tsx
  conges/page.tsx
  organisation/page.tsx
  paie/page.tsx
  presenceAbsence/page.tsx
  tabord/page.tsx
```

Signification :
- `page.tsx` : entree generale du dashboard
- `access/page.tsx` : controle d'acces
- `agents/page.tsx` : gestion des employes et zone admin associee
- `agents/[id]/page.tsx` : fiche/parcours d'un agent
- `carrieres/page.tsx` : carrieres et affectations
- `conges/page.tsx` : conges
- `organisation/page.tsx` : structure organisationnelle
- `paie/page.tsx` : paie
- `presenceAbsence/page.tsx` : presences
- `tabord/page.tsx` : compatibilite legacy

## 3. Dossiers dashboard actuels

```text
src/components/dashboard/
  AbscencePresence/
  acces/
  AdminDashboard/
  agent/
  carrieres/
  chefServiceDashBoard/
  commun/
  conges/
  espaceTravail/
  gestionDeFormation/
  horaires/
  organisation/
  paie/
  presences/
  reporting/
  RH/
  tabord/
  utilisateurs/
```

### Dossiers a privilegier
- `acces`
- `commun`
- `conges`
- `espaceTravail`
- `horaires`
- `organisation`
- `paie`
- `presences`
- `carrieres`

### Dossiers a traiter comme legacy
- `AbscencePresence`
- `AdminDashboard`
- `agent`
- `chefServiceDashBoard`
- `RH`
- `tabord`

## 4. Dossiers acces et securite

### `src/security`
Fichiers principaux :
- `auth.ts`
- `authorization.ts`
- `permission-aliases.ts`
- `permissions.ts`
- `roles.ts`

### `src/server/access`
Fichiers principaux :
- `context.ts`
- `permission-catalog.ts`
- `scope.ts`

## 5. Parcours de lecture recommande

Pour comprendre vite l'application montee :
1. `src/app/dashboard/layout.tsx`
2. `src/components/app-sidebar.tsx`
3. `src/components/nav-main.tsx`
4. `src/app/dashboard/page.tsx`
5. `src/components/dashboard/espaceTravail/TableauBordEspaceTravail.tsx`
6. `src/server/access/scope.ts`
7. `src/server/access/permission-catalog.ts`
8. `prisma/schema.prisma`
