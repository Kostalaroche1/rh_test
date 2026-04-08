# Tableau de bord enrichi

## But

Ce module fournit une vue globale RH dynamique, personnalisee par permissions et portees:
- indicateurs (agents, presences, conges, stations, directions, affectations)
- tendances annuelles (line/area chart)
- diagrammes circulaires (agents, sexe, affectations)
- arborescence organisationnelle (direction generale, sous-directions, bureaux)
- notifications recentes

## Route(s) montee(s)

- `/dashboard`
- `/dashboard/agents` (onglet `Dashboard` pour les profils de gestion)

## Terminologie front

- `TypeUniteOrganisationnelle` = **Station**
- `UniteOrganisationnelle` = **Direction**
- `TypeUniteOrganisationnelle` sans parent = **Direction generale**
- niveaux descendants = **Sous-direction** puis **Bureau** selon la hierarchie

## Fichiers principaux

- `src/components/dashboard/espaceTravail/TableauBordEspaceTravail.tsx`
- `src/components/dashboard/espaceTravail/overview/DashboardOverviewWorkspace.tsx`
- `src/components/dashboard/espaceTravail/overview/helpers.ts`
- `src/components/dashboard/espaceTravail/overview/types.ts`
- `src/components/dashboard/espaceTravail/overview/constants.ts`
- `src/components/dashboard/espaceTravail/overview/KpiCardsGrid.tsx`
- `src/components/dashboard/espaceTravail/overview/YearlyTrendSection.tsx`
- `src/components/dashboard/espaceTravail/overview/PieChartCard.tsx`
- `src/components/dashboard/espaceTravail/overview/GenderSplitPieCard.tsx`
- `src/components/dashboard/espaceTravail/overview/CircularAnalyticsSection.tsx`
- `src/components/dashboard/espaceTravail/overview/OrganisationHierarchyCard.tsx`
- `src/components/dashboard/espaceTravail/overview/NotificationsCard.tsx`
- `src/components/dashboard/espaceTravail/overview/ProvinceDirectoryCard.tsx`
- `src/components/dashboard/espaceTravail/overview/QuickModulesSection.tsx`
- `src/app/api/agent/dash/dashAdmin/route.ts`

## Permissions cles

Chaque bloc est pilote par permissions metier, pas par nom de role:

- `agent.read`: cartes agents, distributions agents, repartitions sexe
- `presence.read` (ou `presence.sign/confirm/validate`): cartes/series presences
- `demande_conge.read` (ou `request/confirm/validate`): cartes/series conges
- `type_unite_organisationnelle.read`: station (type), hierarchie station
- `unite_organisationnelle.read`: direction, hierarchie direction
- `province.read`: filtres/listes provinces, distributions par province
- `affectation.read`: cartes et diagrams affectations
- `notification.read`: liste notifications recentes

## Personnalisation par portee

- La reponse `dashAdmin` applique deja les portees d'acces (agent/unite/province).
- Le filtre province global (`Toutes les provinces` + liste deroulante) s'affiche uniquement si `hasGlobalProvinceAccess === true`.
- En portee restreinte, la vue est automatiquement bornee a la province/unite autorisee.

## Donnees exposees par l'API dashboard

`GET /api/agent/dash/dashAdmin` retourne notamment:

- `organisation.types`: stations (types) avec parent/enfants et liaisons province
- `organisation.provinces`: provinces avec compteurs et liens type/direction
- `organisation.mappings`: liens type/province/direction pour analyses front
- `scope.hasGlobalProvinceAccess`
- `AgentsPresences`: agents avec genre, presences, conges et affectations enrichies

## Analyses affichables

- Agents par direction (pie)
- Agents par station (pie)
- Agents par province (pie)
- Femmes/Hommes par direction (pie + select)
- Femmes/Hommes par station (pie + select)
- Femmes/Hommes par couple province/station (pie + select)
- Affectations par direction, station, province, sexe (pies)
- Presences par annee (line chart, couleur par annee)
- Conges par annee (area chart, couleur par annee)

## Architecture UI

L'UI est decoupee en sous-composants reutilisables pour eviter un composant monolithique:

- `KpiCardsGrid`: grille de cartes KPI
- `YearlyTrendSection`: charts annuels line/area
- `PieChartCard`: pie generique reutilisable
- `GenderSplitPieCard`: pie sexe avec select de groupe
- `CircularAnalyticsSection`: orchestration des pies selon permissions
- `OrganisationHierarchyCard`: direction generale + sous-directions + bureaux
- `NotificationsCard`: flux notifications recentes
- `ProvinceDirectoryCard`: recherche liste provinces/directions
- `QuickModulesSection`: acces rapide modules avec recherche

## Maintenance

- Ajouter un nouveau widget: le conditionner par permission dans `DashboardOverviewWorkspace.tsx`.
- Eviter les composants geants: privilegier extraction dans `overview/`.
- Toute evolution des donnees dashboard doit etre documentee dans ce fichier et testee via `npx tsc --noEmit`.
