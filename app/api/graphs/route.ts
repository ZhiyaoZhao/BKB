import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import type { GraphData } from "@/lib/types"

// In a production environment, this would be replaced with a real database
// For this demo, we'll use a simple file-based storage
const DATA_DIR = path.join(process.cwd(), "data")
const GRAPHS_FILE = path.join(DATA_DIR, "graphs.json")

// Initialize data directory and file if they don't exist
function initStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    if (!fs.existsSync(GRAPHS_FILE)) {
      fs.writeFileSync(GRAPHS_FILE, JSON.stringify([]), "utf8")
    }

    return true
  } catch (error) {
    console.error("Failed to initialize storage:", error)
    return false
  }
}

// Get all saved graphs
function getGraphs(): GraphData[] {
  try {
    if (!fs.existsSync(GRAPHS_FILE)) {
      return []
    }

    const data = fs.readFileSync(GRAPHS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Failed to read graphs:", error)
    return []
  }
}

// Save a graph
function saveGraph(graph: GraphData): GraphData | null {
  try {
    const graphs = getGraphs()

    // If graph has an id, update existing graph
    if (graph.id) {
      const index = graphs.findIndex((g) => g.id === graph.id)
      if (index >= 0) {
        graphs[index] = { ...graph, updatedAt: new Date().toISOString() }
      } else {
        // If id doesn't exist, create new with this id
        graphs.push({
          ...graph,
          id: graph.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    } else {
      // Create new graph with generated id
      const newGraph = {
        ...graph,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      graphs.push(newGraph)
      graph = newGraph
    }

    fs.writeFileSync(GRAPHS_FILE, JSON.stringify(graphs, null, 2), "utf8")
    return graph
  } catch (error) {
    console.error("Failed to save graph:", error)
    return null
  }
}

// Delete a graph
function deleteGraph(id: string): boolean {
  try {
    const graphs = getGraphs()
    const filteredGraphs = graphs.filter((g) => g.id !== id)

    if (filteredGraphs.length === graphs.length) {
      return false // Graph not found
    }

    fs.writeFileSync(GRAPHS_FILE, JSON.stringify(filteredGraphs, null, 2), "utf8")
    return true
  } catch (error) {
    console.error("Failed to delete graph:", error)
    return false
  }
}

// GET handler - Get all graphs or a specific graph
export async function GET(request: Request) {
  try {
    // Initialize storage
    if (!initStorage()) {
      return NextResponse.json({ error: "Failed to initialize storage" }, { status: 500 })
    }

    // Get URL parameters
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (id) {
      // Get specific graph
      const graphs = getGraphs()
      const graph = graphs.find((g) => g.id === id)

      if (!graph) {
        return NextResponse.json({ error: "Graph not found" }, { status: 404 })
      }

      return NextResponse.json(graph)
    } else {
      // Get all graphs
      const graphs = getGraphs()
      return NextResponse.json(graphs)
    }
  } catch (error) {
    console.error("Error in GET /api/graphs:", error)
    return NextResponse.json(
      { error: "Failed to get graphs: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

// POST handler - Create or update a graph
export async function POST(request: Request) {
  try {
    // Initialize storage
    if (!initStorage()) {
      return NextResponse.json({ error: "Failed to initialize storage" }, { status: 500 })
    }

    // Parse request body
    const body = await request.json().catch(() => {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    })

    // If body is a NextResponse (from the catch above), return it
    if (body instanceof NextResponse) {
      return body
    }

    const { name, description, nodes, edges, id } = body

    if (!name || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json({ error: "Invalid graph data" }, { status: 400 })
    }

    // Create or update graph
    const graph = saveGraph({
      id,
      name,
      description,
      nodes,
      edges,
    })

    if (!graph) {
      return NextResponse.json({ error: "Failed to save graph" }, { status: 500 })
    }

    return NextResponse.json(graph)
  } catch (error) {
    console.error("Error in POST /api/graphs:", error)
    return NextResponse.json(
      { error: "Failed to save graph: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

// DELETE handler - Delete a graph
export async function DELETE(request: Request) {
  try {
    // Initialize storage
    if (!initStorage()) {
      return NextResponse.json({ error: "Failed to initialize storage" }, { status: 500 })
    }

    // Get URL parameters
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Graph ID is required" }, { status: 400 })
    }

    // Delete graph
    const success = deleteGraph(id)

    if (!success) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/graphs:", error)
    return NextResponse.json(
      { error: "Failed to delete graph: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

