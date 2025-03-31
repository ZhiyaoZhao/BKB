import { NextResponse } from "next/server"

// Mock mode for testing when Neo4j isn't available
const MOCK_MODE = true

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json().catch(() => {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    })

    // If body is a NextResponse (from the catch above), return it
    if (body instanceof NextResponse) {
      return body
    }

    const { uri, username, password } = body

    if (!uri || !username || !password) {
      return NextResponse.json({ error: "Missing connection parameters" }, { status: 400 })
    }

    // If in mock mode, simulate a successful connection
    if (MOCK_MODE) {
      console.log("Using mock mode for Neo4j connection test")

      // Simulate connection validation
      if (uri.startsWith("bolt://") && username && password) {
        return NextResponse.json({
          success: true,
          message: "Connection successful (MOCK MODE)",
        })
      } else {
        return NextResponse.json({ error: "Invalid connection parameters (MOCK MODE)" }, { status: 400 })
      }
    }

    // If not in mock mode, try to dynamically import neo4j-driver
    try {
      const neo4j = await import("neo4j-driver")

      let driver = null
      try {
        // Create a driver instance
        driver = neo4j.default.driver(
          uri,
          neo4j.default.auth.basic(username, password),
          { maxConnectionLifetime: 3000, connectionTimeout: 5000 }, // Short timeout for testing
        )

        // Verify connectivity by running a simple query
        const session = driver.session()
        try {
          await session.run("RETURN 1 AS result")
          return NextResponse.json({ success: true, message: "Connection successful" })
        } finally {
          await session.close()
        }
      } catch (error) {
        console.error("Neo4j connection test failed:", error)
        let errorMessage = "Failed to connect to Neo4j database"

        if (error instanceof Error) {
          // Extract more specific error information
          if (error.message.includes("Failed to establish connection")) {
            errorMessage =
              "Failed to establish connection to Neo4j. Please check the URI and make sure the database is running."
          } else if (error.message.includes("authentication failure")) {
            errorMessage = "Authentication failed. Please check your username and password."
          } else {
            errorMessage = `Neo4j error: ${error.message}`
          }
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 })
      } finally {
        if (driver) {
          await driver.close()
        }
      }
    } catch (importError) {
      console.error("Failed to import neo4j-driver:", importError)
      return NextResponse.json({ error: "Neo4j driver not available" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in test-connection route:", error)
    // Ensure we always return a proper JSON response
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

