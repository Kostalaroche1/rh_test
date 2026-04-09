"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";
import TableauTypesPlanification from "@/components/dashboard/planification/TableauTypesPlanification";
import TableauPlanifications from "@/components/dashboard/planification/TableauPlanifications";
import CalendrierPlanifications from "@/components/dashboard/planification/CalendrierPlanifications";
import RapportPlanifications from "@/components/dashboard/planification/RapportPlanifications";

export default function PageGestionPlanification() {
  const { auth }: any = useAuth();

  const canReadTypes = hasAnyPermission(auth, [
    "type_planification.read",
    "type_planification.create",
    "type_planification.update",
    "type_planification.delete",
  ]);
  const canReadPlanifications = hasAnyPermission(auth, [
    "planification.read",
    "planification.create",
    "planification.update",
    "planification.delete",
    "planification.assign",
    "planification.validate",
  ]);

  const visibleTabs = [
    canReadTypes ? { value: "types", label: "Types" } : null,
    canReadPlanifications ? { value: "planifications", label: "Planifications" } : null,
    canReadPlanifications ? { value: "calendrier", label: "Calendrier" } : null,
    canReadPlanifications ? { value: "rapport", label: "Rapport" } : null,
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  if (!visibleTabs.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun acces sur la planification RH.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="erp-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Planification RH</h1>
        <p className="text-muted-foreground">
          Planifiez les actions RH a venir, liees ou non a un conge, une affectation ou une unite.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue={visibleTabs[0].value} className="w-full">
        <TabsList className="mb-4">
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {canReadTypes && (
          <TabsContent value="types">
            <TableauTypesPlanification />
          </TabsContent>
        )}

        {canReadPlanifications && (
          <TabsContent value="planifications">
            <TableauPlanifications />
          </TabsContent>
        )}

        {canReadPlanifications && (
          <TabsContent value="calendrier">
            <CalendrierPlanifications />
          </TabsContent>
        )}

        {canReadPlanifications && (
          <TabsContent value="rapport">
            <RapportPlanifications />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
