# Planification

## But

Ce module doit gerer les actions et evenements RH futurs.

Il permet de planifier :
- des conges
- des formations
- des evaluations
- des missions
- des echeances RH
- des suivis d'affectation

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

## Liens metier initiaux

Le modele permet deja de relier une planification a :
- une `DemandeConge`
- une `Affectation`

Cela permet de commencer simplement avec les cas RH les plus utiles sans surcharger le schema.

## Etat actuel

La fondation schema + permissions est ajoutee.
L'UI et les API dediees restent a construire ensuite.
