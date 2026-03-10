"use client";

import { getAgentParcours } from "@/app/action/agent/parcours/action";
import { useGet } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function toDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
}

export default function AgentParcoursPage({ agentId }: { agentId: number }) {
  const { data, isPending } = useGet(["agent-parcours", String(agentId)], () =>
    getAgentParcours(agentId)
  );

  if (isPending) {
    return (
      <div className="erp-page">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!data?.agent) {
    return (
      <div className="erp-page">
        <Card className="erp-panel rounded-2xl">
          <CardContent className="p-6">
            <p>Parcours agent introuvable.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/dashboard/agents">Retour</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const agent = data.agent;
  const affectations = Array.isArray(agent.affectations) ? agent.affectations : [];
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  const conges = Array.isArray(agent.demandeConge) ? agent.demandeConge : [];
  const paies = Array.isArray(agent.paie) ? agent.paie : [];

  return (
    <div className="erp-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Fiche Agent: {agent.nom} {agent.prenom}
          </h1>
          <p className="text-sm text-muted-foreground">
            Matricule: {agent.matricule} | Entree: {toDate(agent.dateEntree)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/agents">Retour liste agents</Link>
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="dashboard-stat-card dashboard-stat-tone-blue py-4">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Statut</p>
            <CardTitle className="dashboard-stat-value text-2xl">
              {agent.actif ? "Actif" : "Inactif"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="dashboard-stat-card dashboard-stat-tone-soft py-4">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Affectations</p>
            <CardTitle className="dashboard-stat-value text-2xl">{affectations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="dashboard-stat-card dashboard-stat-tone-sky py-4">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Demandes conge</p>
            <CardTitle className="dashboard-stat-value text-2xl">{conges.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="dashboard-stat-card dashboard-stat-tone-red py-4">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Bulletins paie</p>
            <CardTitle className="dashboard-stat-value text-2xl">{paies.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="erp-panel rounded-2xl">
        <CardHeader className="px-4 pb-2">
          <CardTitle>Parcours chronologique</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <Table className="[&_th]:px-4 [&_td]:px-4">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Evenement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeline.map((item: { date: string; type: string; label: string }, idx: number) => (
                <TableRow key={`${item.type}-${idx}`}>
                  <TableCell>{toDate(item.date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{item.label}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="erp-panel rounded-2xl">
        <CardHeader className="px-4 pb-2">
          <CardTitle>Affectations</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <Table className="[&_th]:px-4 [&_td]:px-4">
            <TableHeader>
              <TableRow>
                <TableHead>Date debut</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Departement</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affectations.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{toDate(a.dateDebut)}</TableCell>
                  <TableCell>{toDate(a.dateFin)}</TableCell>
                  <TableCell>{a.direction?.libelle ?? "-"}</TableCell>
                  <TableCell>{a.departement?.nom ?? "-"}</TableCell>
                  <TableCell>{a.poste?.libelle ?? "-"}</TableCell>
                  <TableCell>{a.statut ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

