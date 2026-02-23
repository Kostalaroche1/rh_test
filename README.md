POST /api/auth/login

POST /api/auth/logout

Utilisateurs

GET /api/utilisateurs

POST /api/utilisateurs

PUT /api/utilisateurs

POST /api/utilisateurs/roles

DELETE /api/utilisateurs/roles

Agents

GET /api/agents

POST /api/agents

PUT /api/agents

POST /api/agents/compte

DELETE /api/agents/compte

GET /api/agents/historique?agentId=ID
Flux Frontend ↔ Backend

Login → cookie JWT créé

Frontend appelle les API (cookie envoyé automatiquement)

Backend :

vérifie authentification

vérifie autorisation par rôle

exécute la logique métier

Réponse JSON

Périmètre Sprint 1
Inclus

Gestion des utilisateurs

Gestion des rôles

Gestion des agents

Liaisons agent ↔ utilisateur

Historique des agents

Sécurité (auth + RBAC)