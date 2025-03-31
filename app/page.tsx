"use client"

import { useState } from "react"
import KnowledgeGraph from "@/components/knowledge-graph"
import ControlPanel from "@/components/control-panel"
import GraphStorage from "@/components/graph-storage"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Neo4jProvider } from "@/lib/neo4j-context"
import type { NodeData, EdgeData } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import GraphPreview from "@/components/graph-preview"
import ImportPanel from "@/components/import-panel"

// Update API endpoints to use Django backend via proxy
// In development, we use a relative URL to avoid CORS issues
const API_BASE_URL = "/api-proxy" // This will be proxied to Django server in next.config.js

export default function Home() {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // State for graph preview
  const [previewNodes, setPreviewNodes] = useState<NodeData[]>([])
  const [previewEdges, setPreviewEdges] = useState<EdgeData[]>([])
  const [previewName, setPreviewName] = useState<string>("")
  const [showPreview, setShowPreview] = useState(false)
  const [showImport, setShowImport] = useState(true)

  const handleAddNode = (node: NodeData) => {
    // Generate a position if not provided
    const position = node.position || {
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
    }

    setNodes((prev) => [
      ...prev,
      {
        ...node,
        id: `node-${prev.length + 1}`,
        position,
      },
    ])
  }

  const handleAddEdge = (edge: EdgeData) => {
    // Add the new edge with a highlight effect
    const newEdge = {
      ...edge,
      id: `edge-${edges.length + 1}`,
      animated: true, // Add animation to new edges
      style: { stroke: edge.color || "#555", strokeWidth: 2 },
    }

    setEdges((prev) => [...prev, newEdge])

    // Remove animation after 1 second
    setTimeout(() => {
      setEdges((current) => current.map((e) => (e.id === newEdge.id ? { ...e, animated: false } : e)))
    }, 1000)
  }

  const handleClearGraph = () => {
    setNodes([])
    setEdges([])
  }

  const handleLoadGraph = (loadedNodes: NodeData[], loadedEdges: EdgeData[]) => {
    setNodes(loadedNodes)
    setEdges(loadedEdges)
  }

  // Handle preview graph
  const handlePreviewGraph = (previewNodes: NodeData[], previewEdges: EdgeData[], name: string) => {
    setPreviewNodes(previewNodes)
    setPreviewEdges(previewEdges)
    setPreviewName(name)
    setShowPreview(true)
    setShowImport(false)
  }

  // Load preview graph into main graph
  const handleLoadPreviewGraph = () => {
    handleLoadGraph(previewNodes, previewEdges)
    setShowPreview(false)
    setShowImport(true)
  }

  // Cancel preview
  const handleCancelPreview = () => {
    setShowPreview(false)
    setShowImport(true)
  }

  // Update the handleImportFromNeo4j function to accept connection parameters
  const handleImportFromNeo4j = async (
    query: string,
    connection?: { uri: string; username: string; password: string },
  ) => {
    setIsLoading(true)
    setGlobalError(null)
    try {
      // For demo purposes, generate some sample data if no connection is provided
      if (!connection) {
        // Sample data for demonstration
        const sampleNodes: NodeData[] = [
          { id: "1", label: "Person", type: "Person", properties: { name: "John" }, position: { x: 100, y: 100 } },
          {
            id: "2",
            label: "Company",
            type: "Organization",
            properties: { name: "Acme Inc" },
            position: { x: 300, y: 100 },
          },
          { id: "3", label: "Product", type: "Product", properties: { name: "Widget" }, position: { x: 500, y: 100 } },
        ]

        const sampleEdges: EdgeData[] = [
          { id: "e1", source: "1", target: "2", label: "WORKS_FOR" },
          { id: "e2", source: "2", target: "3", label: "PRODUCES" },
        ]

        setNodes(sampleNodes)
        setEdges(sampleEdges)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/neo4j/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            ...(connection && {
              uri: connection.uri,
              username: connection.username,
              password: connection.password,
            }),
          }),
        })

        if (!response.ok) {
          let errorMessage = "Failed to fetch data from Neo4j"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            // If JSON parsing fails, use status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        setNodes(data.nodes)
        setEdges(data.edges)
      } catch (error) {
        console.error("Error connecting to Neo4j API:", error)

        // Fallback to mock data if API fails
        const sampleNodes: NodeData[] = [
          {
            id: "1",
            label: "Person",
            type: "Person",
            properties: { name: "John (Mock)" },
            position: { x: 100, y: 100 },
          },
          {
            id: "2",
            label: "Company",
            type: "Organization",
            properties: { name: "Acme Inc (Mock)" },
            position: { x: 300, y: 100 },
          },
          {
            id: "3",
            label: "Product",
            type: "Product",
            properties: { name: "Widget (Mock)" },
            position: { x: 500, y: 100 },
          },
        ]

        const sampleEdges: EdgeData[] = [
          { id: "e1", source: "1", target: "2", label: "WORKS_FOR" },
          { id: "e2", source: "2", target: "3", label: "PRODUCES" },
        ]

        setNodes(sampleNodes)
        setEdges(sampleEdges)

        setGlobalError(
          "Using mock data: Server connection failed. " + (error instanceof Error ? error.message : "Unknown error"),
        )
      }
    } catch (error) {
      console.error("Error importing from Neo4j:", error)
      setGlobalError(error instanceof Error ? error.message : "Failed to fetch data from Neo4j")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateFromText = async (text: string) => {
    setIsLoading(true)
    setGlobalError(null)
    try {
      // For demo purposes, generate some sample data
      if (!text.trim()) {
        setGlobalError("Please enter some text to generate a knowledge graph")
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/generate-graph/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        })

        if (!response.ok) {
          let errorMessage = "Failed to generate graph from text"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        setNodes(data.nodes)
        setEdges(data.edges)
      } catch (error) {
        console.error("Error generating graph from text:", error)

        // Fallback to client-side generation if API fails
        const words = text
          .split(/\s+/)
          .filter((word) => word.length > 3)
          .slice(0, 5)

        const sampleNodes: NodeData[] = words.map((word, index) => ({
          id: index.toString(),
          label: word,
          type: "Concept",
          properties: { relevance: Math.random().toFixed(2) },
          position: { x: 100 + index * 150, y: 100 + (index % 2) * 100 },
        }))

        const sampleEdges: EdgeData[] = []
        for (let i = 0; i < words.length - 1; i++) {
          sampleEdges.push({
            id: `e${i}`,
            source: i.toString(),
            target: (i + 1).toString(),
            label: "RELATED_TO",
          })
        }

        setNodes(sampleNodes)
        setEdges(sampleEdges)

        setGlobalError(
          "Using client-side generation: Server connection failed. " +
            (error instanceof Error ? error.message : "Unknown error"),
        )
      }
    } catch (error) {
      console.error("Error generating graph from text:", error)
      setGlobalError(error instanceof Error ? error.message : "Failed to generate graph from text")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Neo4jProvider>
      <main className="flex min-h-screen flex-col">
        <header className="border-b px-6 py-3">
          <h1 className="text-2xl font-bold">Knowledge Graph Visualizer</h1>
        </header>

        {globalError && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/4 border-r p-4 overflow-y-auto">
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="neo4j">Neo4j</TabsTrigger>
                <TabsTrigger value="llm">LLM</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="space-y-4 mt-4">
                <ControlPanel onAddNode={handleAddNode} onAddEdge={handleAddEdge} nodes={nodes} />
                <div className="flex justify-end">
                  <Button variant="destructive" onClick={handleClearGraph}>
                    Clear Graph
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="neo4j" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Import from Neo4j</h3>
                  <Neo4jImport onImport={handleImportFromNeo4j} isLoading={isLoading} />
                </div>
              </TabsContent>
              <TabsContent value="llm" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Generate from Text</h3>
                  <TextToGraph onGenerate={handleGenerateFromText} isLoading={isLoading} />
                </div>
              </TabsContent>
              <TabsContent value="storage" className="space-y-4 mt-4">
                <GraphStorage nodes={nodes} edges={edges} onLoadGraph={handleLoadGraph} />
              </TabsContent>
            </Tabs>
          </div>
          <div className="w-1/2 h-full">
            <KnowledgeGraph nodes={nodes} edges={edges} />
          </div>
          <div className="w-1/4 border-l p-4 h-full">
            {showImport && <ImportPanel onPreviewGraph={handlePreviewGraph} />}
            {showPreview && (
              <GraphPreview
                nodes={previewNodes}
                edges={previewEdges}
                onLoad={handleLoadPreviewGraph}
                onCancel={handleCancelPreview}
                title={`Preview: ${previewName}`}
              />
            )}
          </div>
        </div>
        <Toaster />
      </main>
    </Neo4jProvider>
  )
}

interface Neo4jImportProps {
  onImport: (query: string, connectionDetails?: { uri: string; username: string; password: string }) => void
  isLoading: boolean
}

// Update the Neo4j import component to include connection settings
function Neo4jImport({ onImport, isLoading }: Neo4jImportProps) {
  const [query, setQuery] = useState("MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100")
  const [uri, setUri] = useState("bolt://localhost:7687")
  const [username, setUsername] = useState("neo4j")
  const [password, setPassword] = useState("password")
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoadingTestConnection, setIsLoadingTestConnection] = useState(false)
  const [useDemoMode, setUseDemoMode] = useState(false)

  const handleTestConnection = async () => {
    setError(null)
    setIsLoadingTestConnection(true)
    try {
      const response = await fetch(`${API_BASE_URL}/neo4j/test-connection/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uri, username, password }),
      })

      // First check if the response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error details from response if possible
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || `Server error: ${response.status}`)
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      }

      // Now parse the successful response
      const data = await response.json()
      setIsConnected(true)
    } catch (error) {
      console.error("Connection test failed:", error)
      setError(error instanceof Error ? error.message : "Failed to connect to Neo4j")
      setIsConnected(false)
    } finally {
      setIsLoadingTestConnection(false)
    }
  }

  const handleImport = () => {
    setError(null)
    if (useDemoMode) {
      onImport(query) // No connection details for demo mode
    } else {
      onImport(query, { uri, username, password })
    }
  }

  const toggleDemoMode = () => {
    setUseDemoMode((prev) => !prev)
    if (!useDemoMode) {
      setIsConnected(true) // Auto-connect in demo mode
    } else {
      setIsConnected(false) // Reset connection status when leaving demo mode
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          id="demo-mode"
          checked={useDemoMode}
          onChange={toggleDemoMode}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="demo-mode" className="text-sm font-medium">
          Use Demo Mode (no actual Neo4j connection)
        </label>
      </div>

      {!useDemoMode && (
        <>
          <div className="grid gap-2">
            <label htmlFor="neo4j-uri" className="text-sm font-medium">
              Neo4j URI
            </label>
            <Input
              id="neo4j-uri"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="bolt://localhost:7687"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="neo4j-username" className="text-sm font-medium">
              Username
            </label>
            <Input id="neo4j-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label htmlFor="neo4j-password" className="text-sm font-medium">
              Password
            </label>
            <Input id="neo4j-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button
            onClick={handleTestConnection}
            disabled={isLoadingTestConnection}
            variant="outline"
            className="w-full"
          >
            {isLoadingTestConnection ? "Testing..." : "Test Connection"}
          </Button>

          {isConnected && (
            <div className="bg-green-50 text-green-700 p-2 rounded-md text-sm">Successfully connected to Neo4j</div>
          )}

          {error && <div className="bg-red-50 text-red-700 p-2 rounded-md text-sm">{error}</div>}
        </>
      )}

      <div className="grid gap-2 mt-4">
        <label htmlFor="neo4j-query" className="text-sm font-medium">
          Cypher Query
        </label>
        <textarea
          id="neo4j-query"
          className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter Cypher query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button onClick={handleImport} disabled={isLoading || (!useDemoMode && !isConnected)} className="w-full">
        {isLoading ? "Loading..." : useDemoMode ? "Generate Demo Graph" : "Import from Neo4j"}
      </Button>
    </div>
  )
}

interface TextToGraphProps {
  onGenerate: (text: string) => void
  isLoading: boolean
}

function TextToGraph({ onGenerate, isLoading }: TextToGraphProps) {
  const [text, setText] = useState("")

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label htmlFor="text-input" className="text-sm font-medium">
          Text Input
        </label>
        <textarea
          id="text-input"
          className="min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter text to generate knowledge graph..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <Button onClick={() => onGenerate(text)} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Graph"}
      </Button>
    </div>
  )
}

