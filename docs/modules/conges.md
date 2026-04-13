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

## Lien avec la planification

Le module `Conges` reste le workflow officiel des absences.

Difference de responsabilite :
- `TypeConge` definit la nature du conge
- `DemandeConge` gere la demande, la confirmation et la validation
- `Planification` sert a preparer et suivre le conge avant son execution

### Quand une demande peut etre planifiee

Dans les vues RH et unite, une demande peut afficher `Creer planification` seulement si :
- son statut est `CONFIRME` ou `VALIDE`
- l'utilisateur courant possede `planification.create`
- aucune planification active n'est deja liee a cette demande

Les statuts suivants ne proposent pas cette action :
- `EN_ATTENTE`
- `REJETE`

### Ce que fait `Creer planification`

Cette action ouvre le module `Planification` avec un formulaire pre-rempli :
- type `CONGE`
- demande de conge deja liee
- agent deja selectionne
- dates de debut et de fin reprises depuis la demande

### Consultation d'une planification existante

Quand une demande est deja planifiee :
- la vue de conges affiche le statut de la planification
- `Voir planification` ouvre un apercu rapide en modal dans l'ecran courant
- `Voir plus` redirige vers l'onglet `Planifications` avec la planification cible deja ouverte

### Regle importante

Une `DemandeConge` ne peut avoir qu'une seule planification active liee.

Consequence :
- une demande deja planifiee est marquee `Planifie`
- elle ne reapparait plus dans la liste `Demande de conge liee` du formulaire de planification
- elle redevient eligible si la planification precedente est `ANNULE`

Voir aussi :
- [Planification](./planification.md)
