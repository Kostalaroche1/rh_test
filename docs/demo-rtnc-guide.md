# Guide Demo RTNC

## Objectif

Ce package de demonstration prepare une base de donnees de demo RTNC pour presenter l'application RH sans modifier les seeds de reference deja existants.

Le seed RTNC demo :
- ne remplace pas les provinces RDC existantes
- ne remplace pas le catalogue de permissions existant
- ne remplace pas le bootstrap admin existant
- ajoute une couche de demonstration RTNC au-dessus de la structure actuelle

## Fichiers concernes

- `prisma/seed-rtnc-demo.js`
- `prisma/cleanup-rtnc-demo.js`
- `package.json` avec le script `db:seed:rtnc-demo`
- `package.json` avec le script `db:cleanup:rtnc-demo`

## Ce que le seed RTNC demo cree

Le seed ajoute des donnees de demonstration pour :
- roles RTNC de demo
- comptes utilisateurs de demo
- agents de demo
- structure organisationnelle RTNC de demo
- affectations principales
- horaires de travail et attributions horaires
- types de conge et quelques demandes de conge
- quelques presences
- quelques paies
- quelques planifications
- quelques notifications
- quelques rapports

## Ce que le seed ne touche pas

Le seed RTNC demo ne doit pas etre utilise pour :
- reinitialiser la base
- supprimer les donnees existantes
- remplacer les provinces RDC
- remplacer le seed principal du projet

## Prerequis

Avant de lancer le seed RTNC demo, il faut que le seed principal ait deja ete lance.

Ordre recommande :

```bash
npm run db:seed
npm run db:bootstrap-admin
npm run db:seed:rtnc-demo
```

## Mot de passe des comptes demo

Mot de passe par defaut :

```text
DemoRTNC2026!
```

Vous pouvez le changer avant execution avec la variable d'environnement :

```bash
$env:RTNC_DEMO_PASSWORD="VotreMotDePasse"
npm run db:seed:rtnc-demo
```

## Comptes demo crees

Comptes principaux de demonstration :

- `admin@rtnc.cd`
- `rh.central@rtnc.cd`
- `dir.kin@rtnc.cd`
- `rh.kin@rtnc.cd`
- `chef.kin@rtnc.cd`
- `agent.jt.kin@rtnc.cd`
- `agent.tech.kin@rtnc.cd`

## Niveau de realite des donnees

### Donnees confirmees publiquement

Les elements suivants sont utilises comme base publique RTNC :
- RTNC est un media public national de la RDC
- RTNC opere au niveau national
- RTNC dispose d'un niveau central
- RTNC dispose d'un niveau provincial
- RTNC dispose de stations provinciales
- la Direction Generale RTNC est a Kinshasa
- des noms publics comme la DG et le DGA ont servi de reference pour quelques fiches agents

### Donnees de demonstration / hypothese de travail

Les elements suivants sont des hypotheses de demonstration et non une affirmation d'organigramme officiel complet :
- certains services centraux
- certaines fonctions RH internes exactes
- certains responsables provinciaux fictifs
- certaines liaisons hierarchiques fines

Si vous trouvez plus tard l'organigramme officiel RTNC, il faudra corriger ces points dans le seed.

## Structure de demonstration creee

Le seed cree une structure compatible avec la logique actuelle de l'application :
- Direction generale RTNC
- Directions provinciales RTNC pour toutes les provinces deja seedees
- Stations provinciales RTNC pour toutes les provinces deja seedees
- quelques services centraux et provinciaux pour la demonstration

Cela permet a l'application de fonctionner avec :
- portee organisationnelle
- portee provinciale
- portee unite et descendants
- portee individuelle

## Roles demo utilises

Roles prepares dans le seed :
- `RTNC Admin central`
- `RTNC RH central`
- `RTNC Directeur provincial`
- `RTNC RH provincial`
- `RTNC Chef de station`
- `RTNC Agent`

Ces roles sont construits pour s'adapter a la logique actuelle de l'application sans changer l'architecture du systeme.

## Comment executer la demo sans risque

### Recommandation

Faites la demonstration avec :
- `rh.central@rtnc.cd` pour montrer la vue large RH
- `dir.kin@rtnc.cd` pour montrer la vue provinciale
- `agent.jt.kin@rtnc.cd` pour montrer la vue agent

### Eviter pendant la presentation

Evitez pendant la demo :
- suppression de provinces
- suppression de roles
- suppression de directions RTNC seedees
- modification manuelle des permissions si ce n'est pas prevu
- edition des comptes demo juste avant la presentation

## Scenario de presentation conseille

### Scenario 1 : vue nationale RH

Compte : `rh.central@rtnc.cd`

Montrez :
- tableau de bord global
- organisation centrale et provinciale
- liste des agents
- affectations
- types de conge
- presences
- planifications

Phrase simple a dire :

`Cette vue montre la gestion RH a l'echelle nationale de la RTNC, avec une structure centrale et un suivi provincial.`

### Scenario 2 : vue provinciale

Compte : `dir.kin@rtnc.cd`

Montrez :
- la limitation aux donnees de la province de Kinshasa
- les agents rattaches a cette province
- les presences de la province
- les demandes de conge a confirmer ou valider

Phrase simple a dire :

`Cette vue montre comment une direction provinciale peut suivre ses agents sans voir toute l'organisation.`

### Scenario 3 : vue chef de station

Compte : `chef.kin@rtnc.cd`

Montrez :
- l'acces limite a l'unite ou station
- la supervision de proximite
- les validations de premier niveau

Phrase simple a dire :

`Le chef de station travaille sur son unite et ses sous-unites, avec un perimetre local.`

### Scenario 4 : vue agent

Compte : `agent.jt.kin@rtnc.cd`

## Supprimer uniquement les donnees demo RTNC

Si vous voulez retirer la couche de demonstration RTNC sans supprimer les seeds de base, utilisez :

```bash
npm run db:cleanup:rtnc-demo
```

Ce script vise uniquement :
- les comptes demo RTNC
- les agents demo RTNC
- les roles demo RTNC
- les unites RTNC creees par ce seed
- les horaires, conges, presences, paies, notifications, rapports et planifications de demo associes

Il ne doit pas supprimer :
- les provinces
- le seed principal
- le bootstrap admin de base

Montrez :
- consultation de ses presences
- consultation de ses conges
- consultation de sa paie
- consultation de ses notifications

Phrase simple a dire :

`Chaque agent accede a ses informations personnelles et a ses demarches RH courantes.`

## Script oral simple pour un presentateur non ingenieur

Proposition de trame tres simple :

1. `Nous presentons une version de demonstration de la solution RH adaptee au contexte national de la RTNC.`
2. `La solution prend en charge une organisation centrale, des directions provinciales et des stations.`
3. `Nous allons montrer trois niveaux d'usage : RH central, direction provinciale et agent.`
4. `La plateforme permet de suivre les agents, les affectations, les presences, les conges, les horaires et certaines planifications.`
5. `Le but de cette demonstration est de montrer comment la solution peut s'adapter a une gestion RH a l'echelle de la RTNC.`

## Conseils pratiques avant presentation

Avant presentation :
- verifier que la base de donnees cible est la bonne
- lancer le seed principal si necessaire
- lancer ensuite `npm run db:seed:rtnc-demo`
- tester au moins 3 comptes : RH central, direction provinciale, agent
- verifier l'ouverture des modules principaux : organisation, agents, conges, presences, carrieres, horaires

## En cas de correction future

Si un organigramme officiel RTNC est fourni plus tard, il faudra revoir prioritairement :
- noms des directions centrales
- noms des directions provinciales si necessaire
- roles de validation exacts
- responsabilites RH exactes
- repartition precise entre central, province et station

## Resume court

Le seed RTNC demo sert a :
- remplir l'application pour une demonstration RTNC
- rester compatible avec la logique actuelle de l'application
- ne pas casser les seeds de reference existants
- pouvoir etre corrige plus tard si un organigramme officiel est fourni
