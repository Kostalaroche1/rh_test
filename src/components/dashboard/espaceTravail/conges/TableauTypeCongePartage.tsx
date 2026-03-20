"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TypeConge } from "@/utilities/type";
import { TableauAdministrationTypeConge } from "@/components/dashboard/espaceTravail/utilitaires/statuts";

export function TableauTypeConge({
  typeConges,
  onEdit,
  onDelete,
  readOnly = true,
}: {
  typeConges: TypeConge[];
  onEdit: (type: TypeConge) => void;
  onDelete: (id: number) => void;
  readOnly?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom de conge</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Nombre de jours</TableHead>
          <TableHead>Montant allocation conge</TableHead>
          {!readOnly && <TableHead className="text-end">Action</TableHead>}
        </TableRow>
      </TableHeader>
      {typeConges.map((type) => (
        <TableBody key={type.id}>
          <TableRow>
            <TableCell className="font-medium">{type.libelle}</TableCell>
            <TableCell>{type.code}</TableCell>
            <TableCell>{type.dureeMax} jours</TableCell>
            <TableCell className="text-end">{type.allocationConge}</TableCell>
            {!readOnly && (
              <TableCell className="flex justify-end gap-4">
                <Button size="sm" variant="outline" onClick={() => onEdit(type)}>
                  Modifier
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(type.id)}>
                  Supprimer
                </Button>
              </TableCell>
            )}
          </TableRow>
        </TableBody>
      ))}
    </Table>
  );
}

export { TableauAdministrationTypeConge };

