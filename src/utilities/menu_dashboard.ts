import {
  ClipboardCheck,
  Building2,
  CalendarDays,
  Command,
  LayoutDashboard,
  LifeBuoy,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export const data = {
  user: {
    name: "workspace",
    email: "workspace@example.com",
    avatar: "/avatars/workspace.jpg",
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
      title: "Access Control",
      url: "/dashboard/access",
      icon: ShieldCheck,
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
