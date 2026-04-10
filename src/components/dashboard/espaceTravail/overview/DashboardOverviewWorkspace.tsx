"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, LayoutDashboard, Settings2 } from "lucide-react";

import { useAuth } from "@/app/contexts/auth/context";
import { useNotification } from "@/app/contexts/notification/context";
import { GetDashAgentAdmin } from "@/app/action/agent/dash/action";
import { GetPlanifications, type PlanificationItem } from "@/app/action/planification/action";
import { useGet } from "@/hooks/useApi";
import { canManageAccessControl, hasAnyPermission } from "@/security/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { MODULES } from "./constants";
import type { DashAdminPayload } from "./types";
import {
  buildMonthlySeries,
  buildOverviewAnalytics,
  buildYearList,
  formatCount,
  resolveAgentRattachement,
  toSafeNumber,
} from "./helpers";
import KpiCardsGrid from "./KpiCardsGrid";
import YearlyTrendSection from "./YearlyTrendSection";
import NotificationsCard from "./NotificationsCard";
import ProvinceDirectoryCard from "./ProvinceDirectoryCard";
import CircularAnalyticsSection from "./CircularAnalyticsSection";
import OrganisationHierarchyCard from "./OrganisationHierarchyCard";
import QuickModulesSection from "./QuickModulesSection";
import CurrentUserScopeCard from "./CurrentUserScopeCard";

export default function DashboardOverviewWorkspace() {
  const { auth }: any = useAuth();
  const { notifications = [], markAsRead }: any = useNotification();
  const { data: dashboardRaw, isPending: isPendingDashboard } = useGet(["DashAgentAdmin"], GetDashAgentAdmin);
  const { data: planificationsRaw = [] } = useGet<PlanificationItem[]>(
    ["workspace-planifications"],
    GetPlanifications
  );

  const dashboard = useMemo<DashAdminPayload | null>(() => {
    if (!dashboardRaw || typeof dashboardRaw !== "object") return null;
    return dashboardRaw as DashAdminPayload;
  }, [dashboardRaw]);

  const canReadAgents = hasAnyPermission(auth, ["agent.read"]);
  const canReadPresence = hasAnyPermission(auth, ["presence.read", "presence.sign", "presence.confirm", "presence.validate"]);
  const canReadConges = hasAnyPermission(auth, ["demande_conge.read", "demande_conge.request", "demande_conge.confirm", "demande_conge.validate"]);
  const canReadType = hasAnyPermission(auth, ["type_unite_organisationnelle.read"]);
  const canReadOrganisation = hasAnyPermission(auth, ["unite_organisationnelle.read"]);
  const canReadProvince = hasAnyPermission(auth, ["province.read"]);
  const canReadAffectation = hasAnyPermission(auth, ["affectation.read"]);
  const canReadNotifications = hasAnyPermission(auth, ["notification.read"]);
  const canReadPlanifications = hasAnyPermission(auth, ["planification.read"]);
  const canReadOverview =
    canReadAgents ||
    canReadPresence ||
    canReadConges ||
    canReadOrganisation ||
    canReadType ||
    canReadProvince ||
    canReadAffectation;

  const provinces = useMemo(() => {
    return Array.isArray(dashboard?.organisation?.provinces) ? dashboard!.organisation!.provinces! : [];
  }, [dashboard]);
  const types = useMemo(() => {
    return Array.isArray(dashboard?.organisation?.types) ? dashboard!.organisation!.types! : [];
  }, [dashboard]);

  const hasGlobalProvinceScope = dashboard?.scope?.hasGlobalProvinceAccess === true;
  const showProvinceSelect = canReadProvince && hasGlobalProvinceScope && provinces.length > 1;

  const [selectedProvinceId, setSelectedProvinceId] = useState("all");

  useEffect(() => {
    if (!showProvinceSelect && selectedProvinceId !== "all") {
      setSelectedProvinceId("all");
    }
  }, [selectedProvinceId, showProvinceSelect]);

  useEffect(() => {
    if (selectedProvinceId === "all") return;
    const exists = provinces.some((province) => String(province.id) === selectedProvinceId);
    if (!exists) {
      setSelectedProvinceId("all");
    }
  }, [provinces, selectedProvinceId]);

  const selectedProvinceNumeric = selectedProvinceId === "all" ? null : Number(selectedProvinceId);
  const selectedProvince = provinces.find((province) => province.id === selectedProvinceNumeric) ?? null;

  const [moduleSearch, setModuleSearch] = useState("");
  const moduleSearchTerm = moduleSearch.trim().toLowerCase();

  const visibleModules = useMemo(() => {
    const modules = MODULES.filter((module) => {
      if (module.href === "/dashboard/access") {
        return canManageAccessControl(auth) || hasAnyPermission(auth, module.permissions);
      }
      return hasAnyPermission(auth, module.permissions);
    });

    if (!moduleSearchTerm) return modules;
    return modules.filter((module) =>
      `${module.title} ${module.description}`.toLowerCase().includes(moduleSearchTerm)
    );
  }, [auth, moduleSearchTerm]);

  const [listSearch, setListSearch] = useState("");
  const listSearchTerm = listSearch.trim().toLowerCase();
  const filteredProvinceDirectory = useMemo(() => {
    if (!listSearchTerm) return provinces;

    return provinces.filter((province) => {
      const provinceText = `${province.code} ${province.nom}`.toLowerCase();
      if (provinceText.includes(listSearchTerm)) return true;
      return (province.unites ?? []).some((direction) =>
        `${direction.code} ${direction.nom}`.toLowerCase().includes(listSearchTerm)
      );
    });
  }, [listSearchTerm, provinces]);

  const analytics = useMemo(() => {
    return buildOverviewAnalytics(dashboard, selectedProvinceNumeric);
  }, [dashboard, selectedProvinceNumeric]);

  const allAgents = useMemo(() => {
    return Array.isArray(dashboard?.AgentsPresences) ? dashboard!.AgentsPresences! : [];
  }, [dashboard]);

  const connectedAgent = useMemo(() => {
    const authMatricule = String(auth?.matricule ?? "").trim().toUpperCase();
    if (!authMatricule) return null;

    return (
      allAgents.find(
        (agent) => String(agent?.matricule ?? "").trim().toUpperCase() === authMatricule
      ) ?? null
    );
  }, [allAgents, auth?.matricule]);

  const connectedRattachement = useMemo(() => {
    return resolveAgentRattachement(connectedAgent);
  }, [connectedAgent]);

  const [connectedPhotoPath, setConnectedPhotoPath] = useState("");

  useEffect(() => {
    setConnectedPhotoPath(String(connectedAgent?.photo ?? ""));
  }, [connectedAgent?.photo]);

  const years = useMemo(() => buildYearList(), []);

  const presenceByYearData = useMemo(() => {
    return buildMonthlySeries(analytics.filteredAgents, years, (agent) =>
      (agent.presences ?? []).map((presence) => presence.date)
    );
  }, [analytics.filteredAgents, years]);

  const congesByYearData = useMemo(() => {
    return buildMonthlySeries(analytics.filteredAgents, years, (agent) =>
      (agent.demandeConge ?? []).map((demande) => demande.dateDemande ?? demande.dateDebut)
    );
  }, [analytics.filteredAgents, years]);

  const overviewCounts = useMemo(() => {
    let actifs = 0;
    let presences = 0;
    let absences = 0;
    let demandesConges = 0;

    for (const agent of analytics.filteredAgents) {
      if (agent.actif !== false) actifs += 1;

      for (const presence of agent.presences ?? []) {
        const statut = String(presence?.statut ?? "").toUpperCase();
        if (statut === "ABSENT") {
          absences += 1;
          continue;
        }
        if (presence?.heureArrivee || statut === "PRESENCE" || statut === "RETARD" || statut === "MISSION" || statut === "MALADIE" || statut === "CONGE") {
          presences += 1;
        }
      }

      demandesConges += (agent.demandeConge ?? []).length;
    }

    const useRaw = selectedProvinceNumeric == null;

    return {
      actifs: useRaw ? toSafeNumber(dashboard?.actif) : actifs,
      presences: useRaw ? toSafeNumber(dashboard?.presences) : presences,
      absences: useRaw ? toSafeNumber(dashboard?.absences) : absences,
      demandesConges: useRaw ? toSafeNumber(dashboard?.demandeconges) : demandesConges,
      affectations: analytics.activeAffectationsCount,
      stations: analytics.scopedStationsCount,
      directions: analytics.scopedDirectionsCount,
    };
  }, [analytics, dashboard, selectedProvinceNumeric]);

  const kpiItems = useMemo(() => {
    const items: Array<{ title: string; value: string; tone: string; description?: string }> = [];

    if (canReadAgents) {
      items.push({
        title: "Agents actifs",
        value: formatCount(overviewCounts.actifs),
        tone: "dashboard-stat-tone-blue",
      });
    }

    if (canReadPresence) {
      items.push({
        title: "Presences",
        value: formatCount(overviewCounts.presences),
        tone: "dashboard-stat-tone-sky",
      });
      items.push({
        title: "Absences",
        value: formatCount(overviewCounts.absences),
        tone: "dashboard-stat-tone-red",
      });
    }

    if (canReadConges) {
      items.push({
        title: "Demandes de conge",
        value: formatCount(overviewCounts.demandesConges),
        tone: "dashboard-stat-tone-soft",
      });
    }

    if (canReadType) {
      items.push({
        title: "Stations (types)",
        value: formatCount(overviewCounts.stations),
        tone: "dashboard-stat-tone-blue",
      });
    }

    if (canReadOrganisation) {
      items.push({
        title: "Directions (unites)",
        value: formatCount(overviewCounts.directions),
        tone: "dashboard-stat-tone-sky",
      });
    }

    if (canReadAffectation) {
      items.push({
        title: "Affectations actives",
        value: formatCount(overviewCounts.affectations),
        tone: "dashboard-stat-tone-soft",
      });
    }

    return items;
  }, [canReadAffectation, canReadAgents, canReadConges, canReadOrganisation, canReadPresence, canReadType, overviewCounts]);

  const latestNotifications = useMemo(() => {
    if (!canReadNotifications || !Array.isArray(notifications)) return [];
    return notifications.slice(0, 8);
  }, [canReadNotifications, notifications]);

  const upcomingPlanifications = useMemo(() => {
    const items = Array.isArray(planificationsRaw) ? planificationsRaw : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limit = new Date(today);
    limit.setDate(limit.getDate() + 14);

    const priorityOrder: Record<PlanificationItem["priorite"], number> = {
      CRITIQUE: 0,
      ELEVEE: 1,
      NORMALE: 2,
      FAIBLE: 3,
    };

    return items
      .filter((item) => {
        const dateDebut = new Date(item.dateDebut);
        if (Number.isNaN(dateDebut.getTime())) return false;
        return dateDebut >= today && dateDebut <= limit;
      })
      .sort((left, right) => {
        const priorityDelta =
          priorityOrder[left.priorite] - priorityOrder[right.priorite];
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(left.dateDebut).getTime() - new Date(right.dateDebut).getTime();
      })
      .slice(0, 5);
  }, [planificationsRaw]);

  const activeRoleNames = Array.isArray(auth?.role)
    ? auth.role
        .filter((item: any) => item?.role?.actif ?? true)
        .map((item: any) => item?.role?.nom)
        .filter(Boolean)
    : [];

  return (
    <div className="erp-page">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Espace de travail</h1>
        </div>
        <p className="text-muted-foreground">
          Vue enrichie selon vos permissions: stations (types), directions (unites), affectations et repartitions.
        </p>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{auth?.nom || "Utilisateur"}</Badge>
        {activeRoleNames.length > 0 ? (
          activeRoleNames.map((roleName: string) => (
            <Badge key={roleName} variant="outline">
              {roleName}
            </Badge>
          ))
        ) : (
          <Badge variant="outline">Aucun role actif</Badge>
        )}

        {showProvinceSelect && (
          <div className="ml-auto w-full md:w-[320px]">
            <Select value={selectedProvinceId} onValueChange={setSelectedProvinceId}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les provinces</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={String(province.id)}>
                    {province.code} - {province.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedProvince && (
        <Badge variant="outline" className="w-fit">
          Province active: {selectedProvince.code} - {selectedProvince.nom}
        </Badge>
      )}

      <CurrentUserScopeCard
        agentId={connectedAgent?.id ?? null}
        photo={connectedPhotoPath || connectedAgent?.photo || null}
        canUploadPhoto={Boolean(connectedAgent?.id)}
        onPhotoUpdated={setConnectedPhotoPath}
        userLabel={`${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim() || "Utilisateur"}
        province={connectedRattachement?.province ?? null}
        station={connectedRattachement?.station ?? null}
        direction={connectedRattachement?.direction ?? null}
        niveauDirection={connectedRattachement?.niveauDirection ?? null}
      />

      {canReadOverview && (
        <>
          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <Card className="erp-panel">
              <CardHeader className="pb-3">
                <CardTitle>Vue generale</CardTitle>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                {isPendingDashboard ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Skeleton className="h-28 w-full" />
                      <Skeleton className="h-28 w-full" />
                      <Skeleton className="h-28 w-full" />
                    </div>
                    <Skeleton className="h-72 w-full" />
                  </>
                ) : (
                  <>
                    <KpiCardsGrid items={kpiItems} />
                    <YearlyTrendSection
                      years={years}
                      presenceData={presenceByYearData}
                      congesData={congesByYearData}
                    />
                  </>
                )}
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              {canReadNotifications && (
                <NotificationsCard
                  notifications={latestNotifications}
                  onMarkAsRead={(id) => {
                    if (typeof markAsRead === "function") {
                      void markAsRead(id);
                    }
                  }}
                />
              )}

              {canReadProvince && (
                <ProvinceDirectoryCard
                  provinces={filteredProvinceDirectory}
                  listSearch={listSearch}
                  onSearchChange={setListSearch}
                  selectedProvinceId={selectedProvinceNumeric}
                  canSelectProvince={showProvinceSelect}
                  onSelectProvince={(provinceId) => setSelectedProvinceId(String(provinceId))}
                />
              )}
            </div>
          </section>

          <CircularAnalyticsSection
            analytics={analytics}
            visibility={{
              canReadAgents,
              canReadOrganisation,
              canReadProvince,
              canReadType,
              canReadAffectation,
              canReadPresence,
              canReadConges,
            }}
          />

          {(canReadType || canReadOrganisation) && (
            <OrganisationHierarchyCard
              types={types}
              directionTreeByTypeId={analytics.directionTreeByTypeId}
              presenceCountByDirectionId={analytics.presenceCountByDirectionId}
              congeCountByDirectionId={analytics.congeCountByDirectionId}
            />
          )}
        </>
      )}

      {canReadPlanifications && (
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Planifications prioritaires a venir</CardTitle>
              <p className="text-sm text-muted-foreground">
                Les priorites critiques et elevees remontent en premier sur les 14 prochains jours.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted p-2">
              <CalendarClock className="h-5 w-5" />
            </div>
          </CardHeader>
          <div className="space-y-3 px-6 pb-6">
            {upcomingPlanifications.length > 0 ? (
              upcomingPlanifications.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.titre}</p>
                      <Badge
                        variant={
                          item.priorite === "CRITIQUE"
                            ? "destructive"
                            : item.priorite === "ELEVEE"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {item.priorite}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.dateDebut).toLocaleDateString("fr-FR")}
                      {item.dateFin
                        ? ` -> ${new Date(item.dateFin).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.typePlanification?.nom ?? "Planification"}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/planification">Voir</Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                Aucune planification a venir sur les 14 prochains jours.
              </div>
            )}
          </div>
        </Card>
      )}

      <QuickModulesSection
        modules={visibleModules}
        searchValue={moduleSearch}
        onSearchChange={setModuleSearch}
      />

      <Card className="border border-dashed border-border bg-card/60">
        <CardHeader className="flex flex-row items-center gap-3">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Principe de maintenance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Les widgets du dashboard sont actives par permissions. Les libelles front suivent le vocabulaire:
              station (type), direction (unite), sous-direction, bureau.
            </p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
