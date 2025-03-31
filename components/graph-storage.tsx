"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Save, FolderOpen, MoreVertical, Trash2, Edit, Download, Upload, Server, Database } from "lucide-react"
import type { NodeData, EdgeData, GraphData } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface GraphStorageProps {
  nodes: NodeData[]
  edges: EdgeData[]
  onLoadGraph: (nodes: NodeData[], edges: EdgeData[]) => void
}

export default function GraphStorage({ nodes, edges, onLoadGraph }: GraphStorageProps) {
  const [graphs, setGraphs] = useState<GraphData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [graphName, setGraphName] = useState("")
  const [graphDescription, setGraphDescription] = useState("")
  const [currentGraphId, setCurrentGraphId] = useState<string | null>(null)
  const [localStorageFallback, setLocalStorageFallback] = useState(false)
  const [serverStatus, setServerStatus] = useState<"unknown" | "online" | "offline">("unknown")
  const { toast } = useToast()

  // Update API endpoints to use Django backend
  // In development, we use a relative URL to avoid CORS issues
  const API_BASE_URL = "/api-proxy" // This will be proxied to Django server in next.config.js

  // Check server status
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/graphs/`, {
        method: "HEAD",
        headers: {
          Accept: "application/json",
        },
      })

      setServerStatus(response.ok ? "online" : "offline")
      return response.ok
    } catch (error) {
      console.error("Server status check failed:", error)
      setServerStatus("offline")
      return false
    }
  }

  // Load graphs from API or localStorage
  const loadGraphs = async () => {
    setIsLoading(true)
    try {
      // Check server status first
      const isServerOnline = await checkServerStatus()

      if (!isServerOnline) {
        // If server is offline, fallback to localStorage
        fallbackToLocalStorage()
        return
      }

      // Try to load from API
      const response = await fetch(`${API_BASE_URL}/graphs/`, {
        headers: {
          Accept: "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGraphs(data)
        setLocalStorageFallback(false)

        toast({
          title: "Connected to server",
          description: "Successfully connected to the graph storage server",
        })
      } else {
        // Fallback to localStorage if API returns an error
        console.error("API returned error:", response.status, response.statusText)
        fallbackToLocalStorage()
      }
    } catch (error) {
      console.error("Failed to load graphs:", error)
      // Fallback to localStorage
      fallbackToLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback to localStorage if API fails
  const fallbackToLocalStorage = () => {
    try {
      const storedGraphs = localStorage.getItem("knowledge-graphs")
      if (storedGraphs) {
        setGraphs(JSON.parse(storedGraphs))
      } else {
        setGraphs([])
      }
      setLocalStorageFallback(true)

      toast({
        title: "Using local storage",
        description: "Server storage is unavailable. Your graphs will be saved in your browser.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Failed to load from localStorage:", error)
      setGraphs([])
    }
  }

  // Save graphs to localStorage (fallback)
  const saveToLocalStorage = (updatedGraphs: GraphData[]) => {
    try {
      localStorage.setItem("knowledge-graphs", JSON.stringify(updatedGraphs))
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
    }
  }

  // Load graphs on component mount
  useEffect(() => {
    loadGraphs()
    // Set up periodic server status check
    const intervalId = setInterval(() => {
      if (localStorageFallback) {
        checkServerStatus()
      }
    }, 30000) // Check every 30 seconds if we're in fallback mode

    return () => clearInterval(intervalId)
  }, [localStorageFallback])

  // Save current graph
  const saveGraph = async () => {
    if (!graphName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your graph",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const graphData: GraphData = {
        id: currentGraphId || undefined,
        name: graphName,
        description: graphDescription,
        nodes,
        edges,
      }

      if (localStorageFallback) {
        // Save to localStorage
        const updatedGraphs = [...graphs]

        if (currentGraphId) {
          // Update existing graph
          const index = updatedGraphs.findIndex((g) => g.id === currentGraphId)
          if (index >= 0) {
            updatedGraphs[index] = {
              ...graphData,
              updatedAt: new Date().toISOString(),
            }
          } else {
            // Create new with this id
            updatedGraphs.push({
              ...graphData,
              id: currentGraphId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
        } else {
          // Create new graph
          updatedGraphs.push({
            ...graphData,
            id: `local-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }

        setGraphs(updatedGraphs)
        saveToLocalStorage(updatedGraphs)

        toast({
          title: "Graph saved",
          description: `"${graphName}" has been saved to local storage`,
        })
      } else {
        // Save to API
        const method = currentGraphId ? "PUT" : "POST"
        const url = currentGraphId ? `${API_BASE_URL}/graphs/${currentGraphId}/` : `${API_BASE_URL}/graphs/`

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(graphData),
        })

        if (!response.ok) {
          throw new Error(`Failed to save graph: ${response.status} ${response.statusText}`)
        }

        const savedGraph = await response.json()

        // Update graphs list
        setGraphs((prev) => {
          const updated = [...prev]
          const index = updated.findIndex((g) => g.id === savedGraph.id)

          if (index >= 0) {
            updated[index] = savedGraph
          } else {
            updated.push(savedGraph)
          }

          return updated
        })

        toast({
          title: "Graph saved",
          description: `"${graphName}" has been saved to the server`,
        })
      }

      // Reset form and close dialog
      setSaveDialogOpen(false)
      setGraphName("")
      setGraphDescription("")
      setCurrentGraphId(null)
    } catch (error) {
      console.error("Failed to save graph:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save graph. Please try again.",
        variant: "destructive",
      })

      // If server save fails, try localStorage as fallback
      if (!localStorageFallback) {
        toast({
          title: "Trying local storage",
          description: "Attempting to save to local storage instead",
        })
        setLocalStorageFallback(true)
        saveGraph() // Retry with localStorage
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Load a graph
  const loadGraph = async (graphId: string) => {
    setIsLoading(true)
    try {
      let graphData: GraphData | null = null

      if (localStorageFallback) {
        // Load from localStorage
        const graph = graphs.find((g) => g.id === graphId)
        if (graph) {
          graphData = graph
        }
      } else {
        // Load from API
        const response = await fetch(`${API_BASE_URL}/graphs/${graphId}/`)

        if (response.ok) {
          graphData = await response.json()
        } else {
          throw new Error(`Failed to load graph: ${response.status} ${response.statusText}`)
        }
      }

      if (graphData) {
        onLoadGraph(graphData.nodes, graphData.edges)
        setCurrentGraphId(graphData.id || null)

        toast({
          title: "Graph loaded",
          description: `"${graphData.name}" has been loaded`,
        })
      }
    } catch (error) {
      console.error("Failed to load graph:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load graph. Please try again.",
        variant: "destructive",
      })

      // If API load fails and the graph might be in localStorage, try that
      if (!localStorageFallback) {
        const localGraph = graphs.find((g) => g.id === graphId)
        if (localGraph) {
          setLocalStorageFallback(true)
          loadGraph(graphId) // Retry with localStorage
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a graph
  const deleteGraph = async (graphId: string) => {
    if (!confirm("Are you sure you want to delete this graph?")) {
      return
    }

    setIsLoading(true)
    try {
      if (localStorageFallback) {
        // Delete from localStorage
        const updatedGraphs = graphs.filter((g) => g.id !== graphId)
        setGraphs(updatedGraphs)
        saveToLocalStorage(updatedGraphs)

        toast({
          title: "Graph deleted",
          description: "The graph has been deleted from local storage",
        })
      } else {
        // Delete from API
        const response = await fetch(`${API_BASE_URL}/graphs/${graphId}/`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error(`Failed to delete graph: ${response.status} ${response.statusText}`)
        }

        // Update graphs list
        setGraphs((prev) => prev.filter((g) => g.id !== graphId))

        toast({
          title: "Graph deleted",
          description: "The graph has been deleted from the server",
        })
      }

      // If current graph was deleted, reset currentGraphId
      if (currentGraphId === graphId) {
        setCurrentGraphId(null)
      }
    } catch (error) {
      console.error("Failed to delete graph:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete graph. Please try again.",
        variant: "destructive",
      })

      // If API delete fails, try localStorage as fallback
      if (!localStorageFallback) {
        setLocalStorageFallback(true)
        deleteGraph(graphId) // Retry with localStorage
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Edit a graph
  const editGraph = (graph: GraphData) => {
    setGraphName(graph.name)
    setGraphDescription(graph.description || "")
    setCurrentGraphId(graph.id || null)
    setSaveDialogOpen(true)
  }

  // Export graph as JSON
  const exportGraph = (graph: GraphData) => {
    try {
      const dataStr = JSON.stringify(graph, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

      const exportFileDefaultName = `${graph.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast({
        title: "Graph exported",
        description: `"${graph.name}" has been exported as JSON`,
      })
    } catch (error) {
      console.error("Failed to export graph:", error)
      toast({
        title: "Error",
        description: "Failed to export graph. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Import graph from JSON file
  const importGraph = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target.files?.length) return

      const file = target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const graphData = JSON.parse(content) as GraphData

          // Validate graph data
          if (!graphData.name || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.edges)) {
            throw new Error("Invalid graph data format")
          }

          // Prepare for save dialog
          setGraphName(graphData.name)
          setGraphDescription(graphData.description || "")
          setCurrentGraphId(null) // Create as new graph

          // Load the graph
          onLoadGraph(graphData.nodes, graphData.edges)

          // Open save dialog
          setSaveDialogOpen(true)

          toast({
            title: "Graph imported",
            description: "Please save the imported graph with a name",
          })
        } catch (error) {
          console.error("Failed to import graph:", error)
          toast({
            title: "Error",
            description: "Failed to import graph. The file format may be invalid.",
            variant: "destructive",
          })
        }
      }

      reader.readAsText(file)
    }

    input.click()
  }

  // Switch between server and local storage
  const toggleStorageMode = async () => {
    if (localStorageFallback) {
      // Try to switch to server storage
      const isServerOnline = await checkServerStatus()
      if (isServerOnline) {
        setLocalStorageFallback(false)
        loadGraphs()
        toast({
          title: "Using server storage",
          description: "Switched to server storage for your graphs",
        })
      } else {
        toast({
          title: "Server unavailable",
          description: "Cannot connect to the server. Staying with local storage.",
          variant: "destructive",
        })
      }
    } else {
      // Switch to local storage
      setLocalStorageFallback(true)
      fallbackToLocalStorage()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Saved Graphs</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleStorageMode} className="flex items-center gap-1">
            {localStorageFallback ? (
              <>
                <Server className="h-4 w-4" />
                <span>Try Server</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Use Local</span>
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={importGraph}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentGraphId ? "Update Graph" : "Save Graph"}</DialogTitle>
                <DialogDescription>Save your current knowledge graph for future use.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="graph-name">Graph Name</Label>
                  <Input
                    id="graph-name"
                    value={graphName}
                    onChange={(e) => setGraphName(e.target.value)}
                    placeholder="My Knowledge Graph"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graph-description">Description (Optional)</Label>
                  <Textarea
                    id="graph-description"
                    value={graphDescription}
                    onChange={(e) => setGraphDescription(e.target.value)}
                    placeholder="A brief description of this graph..."
                    rows={3}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Saving to: {localStorageFallback ? "Browser Local Storage" : "Server Database"}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveGraph} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Graph"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {serverStatus === "offline" && !localStorageFallback && (
        <div className="bg-amber-50 text-amber-700 p-2 rounded-md text-sm mb-4">
          Server connection failed. Your graphs will be saved locally.
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && graphs.length === 0 && (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No saved graphs yet</p>
          <p className="text-xs text-muted-foreground">Create and save your first knowledge graph</p>
        </div>
      )}

      {!isLoading && graphs.length > 0 && (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {graphs.map((graph) => (
              <Card key={graph.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{graph.name}</CardTitle>
                      {graph.description && (
                        <CardDescription className="text-xs line-clamp-2">{graph.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => loadGraph(graph.id!)}>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Load
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editGraph(graph)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportGraph(graph)}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteGraph(graph.id!)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex text-xs text-muted-foreground">
                    <div className="mr-4">
                      <span className="font-medium">Nodes:</span> {graph.nodes.length}
                    </div>
                    <div>
                      <span className="font-medium">Relationships:</span> {graph.edges.length}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 text-xs text-muted-foreground">
                  {(graph.updated_at || graph.updatedAt) && (
                    <div>Updated: {new Date(graph.updated_at || graph.updatedAt!).toLocaleDateString()}</div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

