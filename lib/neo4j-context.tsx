"use client"

import { createContext, useContext, type ReactNode, useState } from "react"

interface Neo4jContextType {
  uri: string
  setUri: (uri: string) => void
  username: string
  setUsername: (username: string) => void
  password: string
  setPassword: (password: string) => void
  isConnected: boolean
  setIsConnected: (isConnected: boolean) => void
}

const Neo4jContext = createContext<Neo4jContextType | undefined>(undefined)

export function Neo4jProvider({ children }: { children: ReactNode }) {
  const [uri, setUri] = useState("bolt://localhost:7687")
  const [username, setUsername] = useState("neo4j")
  const [password, setPassword] = useState("")
  const [isConnected, setIsConnected] = useState(false)

  return (
    <Neo4jContext.Provider
      value={{
        uri,
        setUri,
        username,
        setUsername,
        password,
        setPassword,
        isConnected,
        setIsConnected,
      }}
    >
      {children}
    </Neo4jContext.Provider>
  )
}

export function useNeo4j() {
  const context = useContext(Neo4jContext)
  if (context === undefined) {
    throw new Error("useNeo4j must be used within a Neo4jProvider")
  }
  return context
}

