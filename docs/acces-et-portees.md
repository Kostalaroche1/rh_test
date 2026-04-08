# Acces et portees

## 1. Idee generale

Le systeme repond a 2 questions separees :

1. que peut faire l'utilisateur ?
2. sur quelles donnees peut-il le faire ?

## 2. Reponse a la question "que peut-il faire ?"

Assuree par :
- `Role`
- `Permisions`
- `RolePermission`

Le role est un conteneur.
Le systeme ne doit pas dire :
- si le role s'appelle `RH`, alors autoriser

Il doit dire :
- ce role possede telle permission

## 3. Reponse a la question "ou peut-il le faire ?"

Assuree par :
- `ReglePorteeRole`
- `Affectation`
- `UniteOrganisationnelle`

### `ReglePorteeRole`
Associe :
- un role
- une permission
- une portee

Exemple :
- permission : `presence.read`
- role : `Responsable Unite`
- portee : `UNITE_ET_DESCENDANTS`

## 4. Valeurs de portee

### `SOI_MEME`
Seulement les donnees personnelles de l'utilisateur.

### `UNITE`
Seulement l'unite organisationnelle courante.

### `UNITE_ET_DESCENDANTS`
L'unite courante et toutes ses sous-unites.

### `TOUTE_ORGANISATION`
Toute l'entreprise.

## 5. Regles de conception appliquees

### Regle A : CRUD pour les donnees maitre
Exemples :
- `poste.create`
- `fonction.update`
- `grade.delete`
- `type_unite_organisationnelle.read`

### Regle B : verbes metier pour les workflows
Exemples :
- `presence.sign`
- `presence.confirm`
- `presence.validate`
- `demande_conge.request`
- `demande_conge.confirm`
- `demande_conge.validate`
- `affectation.assign`
- `horaire_agent.assign`
- `paie.publish`

### Regle C : eviter les doublons semantiques
Doublons supprimes du modele actif :
- `demande_conge.create` -> remplacer par `demande_conge.request`
- `affectation.create` -> remplacer par `affectation.assign`
- `horaire_agent.create` -> remplacer par `horaire_agent.assign`
- `presence.create` -> remplacer par `presence.sign`
- `presence.signal_absence` retire du modele actif

## 6. Families de permissions importantes

### Controle d'acces
- `role.read/create/update/delete`
- `permission.read/create/update/delete`
- `regle_portee_role.read/create/update/delete`

### Organisation
- `type_unite_organisationnelle.read/create/update/delete`
- `unite_organisationnelle.read/create/update/delete`
- `poste.read/create/update/delete`
- `fonction.read/create/update/delete`
- `grade.read/create/update/delete`
- `affectation.read/update/delete`
- `affectation.assign`

### Employes
- `user.read/create/update/delete`
- `agent.read/create/update/delete`

### Presences
- `presence.read`
- `presence.update`
- `presence.delete`
- `presence.sign`
- `presence.confirm`
- `presence.validate`

### Conges
- `type_conge.read/create/update/delete`
- `demande_conge.read`
- `demande_conge.update`
- `demande_conge.delete`
- `demande_conge.request`
- `demande_conge.confirm`
- `demande_conge.validate`

### Paie
- `paie.read/create/update/delete`
- `paie.publish`

### Horaires
- `horaire_travail.read/create/update/delete`
- `horaire_agent.read/update/delete`
- `horaire_agent.assign`

### Planification
- `type_planification.read/create/update/delete`
- `planification.read/create/update/delete`
- `planification.assign`
- `planification.validate`

## 7. Regles de maintenance

- ne jamais deduire les droits a partir du nom du role
- ne jamais supposer une portee a partir d'un libelle metier
- toujours choisir explicitement la portee d'une permission attribuee
- garder `seed.js` comme synchronisation du catalogue, pas comme creation de donnees metier
