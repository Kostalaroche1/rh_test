"use client";

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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  <img src="/images/avatar/avatar.png" alt="avatar utilisateur" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{auth?.nom || "Utilisateur"}</span>
                <span className="truncate text-xs text-muted-foreground">{auth?.email || "user@rtnc.cd"}</span>
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
                  <AvatarImage src={user.avatar} alt={auth?.email || "user"} />
                  <AvatarFallback className="rounded-lg">
                    <img src="/images/avatar/avatar.png" alt="avatar utilisateur" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{auth?.matricule || "MATRICULE"}</span>
                  <span className="truncate font-medium">{auth?.nom || "Utilisateur"}</span>
                  <span className="truncate text-xs text-muted-foreground">{auth?.email || "user@rtnc.cd"}</span>
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
