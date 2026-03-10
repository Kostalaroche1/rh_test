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
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

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
  const hiddenForRole1 = ["Organisations", "Paie & Avantages"];
  const hiddenForRole2 = ["Organisations", "Conges & Absences", "Carriere & Decisions", "Paie & Avantages", "Reporting & Analytics"];
  // const hiddenForRole3 = ["Organisations"];
  const hiddenForRole4 = ["Organisations", "Conges & Absences", "Carriere & Decisions", "Paie & Avantages"];

  const pathname = usePathname();
  const roleId = auth?.role?.[0]?.role?.id ?? auth?.role?.[0]?.roleId ?? null;

  const normalized = (label: string) =>
    label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const filteredMenuLinks = useMemo(() => {
    return items.filter((item) => {
      const title = normalized(item.title);

      if (roleId === 4) return !hiddenForRole4.includes(title);
      if (roleId === 2) return !hiddenForRole2.includes(title);
      if (roleId === 1) return !hiddenForRole1.includes(title);

      return true;
    });
  }, [items, roleId]);

  const isActivePath = (href: string) => {
    if (href === "#") return false;
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
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
