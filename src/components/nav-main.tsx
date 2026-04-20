"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { canManageAccessControl, hasAnyPermission } from "@/security/permissions";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MENU_PERMISSIONS: Record<string, string[]> = {
  "/dashboard/agents": ["agent.read", "user.read"],
  "/dashboard/dossier-agent": ["agent_dossier.read", "agent.read"],
  "/dashboard/organisation": [
    "type_unite_organisationnelle.read",
    "unite_organisationnelle.read",
    "poste.read",
    "fonction.read",
    "grade.read",
    "affectation.read",
  ],
  "/dashboard/presenceAbsence": [
    "presence.read",
    "presence.sign",
    "presence.biometric",
    "presence.confirm",
    "presence.validate",
  ],
  "/dashboard/conges": ["demande_conge.read", "demande_conge.request", "type_conge.read"],
  "/dashboard/planification": ["planification.read", "type_planification.read"],
  "/dashboard/carrieres": ["affectation.read", "agent.read"],
  "/dashboard/paie": ["paie.read"],
  "/dashboard/polyclinique": [
    "polyclinique.access",
    "polyclinique_demande.read",
    "polyclinique_demande.request",
    "polyclinique_demande.validate",
    "polyclinique_dossier.read",
    "polyclinique_dossier.create",
  ],
  "/dashboard/access": ["role.read", "permission.read"],
  "/dashboard/parametre/notifications": ["notification.read"],
  "/dashboard/parametre/session": ["user.read"],
};

export function NavMain({
  items,
  auth,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  auth: any;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getBaseHref = (href: string) => href.split("?")[0].split("#")[0];

  const filteredMenuLinks = useMemo(() => {
    const canAccessUrl = (url: string) => {
      const requiredPermissions = MENU_PERMISSIONS[url] ?? MENU_PERMISSIONS[getBaseHref(url)];
      if (!requiredPermissions?.length) {
        return true;
      }

      if (getBaseHref(url) === "/dashboard/access") {
        return canManageAccessControl(auth);
      }

      return hasAnyPermission(auth, requiredPermissions);
    };

    return items
      .map((item) => {
        const hasSubItems = Boolean(item.items?.length);
        if (!hasSubItems) {
          return canAccessUrl(item.url) ? item : null;
        }

        const visibleSubItems = (item.items ?? []).filter((subItem) => canAccessUrl(subItem.url));
        if (!visibleSubItems.length && !canAccessUrl(item.url)) {
          return null;
        }

        return {
          ...item,
          items: visibleSubItems,
        };
      })
      .filter((item): item is (typeof items)[number] => Boolean(item));
  }, [auth, items]);

  const hasMatchingQuery = (href: string) => {
    if (!href.includes("?")) return true;
    const queryString = href.split("?")[1] ?? "";
    const expected = new URLSearchParams(queryString);
    for (const [key, value] of expected.entries()) {
      if (searchParams.get(key) !== value) {
        return false;
      }
    }
    return true;
  };

  const isActivePath = (href: string) => {
    if (href === "#") return false;
    const baseHref = getBaseHref(href);
    if (baseHref === "/dashboard") return pathname === baseHref && hasMatchingQuery(href);
    if (pathname === baseHref || pathname.startsWith(`${baseHref}/`)) {
      return hasMatchingQuery(href);
    }
    return false;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-sidebar-foreground">
        Navigation ERP
      </SidebarGroupLabel>

      <SidebarMenu className="gap-1.5">
        {filteredMenuLinks.map((item) => {
          const hasSubItems = Boolean(item.items && item.items.length > 0);
          const itemIsActive =
            isActivePath(item.url) ||
            item.items?.some((subItem) => isActivePath(subItem.url));

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={Boolean(itemIsActive || item.isActive)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={cn(
                        "h-11 rounded-xl px-3 text-[13px] font-medium transition-colors",
                        itemIsActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-2 mt-1 border-l-sidebar-border">
                      {item.items?.map((subItem) => {
                        const subItemIsActive = isActivePath(subItem.url);

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={cn(
                                "h-9 rounded-lg px-2.5 text-xs font-medium",
                                subItemIsActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={cn(
                  "h-11 rounded-xl px-3 text-[13px] font-medium transition-colors",
                  itemIsActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
