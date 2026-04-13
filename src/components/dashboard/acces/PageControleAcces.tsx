"use client";

import Link from "next/link";
import { Hospital } from "lucide-react";

import MatricePermissions from "@/components/dashboard/acces/MatricePermissions";
import { useAuth } from "@/app/contexts/auth/context";
import { POLYCLINIQUE_ACCESS_CODES } from "@/polyclinique/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyPermission } from "@/security/permissions";

export default function PageControleAcces() {
  const { auth }: any = useAuth();
  const canOpenPolyclinique = hasAnyPermission(auth, POLYCLINIQUE_ACCESS_CODES);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Roles et Permissions</CardTitle>
              <CardDescription>
                Gere les roles de l'entreprise, charge le catalogue standard et attribue les permissions.
              </CardDescription>
            </div>
            {canOpenPolyclinique ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/polyclinique">
                  <Hospital className="mr-2 h-4 w-4" />
                  Ouvrir la polyclinique
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <MatricePermissions />
        </CardContent>
      </Card>
    </div>
  );
}

