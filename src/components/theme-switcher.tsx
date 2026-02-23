"use client";

import { MoonStar, SunMedium } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem("rtnc-theme", theme);
}

export function ThemeSwitcher({
  className,
}: {
  className?: string;
}) {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("rtnc-theme");
    const initialTheme: Theme =
      saved === "light" || saved === "dark"
        ? saved
        : root.classList.contains("dark")
          ? "dark"
          : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const handleChange = (nextTheme: Theme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div
      className={cn(
        "bg-sidebar-accent border-sidebar-border flex items-center gap-1 rounded-xl border p-1",
        className
      )}
      aria-label="Theme switcher"
    >
      <button
        type="button"
        onClick={() => handleChange("light")}
        className={cn(
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors",
          theme === "light"
            ? "bg-sidebar text-sidebar-foreground shadow-sm"
            : "text-sidebar-foreground"
        )}
      >
        <SunMedium className="h-3.5 w-3.5" />
        Clair
      </button>

      <button
        type="button"
        onClick={() => handleChange("dark")}
        className={cn(
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors",
          theme === "dark"
            ? "bg-sidebar text-sidebar-foreground shadow-sm"
            : "text-sidebar-foreground"
        )}
      >
        <MoonStar className="h-3.5 w-3.5" />
        Sombre
      </button>
    </div>
  );
}
