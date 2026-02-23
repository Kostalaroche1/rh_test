"use client"

import { StatAgent } from "@/app/action/agent/action"
import { useGet } from "@/hooks/useApi"
import { createContext, useContext } from "react"

const StatAgentContext = createContext<any>(null)

export const StatAgentProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isPending,
    data,
    error,
    refetch,
  } = useGet(["NbreAgentChart"], StatAgent)

  return (
    <StatAgentContext.Provider
      value={{
        isPendingStats: isPending,
        statsAgent: data,
        errorStats: error,
        refetchStats: refetch,
      }}
    >
      {children}
    </StatAgentContext.Provider>
  )
}

export const useStatAgent = () => {
  const context = useContext(StatAgentContext)
  if (!context) {
    throw new Error("useStatAgent doit être utilisé dans StatAgentProvider")
  }
  return context
}
