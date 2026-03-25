# Depannage

## 1. Prisma ne genere pas le client sous Windows

### Symptomes
- erreur `EPERM`
- erreur sur `query_engine-windows.dll.node`
- `npx prisma generate` echoue

### Causes probables
- serveur Next encore lance
- Prisma Studio ouvert
- un autre processus verrouille le moteur Prisma

### Correctif
1. arreter le serveur de developpement
2. fermer Prisma Studio si ouvert
3. relancer :

```powershell
npx prisma generate
```

## 2. Les nouvelles permissions n'apparaissent pas dans l'application

### Symptomes
- une permission a ete ajoutee dans le code
- elle n'apparait pas dans `/dashboard/access`

### Causes probables
- `seed.js` n'a pas ete relance
- la base contient encore l'ancien catalogue

### Correctif
```powershell
node prisma/seed.js
```

## 3. Un utilisateur ne voit pas une action apres ajout d'une permission

### Symptomes
- la permission a bien ete attribuee
- l'utilisateur ne voit toujours pas le bouton ou l'onglet

### Cause principale
Les permissions sont chargees dans la session au moment de la connexion.

### Correctif
1. enregistrer le role si necessaire
2. se deconnecter
3. se reconnecter

## 4. Une action existe mais ne s'applique sur aucune donnee

### Symptomes
- l'utilisateur a la permission
- l'API repond mais aucun resultat n'apparait ou l'action est refusee

### Cause principale
La permission est attribuee sans portee exploitable ou la portee ne correspond pas a l'affectation courante.

### Correctif
Verifier :
- la permission du role
- la `ReglePorteeRole`
- l'affectation active de l'utilisateur
- la structure `UniteOrganisationnelle`

## 5. La creation d'un poste ou d'une affectation echoue apres changement du schema

### Symptomes
- erreur Prisma de contrainte nulle ou champ inattendu

### Cause principale
La base n'est plus synchronisee avec le schema Prisma courant.

### Correctif
1. synchroniser la base
2. regenerer Prisma
3. relancer les validations

## 6. Un module affiche une vue inattendue

### Exemple
- un administrateur voit uniquement une vue personnelle au lieu de toutes les vues attendues

### Cause probable
Le composant selectionne la vue en fonction des permissions presentes dans la session.

### Correctif
Verifier :
- les permissions du role
- la session rechargee apres reconnexion
- la logique du composant de selection de panneau

## 7. Une route semble legacy ou mal nommee

### Regle
Ne pas renommer une route publique sans verifier l'impact sur les URLs et la navigation.

### Approche recommandee
- garder l'URL stable
- nettoyer d'abord le composant interne
- documenter ensuite le changement si une vraie migration de route est decidee

## 8. Compte admin connecte mais dashboard presque vide

### Symptomes
- le compte affiche un role (`admin`, `Admin Gen`, etc.)
- presque aucun module n'apparait
- il reste seulement la vue generique

### Cause principale
Le role est actif mais il n'a aucune ligne dans `RolePermission`/`ReglePorteeRole`.

### Correctif local (recommande)
```powershell
npm run access:bootstrap
```

Si vous voulez reinitialiser explicitement les roles templates (ecrase les attributions existantes des roles reconnus) :
```powershell
npm run access:bootstrap:force
```

### Correctif d'urgence via API (token)
1. definir `ACCESS_BOOTSTRAP_TOKEN` (secret fort) dans l'environnement
2. appeler:
```http
POST /api/agent/role-permission/bootstrap
x-access-bootstrap-token: <ACCESS_BOOTSTRAP_TOKEN>
```

Le mode token n'est accepte que quand `RolePermission` est vide (phase d'initialisation).
