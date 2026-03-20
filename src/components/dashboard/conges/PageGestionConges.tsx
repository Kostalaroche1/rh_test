"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";
import RhTypeConge from "@/components/dashboard/agent/conges/RhConge";
import AdminTypeCOnge from "@/components/dashboard/agent/conges/AdminConge";
import VueDemandesCongePersonnelles from "@/components/dashboard/conges/VueDemandesCongePersonnelles";
import RevueDemandesCongeUnite from "@/components/dashboard/conges/RevueDemandesCongeUnite";
import RevueValidationDemandesConge from "@/components/dashboard/conges/RevueValidationDemandesConge";
import VueEnsembleDemandesConge from "@/components/dashboard/conges/VueEnsembleDemandesConge";

export default function PageGestionConges() {
  const { auth }: any = useAuth();

  const canReadTypeConge = hasAnyPermission(auth, [
    "type_conge.read",
    "type_conge.create",
    "type_conge.update",
    "type_conge.delete",
  ]);
  const canManageTypeConge = hasAnyPermission(auth, [
    "type_conge.create",
    "type_conge.update",
    "type_conge.delete",
  ]);
  const canReadDemandes = hasAnyPermission(auth, [
    "demande_conge.read",
    "demande_conge.request",
    "demande_conge.update",
    "demande_conge.delete",
    "demande_conge.confirm",
    "demande_conge.validate",
  ]);
  const canRequestDemandes = hasAnyPermission(auth, [
    "demande_conge.request",
    "demande_conge.update",
    "demande_conge.delete",
  ]);
  const canConfirmDemandes = hasAnyPermission(auth, ["demande_conge.confirm"]);
  const canValidateDemandes = hasAnyPermission(auth, ["demande_conge.validate"]);

  const visibleTabs = [
    canReadTypeConge ? { value: "typeconge", label: "Type Conge" } : null,
    canReadDemandes ? { value: "demandeconge", label: "Demande Conge" } : null,
  ].filter(Boolean) as { value: string; label: string }[];

  if (!visibleTabs.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun acces sur la gestion des conges.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="erp-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Gestion des conges</h1>
        <p className="text-muted-foreground">Type de conge et demandes de conge selon vos permissions.</p>
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

        {canReadTypeConge && (
          <TabsContent value="typeconge">
            {canManageTypeConge ? <RhTypeConge /> : <AdminTypeCOnge />}
          </TabsContent>
        )}

        {canReadDemandes && (
          <TabsContent value="demandeconge">
            <Tabs
              defaultValue={
                canValidateDemandes
                  ? "validation"
                  : canConfirmDemandes
                    ? "confirmation"
                    : canRequestDemandes
                      ? "mes-demandes"
                      : "vue"
              }
              className="w-full"
            >
              <TabsList className="mb-4 flex-wrap gap-2">
                {canRequestDemandes && (
                  <TabsTrigger value="mes-demandes">Mes demandes</TabsTrigger>
                )}
                {canConfirmDemandes && (
                  <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
                )}
                {canValidateDemandes && (
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                )}
                {!canRequestDemandes && !canConfirmDemandes && !canValidateDemandes && (
                  <TabsTrigger value="vue">Vue</TabsTrigger>
                )}
              </TabsList>

              {canRequestDemandes && (
                <TabsContent value="mes-demandes">
                  <VueDemandesCongePersonnelles />
                </TabsContent>
              )}

              {canConfirmDemandes && (
                <TabsContent value="confirmation">
                  <RevueDemandesCongeUnite />
                </TabsContent>
              )}

              {canValidateDemandes && (
                <TabsContent value="validation">
                  <RevueValidationDemandesConge />
                </TabsContent>
              )}

              {!canRequestDemandes && !canConfirmDemandes && !canValidateDemandes && (
                <TabsContent value="vue">
                  <VueEnsembleDemandesConge />
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

