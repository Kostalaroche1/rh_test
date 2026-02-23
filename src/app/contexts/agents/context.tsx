"use client"

import { GetAgent } from "@/app/action/agent/getAgent/action"
import { useGet } from "@/hooks/useApi"
import { createContext, useContext, useEffect } from "react"

const AgentContext = createContext<any>(null)

export const AgentProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isPending,
    data,
    error,
    refetch,
  } = useGet(["AgentWithAccountOrNot"], GetAgent)

  useEffect(()=>{console.log(data , 'user data from user')},[data])

  return (
    <AgentContext.Provider
      value={{
        isPendingAgents: isPending,
        agents: data,
        errorAgents: error,
        refetchAgents: refetch,
      }}
    >
      {children}
    </AgentContext.Provider>
  )
}

export const useAgents = () => {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error("useAgents doit être utilisé dans AgentProvider")
  }
  return context
}
