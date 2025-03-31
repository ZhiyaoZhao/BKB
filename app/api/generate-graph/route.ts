import { NextResponse } from "next/server"
import type { NodeData, EdgeData } from "@/lib/types"

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

    const { text } = body

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Generate a simple knowledge graph from the text
    // In a real application, this would use an LLM or NLP service
    const words = text
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .map((word) => word.replace(/[^\w]/g, ""))
      .filter(Boolean)
      .slice(0, 10)

    const uniqueWords = [...new Set(words)]

    // Create nodes from unique words
    const nodes: NodeData[] = uniqueWords.map((word, index) => ({
      id: `n${index}`,
      label: word,
      type: "Concept",
      properties: {
        frequency: words.filter((w) => w === word).length,
        length: word.length,
      },
      position: {
        x: 100 + Math.random() * 500,
        y: 100 + Math.random() * 300,
      },
    }))

    // Create edges between words that appear close to each other in the text
    const edges: EdgeData[] = []
    for (let i = 0; i < words.length - 1; i++) {
      const sourceIndex = uniqueWords.indexOf(words[i])
      const targetIndex = uniqueWords.indexOf(words[i + 1])

      if (sourceIndex !== targetIndex) {
        const edgeId = `e${edges.length}`
        // Check if this edge already exists
        const existingEdge = edges.find((e) => e.source === `n${sourceIndex}` && e.target === `n${targetIndex}`)

        if (existingEdge) {
          // Increment weight if edge exists
          existingEdge.properties = existingEdge.properties || {}
          existingEdge.properties.weight = (existingEdge.properties.weight || 1) + 1
        } else {
          // Create new edge
          edges.push({
            id: edgeId,
            source: `n${sourceIndex}`,
            target: `n${targetIndex}`,
            label: "RELATED_TO",
            properties: { weight: 1 },
          })
        }
      }
    }

    return NextResponse.json({ nodes, edges })
  } catch (error) {
    console.error("Error generating knowledge graph:", error)
    return NextResponse.json(
      { error: "Failed to generate knowledge graph: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

