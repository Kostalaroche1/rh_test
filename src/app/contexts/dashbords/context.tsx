"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type DashboardRole = "admin" | "chefService" | "agent" | "rh";

interface DashboardContextProps {
  currentRole: DashboardRole | null;
  setCurrentRole: (role: DashboardRole) => void;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<DashboardRole | null>(null);

  // charger depuis localStorage si présent
  useEffect(() => {
    const saved = localStorage.getItem("currentRole") as DashboardRole;
    if (saved) setCurrentRole(saved);
    else setCurrentRole("admin"); // fallback
  }, []);

  const safeSetRole = (role: DashboardRole) => {
    setCurrentRole(role);
    localStorage.setItem("currentRole", role);
  };

  return (
    <DashboardContext.Provider value={{ currentRole, setCurrentRole: safeSetRole }}>
      {children}
    </DashboardContext.Provider>
  );
};
