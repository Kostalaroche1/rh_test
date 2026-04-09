"use client";

import { useMemo } from "react";

import { GetPlanifications, type PlanificationItem } from "@/app/action/planification/action";
import { useGet } from "@/hooks/useApi";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatShortDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("fr-FR");
}

type CountRow = {
  label: string;
  count: number;
};

export default function RapportPlanifications() {
  const { auth }: any = useAuth();
  const canRead = hasAnyPermission(auth, [
    "planification.read",
    "planification.create",
    "planification.update",
    "planification.delete",
    "planification.assign",
    "planification.validate",
  ]);
  const { data: planificationsRaw = [], isPending } = useGet<PlanificationItem[]>(
    ["planifications-reporting"],
    GetPlanifications
  );

  const planifications = Array.isArray(planificationsRaw) ? planificationsRaw : [];

  const metrics = useMemo(() => {
    const today = startOfToday();
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const total = planifications.length;
    const upcoming = planifications.filter((item) => {
      const dateDebut = new Date(item.dateDebut);
      return !Number.isNaN(dateDebut.getTime()) && dateDebut >= today && dateDebut <= in30Days;
    }).length;
    const holidays = planifications.filter(
      (item) => item.typePlanification?.code === "JOUR_FERIE"
    ).length;
    const drafts = planifications.filter((item) => item.statut === "BROUILLON").length;

    return { total, upcoming, holidays, drafts };
  }, [planifications]);

  const byType = useMemo<CountRow[]>(() => {
    const counts = new Map<string, number>();
    for (const item of planifications) {
      const label = item.typePlanification?.nom ?? "Non classe";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count);
  }, [planifications]);

  const byTarget = useMemo<CountRow[]>(() => {
    const labels: Record<PlanificationItem["cible"], string> = {
      INDIVIDUEL: "Individuel",
      UNITE: "Unite",
      PROVINCE: "Province",
      TOUTE_ORGANISATION: "Toute l'organisation",
    };

    const counts = new Map<string, number>();
    for (const item of planifications) {
      const label = labels[item.cible];
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count);
  }, [planifications]);

  const recentItems = useMemo(() => {
    return [...planifications]
      .sort(
        (left, right) =>
          new Date(left.dateDebut).getTime() - new Date(right.dateDebut).getTime()
      )
      .slice(0, 8);
  }, [planifications]);

  if (!canRead) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun acces sur le reporting de planification.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="dashboard-stat-card py-4 dashboard-stat-tone-blue">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Total</p>
            <CardTitle className="dashboard-stat-value text-3xl">{metrics.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="dashboard-stat-card py-4 dashboard-stat-tone-soft">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">A venir 30 jours</p>
            <CardTitle className="dashboard-stat-value text-3xl">{metrics.upcoming}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="dashboard-stat-card py-4 dashboard-stat-tone-red">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Jours feries</p>
            <CardTitle className="dashboard-stat-value text-3xl">{metrics.holidays}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="dashboard-stat-card py-4 dashboard-stat-tone-sky">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Brouillons</p>
            <CardTitle className="dashboard-stat-value text-3xl">{metrics.drafts}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Repartition par type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : byType.length > 0 ? (
              byType.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{row.label}</span>
                  <Badge variant="secondary">{row.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune planification disponible.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Repartition par cible</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : byTarget.length > 0 ? (
              byTarget.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{row.label}</span>
                  <Badge variant="outline">{row.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune planification disponible.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prochaines planifications</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date debut</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : recentItems.length > 0 ? (
                recentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titre}</TableCell>
                    <TableCell>{item.typePlanification?.nom ?? "--"}</TableCell>
                    <TableCell>{formatShortDate(item.dateDebut)}</TableCell>
                    <TableCell>{formatShortDate(item.dateFin)}</TableCell>
                    <TableCell>{item.cible}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.statut}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucune planification disponible.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
