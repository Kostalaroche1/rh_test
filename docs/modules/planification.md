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

## Fonctionnement de l'ecran

L'interface utilise maintenant un seul espace `Planifications`.

Il n'existe plus d'onglet separe pour les jours feries.

La logique est la suivante :
- `JOUR_FERIE` reste un type de planification
- quand l'utilisateur choisit `JOUR_FERIE` dans le formulaire principal, le formulaire s'adapte automatiquement

## Regles de formulaire importantes

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
