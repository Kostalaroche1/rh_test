
// Gabriel code

/**
 * 
 * @param label EN_ATTENTE ou CONFIRME ou VALIDE ou REJET
 * @returns  string
 */
export function getStatutLabel(label: string): string {
  switch (label) {
    case "CONFIRME":
      return "confirme";
    case "EN_ATTENTE":
      return "en attente";
    case "VALIDE":
      return "valide";
    case "REJET":
      return "rejet"
    default:
      return (label || "").toLowerCase()
  }
}
/**
 * 
 * @param label EN_ATTENTE ou CONFIRME ou VALIDE ou REJET
 * @param role agent ou chiefservice ou RH
 * @returns boolean
 */
export function getStatutValue(label: string, role: string): boolean {

  if (label === "EN_ATTENTE" && role === "agent") {
    return false
  } else if (label === "CONFIRME" && role === "agent") {
    return true;
  } else if (label === "VALIDE" && role === "agent") {
    return true;
  } else if (label === "REJET" && role === "agent") {
    return true
  } else if (label === "EN_ATTENTE" && role === "chiefservice") {
    return false;
  } else if (label === "CONFIRME" && role === "chiefservice") {
    return false
  } else if (label === "VALIDE" && role === "chiefservice") {

    return true;
  } else if (label === "REJET" && role === "chiefservice") {
    return false
  }
  else if (label === "EN_ATTENTE" && role === "RH") {
    return true;
  } else if (label === "CONFIRME" && role === "RH") {
    return false
  } else if (label === "VALIDE" && role === "agent") {
    return true;
  } else if (label === "REJET" && role === "agent") {
    return true
  }
  return false
}

/**
 * 
 * @param status EN_ATTENTE ou CONFIRME ou VALIDE ou REJET
 * @returns string
 */
export function getStatutBadgeColor(status: string) {
  switch (status) {
    case "VALIDE":
      return "bg-green-100 text-green-800 border-green-300";
    case "CONFIRME":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "EN_ATTENTE":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "BROUILLON":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "PRESENT":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "RETARD":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "REJET":
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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TypeConge } from "@/utilities/type"

export function TypeCongeListAdmin({
  typeConges
}: {
  typeConges: TypeConge[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom de congé</TableHead>
          <TableHead>Code  </TableHead>
          <TableHead>Nombre jours  </TableHead>
          <TableHead>Allocation Congé</TableHead>
          <TableHead className="text-end"> createur mail</TableHead>
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
            <TableCell className="text-center">{`${type.allocationConge} fc`} </TableCell>
            <TableCell className="text-end">{type.createur.login} </TableCell>
          </TableRow>

        </TableBody>
      ))}
    </Table>
  )
}
