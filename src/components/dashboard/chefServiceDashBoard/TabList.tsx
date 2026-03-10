import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TypeConge } from "@/utilities/type"

export function TypeCongeList({
  typeConges,
  onEdit,
  onDelete,
  readOnly = true,
}: {
  typeConges: TypeConge[]
  onEdit: (type: TypeConge) => void
  onDelete: (id: number) => void
  readOnly?: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom de congé</TableHead>
          <TableHead>Code  </TableHead>
          <TableHead>Nombre jours  </TableHead>
          <TableHead>Montant Allocation Congé</TableHead>
          <TableHead className="text-end">Action</TableHead>
        </TableRow>
      </TableHeader>
      {typeConges.map((type) => (
        <TableBody
          key={type.id}
        >
          <TableRow>
            <TableCell className="font-medium">{type.libelle}</TableCell>
            <TableCell >
              {type.code}
            </TableCell>
            <TableCell>
              {type.dureeMax} jours
            </TableCell>
            <TableCell className="text-end">{type.allocationConge} </TableCell>
            <TableCell className="flex gap-4 justify-end ">
              {readOnly ? (
                <span className="text-sm text-muted-foreground">Lecture seule</span>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(type)}
                  >
                    Modifier
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(type.id)}
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </TableCell>
          </TableRow>

        </TableBody>
      ))}
    </Table>
  )
}
