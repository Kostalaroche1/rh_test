"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AddRole, GetRole } from "@/app/action/role/action"; // tes actions backend
import { useGet } from "@/hooks/useApi";

export function RoleTabs() {
  const [loading, setLoading] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const {data:roles , refetch} = useGet(['RolesTabs'] , GetRole)
  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Le nom du rôle est requis");
      return;
    }
    setLoading(true);
    try {
      const res = await AddRole({ nom: newRoleName });
      if (res.status === 200) {
        toast.success("Rôle ajouté avec succès");
        setNewRoleName("");
        refetch(); // rafraîchir la liste
      } else {
        toast.error("Erreur lors de l'ajout du rôle");
      }
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="roles" className="w-full">
      <TabsList>
        <TabsTrigger value="roles">Rôles</TabsTrigger>
      </TabsList>

      <TabsContent value="roles">
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Nouveau rôle"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="w-1/2"
          />
          <Button onClick={handleAddRole} disabled={loading}>
            {loading ? "Ajout..." : "Ajouter"}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nom du rôle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.data.length > 0 ? (
              roles?.data.map((role : any) => (
                <TableRow key={role.id}>
                  <td>{role.id}</td>
                  <td>{role.nom}</td>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <td colSpan={2} className="text-center">
                  Aucun rôle
                </td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
