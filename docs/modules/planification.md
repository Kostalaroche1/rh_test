# Planification

## But

Le module de planification sert a preparer les actions et evenements RH a venir.

Il permet de planifier notamment :
- des conges
- des entretiens
- des evaluations
- des formations
- des missions
- des suivis d'affectation
- des jours feries et fermetures collectives

## Position dans l'architecture

La planification est un domaine transversal.

Elle ne remplace pas :
- `HoraireTravail`
- `HoraireAgent`

Difference :
- les horaires definissent le rythme normal de travail
- la planification definit les evenements ou actions RH organises autour de ce rythme

## Modeles relies

- `TypePlanification`
- `Planification`
- `PlanificationParticipant`
- `RappelPlanification`

## Permissions prevues

- `type_planification.read/create/update/delete`
- `planification.read/create/update/delete`
- `planification.assign`
- `planification.validate`

## Liens metier deja supportes

Une planification peut deja etre reliee a :
- une `DemandeConge`
- une `Affectation`
- une `UniteOrganisationnelle`
- une `Province`

## Lien avec les demandes de conge

La planification ne remplace pas `DemandeConge`.

La logique metier est la suivante :
- `TypeConge` definit la nature du conge
- `DemandeConge` porte le workflow officiel de demande
- `Planification` ajoute la preparation et l'anticipation autour de cette demande

Exemple :
- l'agent depose une demande de conge annuel
- le responsable la confirme
- RH ou un utilisateur autorise cree ensuite une planification liee pour organiser l'absence

Cette planification permet notamment :
- d'anticiper l'absence
- de la rendre visible dans le calendrier et les rapports
- de poser un rappel
- de coordonner le suivi RH

### Quand `Creer planification` apparait

Dans les ecrans des demandes de conge, l'action `Creer planification` apparait seulement si :
- la demande est en statut `CONFIRME` ou `VALIDE`
- l'utilisateur courant possede `planification.create`
- aucune planification active n'est deja liee a cette demande

L'action n'apparait donc pas pour :
- `EN_ATTENTE`
- `REJETE`
- une demande deja planifiee

### Prefill depuis une demande de conge

Quand l'utilisateur clique `Creer planification` depuis une demande de conge :
- le module de planification s'ouvre
- le formulaire est pre-rempli pour une planification de type `CONGE`
- la demande de conge est deja liee
- l'agent de la demande est deja selectionne
- les dates de debut et de fin de la demande sont reprises

### Consultation depuis une demande de conge

Quand une demande est deja planifiee :
- l'ecran de conges affiche son statut de planification
- l'action `Voir planification` ouvre d'abord un apercu en modal dans le module de conges
- le bouton `Voir plus` de cette modal redirige ensuite vers l'onglet `Planifications` avec la bonne fiche ouverte

### Regle d'unicite pour `CONGE`

Une `DemandeConge` ne peut etre reliee qu'a une seule planification active de type `CONGE`.

Concretement :
- une demande deja planifiee ne reapparait plus dans la liste `Demande de conge liee`
- l'API refuse aussi la creation d'une deuxieme planification active sur la meme demande

Une demande redevient eligible si la planification precedente est `ANNULE`.

### Regle de chevauchement pour `CONGE`

Pour les planifications de type `CONGE`, le systeme ne se contente plus d'avertir.

Il bloque la creation ou la modification si :
- le meme agent a deja une autre planification individuelle active
- et que les periodes se chevauchent

Les statuts exclus de ce controle sont :
- `ANNULE`
- `REPORTE`

Consequence pratique :
- pour `CONGE`, le conflit de periode est bloquant
- pour les autres types individuels, l'interface affiche encore seulement un avertissement

## Fonctionnement de l'ecran

L'interface utilise maintenant un seul espace `Planifications`.

Il n'existe plus d'onglet separe pour les jours feries.

La logique est la suivante :
- `JOUR_FERIE` reste un type de planification
- quand l'utilisateur choisit `JOUR_FERIE` dans le formulaire principal, le formulaire s'adapte automatiquement

## Regles de formulaire importantes

## Regles de statut

Les statuts manuels sont :
- `BROUILLON`
- `PLANIFIE`
- `ANNULE`
- `REPORTE`

Les statuts automatiques sont :
- `EN_COURS`
- `TERMINE`

Logique :
- tant qu'une planification n'est pas encore validee ou prete, on la laisse en `BROUILLON`
- quand elle est decidee et prete, un utilisateur autorise la passe en `PLANIFIE`
- a partir de la date de debut, le systeme l'affiche automatiquement en `EN_COURS`
- apres la date de fin, le systeme l'affiche automatiquement en `TERMINE`

Important :
- `ANNULE` et `REPORTE` restent prioritaires et ne sont pas remplaces automatiquement
- si une ancienne donnee a ete enregistree en `EN_COURS` ou `TERMINE`, l'API la normalise maintenant selon les dates

### Planification individuelle

Quand la cible est `INDIVIDUEL` :
- au moins un participant est obligatoire

### Planification collective

Quand la cible est :
- `UNITE`
- `PROVINCE`
- `TOUTE_ORGANISATION`

alors :
- les participants individuels ne sont pas utilises

### Cas special `JOUR_FERIE`

Quand le type choisi est `JOUR_FERIE` :
- la cible `INDIVIDUEL` n'est pas autorisee
- les participants sont masques
- la demande de conge liee est desactivee
- l'affectation liee est desactivee

En pratique, un jour ferie doit viser :
- une unite
- une province
- ou toute l'organisation

## Jours feries

Les jours feries ne sont pas hardcodes dans l'application.

Ils sont definis par un utilisateur autorise dans le tableau de bord.

Exemples :
- Noel
- Paques
- Fete du Travail
- fermeture collective de fin d'annee
- jour ferie exceptionnel

Cela permet de gerer les cas reels ou les dates changent selon :
- l'annee
- la politique interne
- un contexte exceptionnel

## Duplication d'un jour ferie

Dans la liste des planifications, quand une ligne est de type `JOUR_FERIE`, l'action suivante est disponible :
- `Dupliquer pour l'annee suivante`

Cette action :
- ouvre une nouvelle planification en brouillon
- decale les dates d'un an
- copie la cible
- copie l'unite ou la province si besoin
- copie les notes

L'utilisateur ajuste ensuite les vraies dates avant enregistrement.

Le systeme aide donc a preparer l'annee suivante sans imposer de recurrence automatique.

## Protection contre les doublons

Pour les `JOUR_FERIE`, l'API bloque la creation ou la modification d'un doublon quand les elements suivants sont identiques :
- date de debut
- date de fin
- cible
- unite
- province

L'objectif est d'eviter deux definitions du meme jour ferie pour le meme perimetre.

## Integration avec la presence

Les jours feries sont deja relies a la logique de presence du jour.

Quand un `JOUR_FERIE` actif couvre la date du jour et le bon perimetre :
- la journee est consideree comme feriee
- le pointage entree/sortie est bloque
- l'interface affiche `JOUR_FERIE`
- le statut final en base reste `OFF`

Cette integration couvre deja :
- `TOUTE_ORGANISATION`
- `PROVINCE`
- `UNITE`

## Etat actuel

Le module couvre deja :
- le schema Prisma
- les routes API
- l'interface de gestion
- la logique dynamique du formulaire
- un champ simple de date de rappel dans le formulaire
- la protection contre les doublons de jours feries
- la duplication vers l'annee suivante
- les notifications a la creation et a la mise a jour
- une vue calendrier
- un panneau "A venir sur 14 jours" dans l'espace de travail
- un onglet `Rapport` avec compteurs et repartitions
- l'integration presence pour les jours feries

## Rappels

Le formulaire principal accepte deja une `Date de rappel` optionnelle.

Quand cette date est renseignee :
- un `RappelPlanification` est enregistre
- le rappel n'est pas envoye immediatement
- il doit etre traite par le moteur de rappels

## Moteur de rappels

Le traitement des rappels est prevu pour etre lance manuellement ou par ordonnanceur.

Script disponible :
- `npm run planification:reminders`

Ce script :
- cherche les rappels non envoyes dont la date est atteinte
- determine les destinataires selon la cible de la planification
- cree des notifications applicatives dedoublonnees
- marque les rappels comme envoyes

Ce comportement couvre deja :
- `INDIVIDUEL`
- `UNITE`
- `PROVINCE`
- `TOUTE_ORGANISATION`

## Ce qui peut venir plus tard

Ameliorations possibles :
- filtres avances par type et par cible
- rappels multiples visibles en interface
- export ou reporting avance de planification
