'use client'
import { createContext, useContext } from "react"
import { useAuth } from "../../auth/context";
export const guardAuthContext = createContext(null);
export function GuardAuthProvider ({children,} : {children :Readonly<{children : React.ReactNode}>}) {
    const {auth , setAuth} : any = useAuth();
    
}