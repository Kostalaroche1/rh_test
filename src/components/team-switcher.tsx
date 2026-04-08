"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { useAuth } from "@/app/contexts/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  PROFILE_PHOTO_UPDATED_EVENT,
  type ProfilePhotoUpdatedDetail,
  resolveAgentPhotoSrc,
} from "@/lib/client/profilePhoto";

function extractInitials(label: string) {
  const cleaned = String(label ?? "").trim();
  if (!cleaned) return "AG";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return (
    parts
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "AG"
  );
}

export function TeamSwitcher() {
  const { auth }: any = useAuth();
  const [avatarPath, setAvatarPath] = React.useState<string>(String(auth?.photo ?? ""));
  const [avatarVersion, setAvatarVersion] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const nextPath = String(auth?.photo ?? "").trim();
    if (!nextPath) return;
    setAvatarPath(nextPath);
    setAvatarVersion(Date.now());
  }, [auth?.photo]);

  React.useEffect(() => {
    const handleProfilePhotoUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ProfilePhotoUpdatedDetail>;
      const nextPath = String(customEvent.detail?.path ?? "").trim();
      if (!nextPath) return;
      setAvatarPath(nextPath);
      setAvatarVersion(customEvent.detail?.at ?? Date.now());
    };

    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, handleProfilePhotoUpdated);
    return () => {
      window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, handleProfilePhotoUpdated);
    };
  }, []);

  const activeRoleNames = Array.isArray(auth?.role)
    ? auth.role
        .filter((item: any) => item?.role?.actif ?? true)
        .map((item: any) => item?.role?.nom)
        .filter(Boolean)
    : [];

  const displayName = React.useMemo(() => {
    return `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim() || auth?.nom || "Utilisateur";
  }, [auth?.nom, auth?.prenom]);

  const avatarSrc = React.useMemo(() => {
    return resolveAgentPhotoSrc(avatarPath, avatarVersion) || resolveAgentPhotoSrc(auth?.photo) || "/images/avatar/avatar.png";
  }, [avatarPath, avatarVersion, auth?.photo]);

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
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{extractInitials(displayName)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{auth?.nom || "Utilisateur"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeRoleNames.join(", ") || "Espace de travail"}
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
