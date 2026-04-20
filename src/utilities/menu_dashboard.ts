import {
  ClipboardCheck,
  Building2,
  CalendarDays,
  CalendarRange,
  Command,
  FolderOpen,
  Hospital,
  LayoutDashboard,
  LifeBuoy,
  Send,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export const data = {
  user: {
    name: "workspace",
    email: "workspace@example.com",
    avatar: "/images/avatar/avatar.png",
  },
  teams: [
    {
      key: "workspace",
      name: "Espace de travail",
      logo: Command,
    },
  ],
  navMain: [
    {
      title: "Tableau de bord",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Agents",
      url: "/dashboard/agents",
      icon: Users,
    },
    {
      title: "Organisations",
      url: "/dashboard/organisation",
      icon: Building2,
    },
    {
      title: "Dossier agent",
      url: "/dashboard/dossier-agent",
      icon: FolderOpen,
    },
    {
      title: "Presences & Absences",
      url: "/dashboard/presenceAbsence",
      icon: ClipboardCheck,
    },
    {
      title: "Conges",
      url: "/dashboard/conges",
      icon: CalendarDays,
    },
    {
      title: "Planification",
      url: "/dashboard/planification",
      icon: CalendarRange,
    },
    {
      title: "Carriere & Decisions",
      url: "/dashboard/carrieres",
      icon: TrendingUp,
    },
    {
      title: "Paie & Avantages",
      url: "/dashboard/paie",
      icon: Wallet,
    },
    {
      title: "Polyclinique",
      url: "/dashboard/polyclinique",
      icon: Hospital,
    },
    {
      title: "Access Control",
      url: "/dashboard/access",
      icon: ShieldCheck,
    },
    {
      title: "Parametre",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Notifications",
          url: "/dashboard/parametre/notifications",
        },
        {
          title: "Session",
          url: "/dashboard/parametre/session",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};
