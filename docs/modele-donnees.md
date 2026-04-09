# Modele de donnees

## 1. Vue d'ensemble

Le schema Prisma contient :
- des modeles metier
- des tables de liaison techniques
- des tables support/historique
- des enums de domaine

Toutes les tables ne doivent pas devenir des blocs de permissions visibles.

## 2. Modeles metier principaux

### `Utilisateur`
Compte applicatif.

Champs importants :
- `login`
- `motDePasse`
- `actif`
- `dateCreation`

### `Role`
Conteneur dynamique de permissions.

Champs importants :
- `nom`
- `code`
- `description`
- `actif`

Important :
- le nom du role ne doit pas piloter les acces

### `Permisions`
Catalogue systeme des permissions.

Champs importants :
- `code`
- `libelle`
- `description`
- `module`
- `actif`

### `RolePermission`
Liaison role -> permission.
Repond a la question : que peut faire le role ?

### `ReglePorteeRole`
Liaison role + permission -> portee.
Repond a la question : ou cette permission s'applique-t-elle ?

### `Agent`
Fiche employe principale.

Champs importants :
- `matricule`
- `nom`
- `prenom`
- `datenais`
- `statut`
- `dateEntree`
- `actif`

### `CompteAgent`
Liaison entre un compte utilisateur et un agent.

### `HistoriqueAgent`
Trace des changements sur la fiche agent.
Modele support, pas un bloc CRUD principal.

## 3. Modeles d'organisation

### `TypeUniteOrganisationnelle`
Categories de structure.
Exemples : Site, Direction, Service, Region.

### `UniteOrganisationnelle`
Noeuds reels de l'arbre organisationnel.

Champs importants :
- `typeUniteId`
- `parentId`
- `chemin`
- `niveau`
- `actif`

### `Poste`
Poste rattache a une unite organisationnelle.

### `Fonction`
Fonction/titre metier.

### `Grade`
Niveau de classification.

### `Affectation`
Placement d'un agent dans la structure.

Champs importants :
- `agentId`
- `posteId`
- `fonctionId`
- `gradeId`
- `uniteOrganisationnelleId`
- `dateDebut`
- `dateFin`
- `statutOrganisationnel`
- `type`
- `principale`
- `actif`

### `HistoriqueAffectation`
Historique des changements d'affectation.
Modele support.

## 4. Presences

### `Presence`
Presence journaliere d'un agent.

Champs importants :
- `date`
- `heureArrivee`
- `heureDepart`
- `statut`
- `statutWorkflow`
- `confirmeParId`
- `valideParId`

Regle importante :
- `statut` = resultat metier (`PRESENCE`, `RETARD`, `ABSENT`, `CONGE`, `OFF`, ...)
- `statutWorkflow` = etat de validation (`BROUILLON`, `CONFIRME`, `VALIDE`)

## 5. Conges

### `TypeConge`
Donnee maitre des types de conge.

### `DemandeConge`
Workflow de demande de conge.

Champs importants :
- `agentId`
- `typeCongeId`
- `dateDemande`
- `dateDebut`
- `dateFin`
- `motif`
- `statut`
- `confirmePar`
- `validePar`

## 6. Paie et horaires

### `Paie`
Bulletin ou ligne de paie.

### `Prime`
Prime rattachee a une paie.
Elle reste dans le bloc Paie, pas comme bloc autonome.

### `HoraireTravail`
Modele d'horaire standard.

### `HoraireAgent`
Affectation d'un horaire a un agent.

## 7. Planification RH

### `TypePlanification`
Categorie de planification RH.

Exemples :
- conge
- formation
- evaluation
- mission
- paie

### `Planification`
Element principal de planification RH.

Il represente :
- un evenement RH futur
- une action planifiee
- une echeance a suivre

Champs importants :
- `titre`
- `description`
- `typePlanificationId`
- `dateDebut`
- `dateFin`
- `statut`
- `priorite`
- `uniteOrganisationnelleId`
- `creeParId`
- `assigneParId`
- `valideParId`
- `demandeCongeId`
- `affectationId`

Important :
- `Planification` ne remplace pas `HoraireTravail` ni `HoraireAgent`
- les horaires definissent le rythme normal de travail
- la planification definit les evenements ou actions RH autour de ce rythme

### `PlanificationParticipant`
Lie une planification aux agents concernes.

Permet de gerer :
- un beneficiaire
- un responsable
- un superviseur
- plusieurs participants sur une meme planification

### `RappelPlanification`
Rappels associes a une planification.

Permet :
- rappel dans l'application
- rappels futurs par email ou SMS si besoin

## 8. Notifications et rapports

### `Notification`
Notification en application.
Le champ `roleId` reste surtout pour compatibilite avec l'ancien modele.

### `Rapport`
Metadonnees des rapports generes.
Le module reporting n'est pas encore mature.

## 9. Classification des modeles

### Blocs metier directs
- `Role`
- `Permisions`
- `TypeUniteOrganisationnelle`
- `UniteOrganisationnelle`
- `Poste`
- `Fonction`
- `Grade`
- `Affectation`
- `Agent`
- `Utilisateur`
- `Presence`
- `TypeConge`
- `DemandeConge`
- `Paie`
- `HoraireTravail`
- `HoraireAgent`
- `TypePlanification`
- `Planification`
- `Notification`
- `Rapport`

### Modeles support/enfants
- `Prime`
- `CompteAgent`
- `HistoriqueAgent`
- `HistoriqueAffectation`
- `ReglePorteeRole`
- `PlanificationParticipant`
- `RappelPlanification`

### Modeles techniques
- `UtilisateurRole`
- `RolePermission`
- enums

## 10. Role de `seed.js`

`prisma/seed.js` sert a maintenir les metadonnees systeme :
- synchroniser le catalogue de permissions
- migrer les anciens codes vers les nouveaux
- supprimer les permissions depreciees

Il ne doit pas creer les donnees metier d'entreprise.
