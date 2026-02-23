'use client'
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

export default function GestionFormationDashboard() {
  const [openDialog, setOpenDialog] = useState(false);

  const formations = [
    { titre: "React Avancé", dateDebut: "2026-02-10", dateFin: "2026-02-12", participants: 5, max: 10, status: "En cours" },
    { titre: "Gestion du temps", dateDebut: "2026-03-01", dateFin: "2026-03-03", participants: 3, max: 5, status: "Planifiée" },
    { titre: "Communication", dateDebut: "2026-01-20", dateFin: "2026-01-22", participants: 4, max: 4, status: "Terminée" },
  ];

  return (
    <div className="erp-page">
      <h1 className="text-3xl font-bold mb-2">Dashboard Chef de Service</h1>

      <Tabs defaultValue="formations" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="formations">Gestion Formations</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        {/* Gestion des Formations */}
        <TabsContent value="formations" className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Formations Planifiées / En cours</h2>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="w-5 h-5 mr-2" /> Nouvelle Formation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Créer une Formation</DialogTitle>
                </DialogHeader>
                <form className="flex flex-col gap-4 mt-4">
                  <Input placeholder="Titre de la formation" />
                  <Input type="date" placeholder="Date de début" />
                  <Input type="date" placeholder="Date de fin" />
                  <textarea placeholder="Description / Objectifs" />
                  <Input type="number" placeholder="Nombre maximum de participants" />
                  <Button type="submit" className="mt-2 w-full">Créer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formations.map((formation, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50">
                      <TableCell>{formation.titre}</TableCell>
                      <TableCell>{formation.dateDebut}</TableCell>
                      <TableCell>{formation.dateFin}</TableCell>
                      <TableCell>{formation.participants}/{formation.max}</TableCell>
                      <TableCell>{formation.status}</TableCell>
                      <TableCell>
                        <progress value={(formation.participants / formation.max) * 100} />
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                        <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents */}
        <TabsContent value="agents">
          <p>… Tableau des agents et affectations …</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
