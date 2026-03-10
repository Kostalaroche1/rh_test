# Cria Refonte

## Documentation utilisateur

La documentation destinee aux utilisateurs est disponible ici:

- [Guide utilisateur](docs/USER_GUIDE.md)
- [Guide non technique (PDF)](docs/Guide_Utilisateur_Non_Technique.pdf)
- [Source du PDF (HTML)](docs/Guide_Utilisateur_Non_Technique.html)

## Endpoints principaux (resume)

### Authentification

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/agent/forgotPassword`
- `POST /api/agent/resetPassword`

### Utilisateurs

- `GET /api/utilisateur`
- `POST /api/utilisateur`
- `PUT /api/utilisateur`
- `POST /api/utilisateur/utilisateur-role`
- `DELETE /api/utilisateur/utilisateur-role`

### Agents

- `GET /api/agent`
- `POST /api/agent`
- `PUT /api/agent`
- `GET /api/agent/historique-agent?agentId=ID`

## Flux Frontend -> Backend

1. Login reussi -> cookie JWT `auth_token` cree.
2. Le frontend appelle les API (cookie envoye automatiquement).
3. Le backend:
   - verifie l'authentification
   - verifie l'autorisation par role
   - execute la logique metier
4. Reponse JSON retournee au frontend.
