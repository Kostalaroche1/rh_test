"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, LogOut } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logouts } from "@/app/action/logout/action";
import { usePost } from "@/hooks/useApi";
import { useAuth } from "@/app/contexts/auth/context";
import {
  PROFILE_PHOTO_UPDATED_EVENT,
  type ProfilePhotoUpdatedDetail,
  resolveAgentPhotoSrc,
} from "@/lib/client/profilePhoto";

function extractInitials(label: string) {
  const cleaned = String(label ?? "").trim();
  if (!cleaned) return "AG";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AG";
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { auth }: any = useAuth();
  const { mutateAsync, isPending } = usePost(Logouts);

  const [avatarPath, setAvatarPath] = useState<string>(String(auth?.photo ?? user.avatar ?? ""));
  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());

  useEffect(() => {
    const nextPath = String(auth?.photo ?? user.avatar ?? "").trim();
    if (!nextPath) return;
    setAvatarPath(nextPath);
    setAvatarVersion(Date.now());
  }, [auth?.photo, user.avatar]);

  useEffect(() => {
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

  const avatarSrc = useMemo(() => {
    return (
      resolveAgentPhotoSrc(avatarPath, avatarVersion) ||
      resolveAgentPhotoSrc(auth?.photo) ||
      resolveAgentPhotoSrc(user.avatar)
    );
  }, [avatarPath, avatarVersion, auth?.photo, user.avatar]);

  const displayName = useMemo(() => {
    return `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim() || auth?.nom || user.name || "Utilisateur";
  }, [auth?.nom, auth?.prenom, user.name]);

  async function handleLogout() {
    try {
      const response: any = await mutateAsync({});
      const result = await response.json();

      if (result.message) {
        window.location.href = "/";
      }
    } catch (error) {
      return error;
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-xl border border-sidebar-border/80 bg-sidebar/85 shadow-sm"
            >
              <Avatar className="h-9 w-9 rounded-lg ring-1 ring-sidebar-border/70">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="rounded-lg">{extractInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{auth?.nom || "Utilisateur"}</span>
                <span className="truncate text-xs text-muted-foreground">{auth?.email || user.email || "user@rtnc.cd"}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl border-border/70 bg-popover/95 backdrop-blur-sm"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-lg ring-1 ring-border/70">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{extractInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{auth?.matricule || "MATRICULE"}</span>
                  <span className="truncate font-medium">{auth?.nom || "Utilisateur"}</span>
                  <span className="truncate text-xs text-muted-foreground">{auth?.email || user.email || "user@rtnc.cd"}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isPending}
              className="cursor-pointer rounded-lg"
            >
              <LogOut />
              {isPending ? "Deconnexion..." : "Se deconnecter"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
