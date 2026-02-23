import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActiveForm } from "./composant";

 export const renderTable = (data: any[], type: ActiveForm , confirmDelete : any , openForm : any) => (
    <Card>
      <CardHeader><CardTitle>{type}</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {type === "SITE" && <>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Adresse</TableHead>
              </>}
              {type === "DIRECTION" && <>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
              </>}
              {type === "STRUCTURE" && <>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Direction</TableHead>
              </>}
              {type === "POSTE" && <>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Département</TableHead>
              </>}
              {type === "FONCTION" && <>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Poste</TableHead>
              </>}
              {type === "GRADE" && <>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Indice</TableHead>
              </>}
              {type === "AFFECTATION" && <>
                <TableHead>Agent</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Direction</TableHead>
              </>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: any) => (
              <TableRow key={item.id}>
                {type === "SITE" && <>
                  <TableCell>{item.nom}</TableCell>
                  <TableCell>{item.ville}</TableCell>
                  <TableCell>{item.adresse}</TableCell>
                </>}
                {type === "DIRECTION" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                </>}
                {type === "STRUCTURE" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.nom}</TableCell>
                  <TableCell>{item.direction?.libelle}</TableCell>
                </>}
                {type === "POSTE" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                  <TableCell>{item.departement?.nom}</TableCell>
                </>}
                {type === "FONCTION" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                  <TableCell>{item.poste?.libelle}</TableCell>
                </>}
                {type === "GRADE" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                  <TableCell>{item.indiceSalarial}</TableCell>
                </>}
                {type === "AFFECTATION" && <>
                  <TableCell>{item.agent?.matricule}</TableCell>
                  <TableCell>{item.poste?.libelle}</TableCell>
                  <TableCell>{item.fonction?.libelle}</TableCell>
                  <TableCell>{item.grade?.libelle}</TableCell>
                  <TableCell>{item.direction?.libelle}</TableCell>
                </>}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Actions</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>

                    <DropdownMenuItem onClick={() => openForm(type, item)}>Modifier</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => confirmDelete(item.id, type)}>Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )