import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TypeConge } from "@/utilities/type";

export function obtenirLibelleStatut(label: string): string {
  switch (label) {
    case "CONFIRME":
      return "confirmer";
    case "EN_ATTENTE":
      return "mettre en attente";
    case "VALIDE":
      return "valider";
    case "REJET":
    case "REJETE":
      return "rejeter";
    default:
      return (label || "").toLowerCase();
  }
}

export function obtenirValeurStatut(label: string, workflow: string): boolean {
  if (workflow === "own") {
    return ["CONFIRME", "VALIDE", "REJET", "REJETE"].includes(label);
  }
  if (workflow === "team") {
    return label === "VALIDE";
  }
  if (workflow === "validation") {
    return ["EN_ATTENTE", "VALIDE", "REJET", "REJETE"].includes(label);
  }
  return false;
}

export function obtenirCouleurBadgeStatut(status: string) {
  switch (status) {
    case "VALIDE":
      return "bg-green-100 text-green-800 border-green-300";
    case "CONFIRME":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "EN_ATTENTE":
    case "BROUILLON":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "PRESENT":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "RETARD":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "REJET":
    case "REJETE":
      return "bg-red-100 text-red-800 border-red-300";
    case "ABSENT":
      return "bg-rose-100 text-rose-800 border-rose-300";
    case "CONGE":
      return "bg-indigo-100 text-indigo-800 border-indigo-300";
    case "MISSION":
      return "bg-cyan-100 text-cyan-800 border-cyan-300";
    case "MALADIE":
      return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export function TableauAdministrationTypeConge({ typeConges }: { typeConges: TypeConge[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom de conge</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Nombre de jours</TableHead>
          <TableHead>Allocation conge</TableHead>
          <TableHead className="text-end">Createur</TableHead>
        </TableRow>
      </TableHeader>
      {typeConges.map((type) => (
        <TableBody key={type.id}>
          <TableRow>
            <TableCell className="font-medium">{type.libelle}</TableCell>
            <TableCell>{type.code}</TableCell>
            <TableCell>{type.dureeMax} jours</TableCell>
            <TableCell className="text-center">{type.allocationConge} fc</TableCell>
            <TableCell className="text-end">{type.createur?.login ?? "--"}</TableCell>
          </TableRow>
        </TableBody>
      ))}
    </Table>
  );
}
