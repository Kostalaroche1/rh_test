"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AgentProvider } from "../contexts/agents/context";
import { StatAgentProvider } from "../contexts/agents/stats/context";
import HeaderWithNotifications from "./HeaderWithNotification";
import SessionHeartbeat from "@/components/session-heartbeat";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const breadcrumbItems = React.useMemo(() => {
    const pathSegments = pathname.split("/").filter(Boolean);

    return pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      const label = segment
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      return { href, label };
    });
  }, [pathname]);

  return (
    <div className="erp-shell [--header-height:4rem]">
      <SidebarProvider className="h-svh w-full">
        <SessionHeartbeat />
        <div className="flex h-svh w-full overflow-hidden p-2 md:p-3">
          <AppSidebar />

          <SidebarInset className="erp-panel h-full overflow-hidden rounded-2xl bg-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95">
            <header className="erp-panel sticky top-0 z-20 m-2 mb-0 flex h-[--header-height] shrink-0 items-center gap-2 rounded-xl px-4 md:px-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 rounded-lg" />
                <Separator orientation="vertical" className="mr-1 h-5" />

                <Breadcrumb className="min-w-0">
                  <BreadcrumbList>
                    {breadcrumbItems.map((item, index) => (
                      <React.Fragment key={item.href}>
                        {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                        <BreadcrumbItem>
                          {index === breadcrumbItems.length - 1 ? (
                            <BreadcrumbPage className="truncate text-sm font-semibold">
                              {item.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink className="text-xs md:text-sm" href={item.href}>
                              {item.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <HeaderWithNotifications breadcrumbItems={breadcrumbItems} />
            </header>

            <main className="flex-1 overflow-y-auto p-2 md:p-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
              <AgentProvider>
                <StatAgentProvider>{children}</StatAgentProvider>
              </AgentProvider>
            </main>

            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                className:
                  "animate-in slide-in-from-right-full fade-in-0 duration-300",
              }}
            />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
