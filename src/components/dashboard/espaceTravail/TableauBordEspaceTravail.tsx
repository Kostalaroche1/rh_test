"use client";

import Link from "next/link";
import {
  ClipboardCheck,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/app/contexts/auth/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { canManageAccessControl, hasAnyPermission } from "@/security/permissions";

type ModuleCard = {
  title: string;
  description: string;
  href: string;
  icon: any;
  permissions: string[];
};

const MODULES: ModuleCard[] = [
  {
    title: "Agents",
    description: "Comptes, dossiers agents et parcours.",
    href: "/dashboard/agents",
    icon: Users,
    permissions: ["agent.read", "user.read"],
  },
  {
    title: "Organisation",
    description: "Types d'unite, unites, postes, fonctions, grades et affectations.",
    href: "/dashboard/organisation",
    icon: Building2,
    permissions: [
      "province.read",
      "type_unite_organisationnelle.read",
      "unite_organisationnelle.read",
      "poste.read",
      "fonction.read",
      "grade.read",
      "affectation.read",
    ],
  },
  {
    title: "Presences & Absences",
    description: "Pointage, confirmation, validation et suivi des absences.",
    href: "/dashboard/presenceAbsence",
    icon: ClipboardCheck,
    permissions: ["presence.read", "presence.sign", "presence.confirm", "presence.validate"],
  },
  {
    title: "Conges",
    description: "Types de conge et demandes selon vos permissions.",
    href: "/dashboard/conges",
    icon: CalendarDays,
    permissions: ["demande_conge.read", "demande_conge.request", "type_conge.read"],
  },
  {
    title: "Carrieres",
    description: "Decisions et suivi des affectations.",
    href: "/dashboard/carrieres",
    icon: TrendingUp,
    permissions: ["affectation.read", "agent.read"],
  },
  {
    title: "Paie",
    description: "Bulletins, paiements et avantages.",
    href: "/dashboard/paie",
    icon: Wallet,
    permissions: ["paie.read"],
  },
  {
    title: "Controle d'acces",
    description: "Roles, permissions et portees.",
    href: "/dashboard/access",
    icon: ShieldCheck,
    permissions: ["role.read", "permission.read"],
  },
];

export default function TableauBordEspaceTravail() {
  const { auth }: any = useAuth();

  const availableModules = MODULES.filter((module) => {
    if (module.href === "/dashboard/access") {
      return canManageAccessControl(auth) || hasAnyPermission(auth, module.permissions);
    }

    return hasAnyPermission(auth, module.permissions);
  });

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
          Tableau de bord generique base sur les permissions et l'organisation active.
        </p>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-2">
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
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {availableModules.map((module) => {
          const Icon = module.icon;

          return (
            <Card key={module.href} className="border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted p-2">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1">
                  {module.permissions.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-[11px]">
                      {permission}
                    </Badge>
                  ))}
                  {module.permissions.length > 3 && (
                    <Badge variant="secondary" className="text-[11px]">
                      +{module.permissions.length - 3}
                    </Badge>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link href={module.href}>Ouvrir</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border border-dashed border-border bg-card/60">
        <CardHeader className="flex flex-row items-center gap-3">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Principe de maintenance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Les ecrans montes doivent dependre des permissions, du poste et de l'unite, pas du nom d'un role fixe.
            </p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

