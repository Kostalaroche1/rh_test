import type { Metadata } from "next";
import { JetBrains_Mono, Poppins } from "next/font/google";
import "./globals.css";
import App from "./contexts/tanstack_Client_Query/context";
import { AuthProvider } from "./contexts/auth/context";
import { DashboardProvider } from "./contexts/dashbords/context";
import { NotificationProvider } from "./contexts/notification/context";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const themeScript = `
(() => {
  try {
    const root = document.documentElement;
    const saved = localStorage.getItem("rtnc-theme");
    const theme = saved === "dark" ? "dark" : "light";
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
  } catch (_) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.classList.remove("dark");
  }
})();
`;

export const metadata: Metadata = {
  title: "RTNC RH",
  description: "Recursos Humanos RTNC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${poppins.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="font-sans antialiased"
      >
         <App> <AuthProvider>
          <DashboardProvider>
             <NotificationProvider >{children}</NotificationProvider>
        </DashboardProvider>
        </AuthProvider> </App>
      </body>
    </html>
  );
}
