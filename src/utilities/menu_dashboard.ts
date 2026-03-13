import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarOff,
  TrendingUp,
  Wallet,
  ShieldCheck,
  BarChart3,
  LifeBuoy,
  MessageSquare,
  Send,
  Command,
  AudioWaveform,
  GalleryVerticalEnd,
} from "lucide-react";

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
 teams : [
    {
      key: "admin",
      name: "Admin Général",
      logo: GalleryVerticalEnd,
    },
    {
      key: "chefService",
      name: "Chef de Service",
      logo: AudioWaveform,
    },
    {
      key: "agent",
      name: "Agent",
      logo: Command,
    },
    {
      key: "rh",
      name: "Gestionnaire RH",
      logo: Users,
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
    //   items: [
    //     { title: "Liste des agents", url: "#" },
    //     { title: "Créer agent", url: "#" },
    //     { title: "Dossier agent", url: "#" },
    //   ],
    },
    {
      title: "Organisations",
      url: "/dashboard/organisation",
      icon: Building2,
      // items: [
      //   { title: "Structures", url: "#" },
      //   { title: "Sites", url: "#" },
      //   { title: "Affectations", url: "#" },
      // ],
    },
    {
      title: "Congés & Absences",
      url: "/dashboard/conges",
      icon: CalendarOff,
      // items: [
      //   { title: "Congés", url: "#" },
      //   { title: "Demandes à valider", url: "#" },
      //   { title: "Historique", url: "#" },
      // ],
    },
    {
      title: "Carrière & Décisions",
      url: "/dashboard/carrieres",
      icon: TrendingUp,
      // items: [
      //   { title: "Carrières", url: "#" },
      //   { title: "Promotions", url: "#" },
      //   { title: "Décisions administratives", url: "#" },
      // ],
    },
    {
      title: "Paie & Avantages",
      url: "/dashboard/paie",
      icon: Wallet,
      // items: [
      //   { title: "Bulletins de paie", url: "#" },
      //   { title: "Calcul de paie", url: "#" },
      //   { title: "Historique de paie", url: "#" },
      // ],
    },
    {
      title: "Access Control",
      url: "/dashboard/access",
      icon: ShieldCheck,
    },
    // {
    //   title: "Reporting & Analytics",
    //   url: "#",
    //   icon: BarChart3,
    //   // items: [
    //   //   { title: "Tableaux de bord", url: "#" },
    //   //   { title: "Rapports standards", url: "#" },
    //   //   { title: "Export de données", url: "#" },
    //   // ],
    // },
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
//   projects: [
//     {
//       name: " Carriere et decision",
//       url: "#",
//       icon: Frame,
//     },
//     {
//       name: "Sales & Marketing",
//       url: "#",
//       icon: PieChart,
//     },
//     {
//       name: "Travel",
//       url: "#",
//       icon: Map,
//     },
//   ],
}
