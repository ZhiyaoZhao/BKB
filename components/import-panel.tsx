"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { NodeData, EdgeData, GraphData } from "@/lib/types"

interface ImportPanelProps {
  onPreviewGraph: (nodes: NodeData[], edges: EdgeData[], name: string) => void
}

export default function ImportPanel({ onPreviewGraph }: ImportPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = (file: File) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const graphData = JSON.parse(content) as GraphData

        // Validate graph data
        if (!graphData.name || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.edges)) {
          throw new Error("Invalid graph data format")
        }

        // Send to preview
        onPreviewGraph(graphData.nodes, graphData.edges, graphData.name)

        toast({
          title: "Graph loaded for preview",
          description: `"${graphData.name}" has been loaded. Review and confirm to add to your workspace.`,
        })
      } catch (error) {
        console.error("Failed to parse graph file:", error)
        toast({
          title: "Error",
          description: "Failed to import graph. The file format may be invalid.",
          variant: "destructive",
        })
      }
    }

    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        handleFileUpload(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a JSON file",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleBrowseClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        handleFileUpload(target.files[0])
      }
    }
    input.click()
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Import Graph</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Drag and drop your graph JSON file</p>
              <p className="text-xs text-muted-foreground mt-1">or</p>
            </div>
            <input type="file" id="file-upload" className="hidden" accept=".json" onChange={handleFileInputChange} />
            <Button variant="outline" onClick={handleBrowseClick}>
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Sample Graph Format</h3>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-[200px]">
            {`{
  "name": "My Knowledge Graph",
  "description": "A sample graph",
  "nodes": [
    {
      "id": "1",
      "label": "Person",
      "type": "Person",
      "properties": { "name": "John" }
    },
    {
      "id": "2",
      "label": "Company",
      "type": "Organization",
      "properties": { "name": "Acme Inc" }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "1",
      "target": "2",
      "label": "WORKS_FOR"
    }
  ]
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

