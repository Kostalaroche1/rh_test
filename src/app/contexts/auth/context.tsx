'use client'
import { getAuth } from "@/app/action/auth/action";
import { useGet } from "@/hooks/useApi";
import React ,{ createContext, useContext, useEffect, useState } from "react";
export type Auth = {
    userId: number ,
    nom : string,
    prenom : string,
    matricule : string,
    login : string,
    role : string
}
export const AuthContext = createContext({});


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending, error } = useGet(["Auth"], getAuth);
  // const [auth, setAuth] = useState<any>(null);

  useEffect(() => {
    // if (data) setAuth(data);
  }, [data , isPending]);

  return (
    <AuthContext.Provider value={{ auth:data,  isPending }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}


