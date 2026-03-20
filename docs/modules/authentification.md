# Authentification

## But

Ce module gere :
- connexion
- deconnexion
- lecture de la session authentifiee

## Routes principales
- `/login`
- `/forgot`
- `/passreset`

## Fichiers principaux
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/security/auth.ts`
- `src/components/login-form.tsx`
- `src/components/forgot-password/forgot.tsx`
- `src/components/password-reset/passreset.tsx`

## Modele de session
Le JWT contient notamment :
- `userId`
- `compteId`
- identite de l'utilisateur
- roles courants
- permissions aplaties

## Regle pratique importante
Apres changement des permissions ou roles d'un utilisateur, il faut se reconnecter pour recharger la session.

## Caveat
Certains messages UX restent encore marques par l'ancien vocabulaire metier.
