"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { data } from "@/utilities/menu_dashboard"
import { useAuth } from "@/app/contexts/auth/context"
import { ThemeSwitcher } from "./theme-switcher"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
   const {auth} : any = useAuth()
   const sidebarUser = {
    ...data.user,
    name: `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim() || auth?.nom || data.user.name,
    email: auth?.email || data.user.email,
    avatar: auth?.photo || data.user.avatar,
   }
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader className="pb-1">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} auth={auth} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter className="gap-3 pt-0">
        <ThemeSwitcher className="group-data-[collapsible=icon]:hidden" />
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
