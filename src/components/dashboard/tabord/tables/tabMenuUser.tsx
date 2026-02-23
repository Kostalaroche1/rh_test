import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Typage simplifié
type Agent = {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  statut: string;
  actif: boolean;
  dateEntree: string;
};

type CompteAgent = {
  id: number;
  agentId: number;
  utilisateurId: number;
  liePar: number;
  dateLiaison: string;
  agent: Agent;
};

type Role = {
  id: number;
  utilisateurId: number;
  roleId: number;
  attribuePar: number;
  dateAttribution: string;
};

type Utilisateur = {
  id: number;
  login: string;
  actif: boolean;
  roles: Role[];
  compteAgent: CompteAgent | null;
};

interface Props {
  users: Utilisateur[];
}

export default function UsersTable({ users }: Props) {
  const handleCreateAccount = (user: Utilisateur) => {
    console.log("Créer un compte pour :", user.login);
    // Ici tu peux appeler ton API pour créer le compte agent
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Login</TableHead>
          <TableHead>Actif</TableHead>
          <TableHead>Agent Matricule</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Prénom</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.id}</TableCell>
            <TableCell>{user.login}</TableCell>
            <TableCell>{user.actif ? "Oui" : "Non"}</TableCell>
            <TableCell>{user.compteAgent?.agent?.matricule || "-"}</TableCell>
            <TableCell>{user.compteAgent?.agent?.nom || "-"}</TableCell>
            <TableCell>{user.compteAgent?.agent?.prenom || "-"}</TableCell>
            <TableCell>
              {!user.compteAgent ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreateAccount(user)}
                >
                  Créer un compte
                </Button>
              ) : (
                <span>Compte créé</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Exemple d'utilisation avec tes données
const usersFromDB: Utilisateur[] = [
  { id: 1, login: "admin@gmail.com", actif: true, roles: [], compteAgent: null },
  { id: 2, login: "admin1@gmail.com", actif: true, roles: [], compteAgent: null },
  { id: 7, login: "admin2@gmail.com", actif: true, roles: [], compteAgent: null },
  { id: 9, login: "admin3@gmail.com", actif: true, roles: [], compteAgent: null },
  { id: 19, login: "kosta@gmail.com", actif: true, roles: [], compteAgent: null },
  { id: 23, login: "eree@gmail.com", actif: true, roles: [], compteAgent: null },
  {
    id: 24,
    login: "blanchard@gmail.com",
    actif: true,
    roles: [{ id: 4, utilisateurId: 24, roleId: 3, attribuePar: 24, dateAttribution: "2026-02-03T01:03:57.746Z" }],
    compteAgent: {
      id: 3,
      agentId: 16,
      utilisateurId: 24,
      liePar: 24,
      dateLiaison: "2026-02-03T01:03:57.761Z",
      agent: { id: 16, matricule: "AG-1668-Q", nom: "kosta", prenom: "Blanchard", statut: "Célibataire", actif: false, dateEntree: "2026-02-03T01:03:57.724Z" },
    },
  },
];

// Dans ton App.tsx
export function App() {
  return <UsersTable users={usersFromDB} />;
}
