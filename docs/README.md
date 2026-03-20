# Documentation technique

Ce dossier contient la documentation de reference pour les mainteneurs du projet.

## Documentation technique de reference

Ces fichiers sont la source officielle a maintenir :
- [Architecture](./architecture.md)
- [Arborescence du code](./arborescence-code.md)
- [Modele de donnees](./modele-donnees.md)
- [Acces et portees](./acces-et-portees.md)
- [Documentation des modules](./modules/README.md)
- [Guide de maintenance](./guide-maintenance.md)
- [Depannage](./depannage.md)

Ordre de lecture recommande pour un nouveau mainteneur :
1. `architecture.md`
2. `arborescence-code.md`
3. `modele-donnees.md`
4. `acces-et-portees.md`
5. `modules/README.md`
6. `guide-maintenance.md`
7. `depannage.md`

## Documentation utilisateur

Ce fichier reste utile pour l'utilisation de base de l'application :
- [Guide utilisateur](./guide-utilisateur.md)

## Regle de maintenance

- maintenir uniquement les fichiers de reference ci-dessus
- ne pas recreer de documentation parallele pour le meme sujet
- garder la documentation technique en francais pour coherer avec l'application et ses modules
- privilegier Markdown uniquement pour eviter la derive entre plusieurs formats

## Stack actuelle

- Next.js 16
- React 19
- TypeScript
- Prisma 6 + MySQL
- TanStack Query
- Radix UI + composants UI maison

## Choix d'architecture importants

- l'organisation est dynamique et basee sur `TypeUniteOrganisationnelle` + `UniteOrganisationnelle`
- l'acces repose sur les permissions et les portees
- le nom d'un role ne doit pas piloter l'autorisation
- certains dossiers restent legacy et doivent etre refactores avec prudence
