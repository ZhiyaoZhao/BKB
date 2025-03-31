import { NextResponse } from "next/server"
import type { NodeData, EdgeData } from "@/lib/types"

// Mock mode for testing when Neo4j isn't available
const MOCK_MODE = true

export async function POST(request: Request) {
  try {
    // Parse the request body safely
    const body = await request.json().catch(() => {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    })

    // If body is a NextResponse (from the catch above), return it
    if (body instanceof NextResponse) {
      return body
    }

    const { query, uri, username, password } = body

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // If in mock mode, return sample data
    if (MOCK_MODE) {
      console.log("Using mock mode for Neo4j query")

      // Generate some sample nodes and edges based on the query
      const sampleNodes: NodeData[] = [
        {
          id: "1",
          label: "Person",
          type: "Person",
          properties: { name: "John Doe", age: 30 },
          position: { x: 100, y: 100 },
        },
        {
          id: "2",
          label: "Company",
          type: "Organization",
          properties: { name: "Acme Inc", founded: 1999 },
          position: { x: 300, y: 100 },
        },
        {
          id: "3",
          label: "Product",
          type: "Product",
          properties: { name: "Widget Pro", price: 99.99 },
          position: { x: 500, y: 100 },
        },
        {
          id: "4",
          label: "Customer",
          type: "Person",
          properties: { name: "Jane Smith", age: 28 },
          position: { x: 300, y: 300 },
        },
      ]

      const sampleEdges: EdgeData[] = [
        { id: "e1", source: "1", target: "2", label: "WORKS_FOR" },
        { id: "e2", source: "2", target: "3", label: "PRODUCES" },
        { id: "e3", source: "4", target: "3", label: "PURCHASED" },
        { id: "e4", source: "1", target: "4", label: "KNOWS" },
      ]

      return NextResponse.json({
        nodes: sampleNodes,
        edges: sampleEdges,
        mock: true,
      })
    }

    // If not in mock mode, try to use neo4j-driver
    try {
      const neo4j = await import("neo4j-driver")

      // Default connection details if not provided
      const neo4jUri = uri || process.env.NEO4J_URI || "bolt://localhost:7687"
      const neo4jUser = username || process.env.NEO4J_USER || "neo4j"
      const neo4jPassword = password || process.env.NEO4J_PASSWORD || "password"

      let driver = null
      try {
        // Create a driver instance
        driver = neo4j.default.driver(
          neo4jUri,
          neo4j.default.auth.basic(neo4jUser, neo4jPassword),
          { connectionTimeout: 10000 }, // 10 seconds timeout
        )

        // Create a session
        const session = driver.session()

        try {
          // Execute the query
          const result = await session.run(query)

          // Process the results
          const nodesMap = new Map<string, NodeData>()
          const edgesMap = new Map<string, EdgeData>()

          // Extract nodes and relationships from the result
          result.records.forEach((record) => {
            record.forEach((value, key) => {
              if (neo4j.default.isNode(value)) {
                // Process node
                const nodeId = value.identity.toString()
                if (!nodesMap.has(nodeId)) {
                  nodesMap.set(nodeId, {
                    id: nodeId,
                    label: value.labels[0] || value.properties.name || `Node ${nodeId}`,
                    type: value.labels.join(", "),
                    properties: value.properties,
                    position: {
                      x: Math.random() * 800,
                      y: Math.random() * 600,
                    },
                  })
                }
              } else if (neo4j.default.isRelationship(value)) {
                // Process relationship
                const edgeId = value.identity.toString()
                if (!edgesMap.has(edgeId)) {
                  edgesMap.set(edgeId, {
                    id: edgeId,
                    source: value.startNodeIdentity.toString(),
                    target: value.endNodeIdentity.toString(),
                    label: value.type,
                  })
                }
              }
            })
          })

          // Convert maps to arrays
          const nodes = Array.from(nodesMap.values())
          const edges = Array.from(edgesMap.values())

          return NextResponse.json({ nodes, edges })
        } finally {
          // Close the session
          await session.close()
        }
      } catch (error) {
        console.error("Neo4j query execution error:", error)

        let errorMessage = "Failed to execute Neo4j query"
        if (error instanceof Error) {
          if (error.message.includes("Failed to establish connection")) {
            errorMessage = "Failed to connect to Neo4j database. Please check your connection settings."
          } else if (error.message.includes("authentication failure")) {
            errorMessage = "Authentication failed. Please check your Neo4j credentials."
          } else if (error.message.includes("Invalid input")) {
            errorMessage = "Invalid Cypher query: " + error.message
          } else {
            errorMessage = error.message
          }
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 })
      } finally {
        // Ensure driver is closed
        if (driver) {
          try {
            await driver.close()
          } catch (closeError) {
            console.error("Error closing Neo4j driver:", closeError)
          }
        }
      }
    } catch (importError) {
      console.error("Failed to import neo4j-driver:", importError)
      return NextResponse.json({ error: "Neo4j driver not available" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing Neo4j request:", error)
    return NextResponse.json(
      { error: "Failed to process Neo4j query: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

