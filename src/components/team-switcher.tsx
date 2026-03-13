"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth } from "@/app/contexts/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    key: string;
  }[];
}) {
  const activeTeam = teams[0];
  const { auth }: any = useAuth();
  const activeRoleNames = Array.isArray(auth?.role)
    ? auth.role
        .filter((item: any) => item?.role?.actif ?? true)
        .map((item: any) => item?.role?.nom)
        .filter(Boolean)
    : [];

  if (!activeTeam) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-xl border border-sidebar-border bg-sidebar shadow-sm"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-9 items-center justify-center rounded-xl shadow-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/images/logo.png" alt={auth?.email || "user"} />
                  <AvatarFallback className="rounded-lg">RT</AvatarFallback>
                </Avatar>
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{auth?.nom || "Utilisateur"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeRoleNames.join(", ") || activeTeam.name || "ERP RH"}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
