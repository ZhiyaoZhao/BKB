"use client"

import { memo, useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { NodeData } from "@/lib/types"

function CustomNode({ data, isConnectable, selected }: NodeProps<NodeData>) {
  // Add a highlight effect for newly added nodes
  const [isNew, setIsNew] = useState(true)

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setIsNew(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isNew])

  return (
    <Card
      className={`min-w-[150px] max-w-[250px] border-2 ${isNew ? "node-highlight" : ""} ${selected ? "ring-2 ring-primary" : ""}`}
      style={{ borderColor: data.color || "#1a192b" }}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-sm truncate">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {data.type && (
          <Badge variant="outline" className="mb-2">
            {data.type}
          </Badge>
        )}
        {data.properties && Object.keys(data.properties).length > 0 && (
          <div className="text-xs space-y-1">
            {Object.entries(data.properties).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="truncate max-w-[120px]">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </Card>
  )
}

export default memo(CustomNode)

