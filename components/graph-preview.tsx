"use client"

import { useEffect } from "react"
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from "reactflow"
import "reactflow/dist/style.css"
import type { NodeData, EdgeData } from "@/lib/types"
import CustomNode from "./custom-node"
import CustomEdge from "./custom-edge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Check } from "lucide-react"

interface GraphPreviewProps {
  nodes: NodeData[]
  edges: EdgeData[]
  onLoad: () => void
  onCancel: () => void
  title?: string
}

export default function GraphPreview({ nodes, edges, onLoad, onCancel, title = "Graph Preview" }: GraphPreviewProps) {
  // Convert the provided nodes and edges to ReactFlow format
  const getNodesFromProps = () => {
    return nodes.map((node) => ({
      id: node.id,
      type: "custom",
      position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
      data: { ...node },
    }))
  }

  const getEdgesFromProps = () => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "custom",
      animated: edge.animated,
      style: edge.style,
      data: { ...edge },
    }))
  }

  const [rfNodes, setNodes, onNodesChange] = useNodesState(getNodesFromProps())
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(getEdgesFromProps())

  // Update nodes and edges when props change
  useEffect(() => {
    setNodes(getNodesFromProps())
    setEdges(getEdgesFromProps())
  }, [nodes, edges, setNodes, setEdges])

  const nodeTypes = {
    custom: CustomNode,
  }

  const edgeTypes = {
    custom: CustomEdge,
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{title}</span>
          <div className="text-sm text-muted-foreground">
            {nodes.length} nodes, {edges.length} edges
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 relative">
        <div className="absolute inset-0">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>
      </CardContent>
      <CardFooter className="border-t p-3 flex justify-between">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button size="sm" onClick={onLoad}>
          <Check className="h-4 w-4 mr-2" />
          Load Graph
        </Button>
      </CardFooter>
    </Card>
  )
}

