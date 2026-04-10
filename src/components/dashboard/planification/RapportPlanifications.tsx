"use client";

import { useEffect, useMemo, useState } from "react";

import { GetPlanifications, type PlanificationItem } from "@/app/action/planification/action";
import { useGet } from "@/hooks/useApi";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function getPriorityBadgeVariant(priority: PlanificationItem["priorite"]) {
  switch (priority) {
    case "CRITIQUE":
      return "destructive";
    case "ELEVEE":
      return "secondary";
    default:
      return "outline";
  }
}

export default function RapportPlanifications() {
  const { auth }: any = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
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

  const byPriority = useMemo<CountRow[]>(() => {
    const labels: Record<PlanificationItem["priorite"], string> = {
      CRITIQUE: "Critique",
      ELEVEE: "Elevee",
      NORMALE: "Normale",
      FAIBLE: "Faible",
    };

    const counts = new Map<string, number>();
    for (const item of planifications) {
      const label = labels[item.priorite];
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    const order = ["Critique", "Elevee", "Normale", "Faible"];

    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => order.indexOf(left.label) - order.indexOf(right.label));
  }, [planifications]);

  const recentItems = useMemo(() => {
    return [...planifications]
      .sort(
        (left, right) =>
          new Date(left.dateDebut).getTime() - new Date(right.dateDebut).getTime()
      )
      .slice(0, 50);
  }, [planifications]);

  const totalPages = Math.max(1, Math.ceil(recentItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRecentItems = useMemo(() => {
    return recentItems.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [currentPage, pageSize, recentItems]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

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

      <div className="grid gap-4 xl:grid-cols-3">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Repartition par priorite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : byPriority.length > 0 ? (
              byPriority.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{row.label}</span>
                  <Badge
                    variant={
                      row.label === "Critique"
                        ? "destructive"
                        : row.label === "Elevee"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {row.count}
                  </Badge>
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
                <TableHead>Priorite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : recentItems.length > 0 ? (
                paginatedRecentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titre}</TableCell>
                    <TableCell>{item.typePlanification?.nom ?? "--"}</TableCell>
                    <TableCell>{formatShortDate(item.dateDebut)}</TableCell>
                    <TableCell>{formatShortDate(item.dateFin)}</TableCell>
                    <TableCell>{item.cible}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.statut}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(item.priorite)}>
                        {item.priorite}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucune planification disponible.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isPending && recentItems.length > 0 && (
        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Lignes par page</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {recentItems.length} element{recentItems.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
            >
              Premier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Precedent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Suivant
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              Dernier
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
