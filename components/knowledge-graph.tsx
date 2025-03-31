"use client"

import { useCallback, useEffect, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from "reactflow"
import "reactflow/dist/style.css"
import type { NodeData, EdgeData } from "@/lib/types"
import CustomNode from "./custom-node"
import CustomEdge from "./custom-edge"

interface KnowledgeGraphProps {
  nodes: NodeData[]
  edges: EdgeData[]
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

export default function KnowledgeGraph({ nodes: initialNodes, edges: initialEdges }: KnowledgeGraphProps) {
  // Convert the provided nodes and edges to ReactFlow format
  const getNodesFromProps = useCallback(() => {
    return initialNodes.map((node) => ({
      id: node.id,
      type: "custom",
      position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
      data: { ...node },
    }))
  }, [initialNodes])

  const getEdgesFromProps = useCallback(() => {
    return initialEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "custom",
      animated: edge.animated,
      style: edge.style,
      data: { ...edge },
    }))
  }, [initialEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(getNodesFromProps())
  const [edges, setEdges, onEdgesChange] = useEdgesState(getEdgesFromProps())
  const [fitViewOnChange, setFitViewOnChange] = useState(true)

  // Update nodes and edges when props change
  useEffect(() => {
    const newNodes = getNodesFromProps()
    setNodes(newNodes)
  }, [initialNodes, getNodesFromProps, setNodes])

  useEffect(() => {
    const newEdges = getEdgesFromProps()
    setEdges(newEdges)
  }, [initialEdges, getEdgesFromProps, setEdges])

  // Auto-fit view when nodes change
  useEffect(() => {
    if (fitViewOnChange && nodes.length > 0) {
      // We'll use a timeout to allow the nodes to render first
      const timer = setTimeout(() => {
        document
          .querySelector(".react-flow__controls-fitview")
          ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [nodes.length, fitViewOnChange])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "custom" }, eds)),
    [setEdges],
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
  )
}

