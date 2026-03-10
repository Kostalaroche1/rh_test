# Guide utilisateur

## Public cible

Ce guide s'adresse aux utilisateurs finaux de l'application RH (agents, responsables, administrateurs) pour les actions de connexion et recuperation de mot de passe.

## Acces a l'application

1. Ouvrir la page de connexion: `/login` (ou `/`).
2. Saisir votre email professionnel.
3. Saisir votre mot de passe.
4. Cliquer sur `Se connecter`.

Si les identifiants sont valides, vous etes redirige vers `/dashboard`.

## Mot de passe oublie

1. Depuis l'ecran de connexion, cliquer sur `Mot de passe oublie`.
2. Vous arrivez sur `/forgot`.
3. Saisir votre email professionnel.
4. Cliquer sur `Verifier`.

Si le compte existe, un message de confirmation s'affiche puis vous etes redirige vers `/passreset`.

## Reinitialiser le mot de passe

1. Sur la page `/passreset`, saisir un nouveau mot de passe.
2. Saisir la confirmation du mot de passe.
3. Cliquer sur `Reinitialiser`.

Regles de validation:

- longueur minimale: 8 caracteres
- les deux champs doivent etre renseignes
- les deux mots de passe doivent etre identiques

En cas de succes, vous etes redirige vers la page de connexion.

## Messages d'erreur frequents

- `Identifiants invalides`: email ou mot de passe incorrect.
- `Ce compte est desactive. Contactez le RH.`: compte inactif.
- `Aucun role actif n'est associe a ce compte.`: role absent ou desactive.
- `Compte non trouve`: email non reconnu en recuperation.
- `Session expiree ou cookie manquant`: la session de recuperation a expire (15 minutes).

## Bonnes pratiques pour les utilisateurs

- Utiliser un mot de passe long et unique.
- Ne pas partager son mot de passe.
- Fermer la session apres usage sur un poste partage.
- Contacter le service RH en cas de blocage persistant.
