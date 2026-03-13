"use client";

import PermissionManager from "@/components/dashboard/tabord/tables/permissionManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessControlPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Roles et Permissions</CardTitle>
          <CardDescription>
            Gere les roles de l'entreprise, charge le catalogue standard et attribue les permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <PermissionManager />
        </CardContent>
      </Card>
    </div>
  );
}
