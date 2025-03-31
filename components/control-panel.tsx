"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { NodeData, EdgeData } from "@/lib/types"

interface ControlPanelProps {
  onAddNode: (node: NodeData) => void
  onAddEdge: (edge: EdgeData) => void
  nodes: NodeData[]
}

export default function ControlPanel({ onAddNode, onAddEdge, nodes }: ControlPanelProps) {
  return (
    <Tabs defaultValue="nodes" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="nodes">Nodes</TabsTrigger>
        <TabsTrigger value="edges">Edges</TabsTrigger>
      </TabsList>
      <TabsContent value="nodes">
        <NodeForm onAddNode={onAddNode} />
      </TabsContent>
      <TabsContent value="edges">
        <EdgeForm onAddEdge={onAddEdge} nodes={nodes} />
      </TabsContent>
    </Tabs>
  )
}

interface NodeFormProps {
  onAddNode: (node: NodeData) => void
}

function NodeForm({ onAddNode }: NodeFormProps) {
  const [label, setLabel] = useState("")
  const [type, setType] = useState("")
  const [color, setColor] = useState("#1a192b")
  const [properties, setProperties] = useState<Record<string, string>>({})
  const [propertyKey, setPropertyKey] = useState("")
  const [propertyValue, setPropertyValue] = useState("")
  const [posX, setPosX] = useState<string>("")
  const [posY, setPosY] = useState<string>("")
  const [useCustomPosition, setUseCustomPosition] = useState(false)

  const handleAddProperty = () => {
    if (propertyKey.trim() === "") return
    setProperties((prev) => ({
      ...prev,
      [propertyKey]: propertyValue,
    }))
    setPropertyKey("")
    setPropertyValue("")
  }

  const handleRemoveProperty = (key: string) => {
    setProperties((prev) => {
      const newProps = { ...prev }
      delete newProps[key]
      return newProps
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (label.trim() === "") return

    const position = useCustomPosition && posX && posY 
      ? { x: parseInt(posX), y: parseInt(posY) } 
      : undefined;

    onAddNode({
      id: "", // Will be set by parent component
      label,
      type,
      color,
      properties,
      position,
    })

    // Reset form
    setLabel("")
    setType("")
    setColor("#1a192b")
    setProperties({})
    // Don't reset position fields to make it easier to add multiple nodes in the same area
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="node-label">Label</Label>
        <Input
          id="node-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Node label"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="node-type">Type</Label>
        <Input
          id="node-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Node type (e.g., Person, Organization)"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="node-color">Color</Label>
        <div className="flex gap-2">
          <Input
            id="node-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#RRGGBB" className="flex-1" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="use-custom-position"
            checked={useCustomPosition}
            onChange={() => setUseCustomPosition(!useCustomPosition)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="use-custom-position">Custom Position</Label>
        </div>
        
        {useCustomPosition && (
          <div className="flex gap-2 mt-2">
            <div className="w-1/2">
              <Label htmlFor="pos-x">X Position</Label>
              <Input
                id="pos-x"
                type="number"
                value={posX}
                onChange={(e) => setPosX(e.target.value)}
                placeholder="X"
              />
            </div>
            <div className="w-1/2">
              <Label htmlFor="pos-y">Y Position</Label>
              <Input
                id="pos-y"
                type="number"
                value={posY}
                onChange={(e) => setPosY(e.target.value)}
                placeholder="Y"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Properties</Label>
        <div className="flex gap-2">
          <Input
            value={propertyKey}
            onChange={(e) => setPropertyKey(e.target.value)}
            placeholder="Key"
            className="flex-1"
          />
          <Input
            value={propertyValue}
            onChange={(e) => setPropertyValue(e.target.value)}
            placeholder="Value"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleAddProperty}>
            Add
          </Button>
        </div>
        {Object.keys(properties).length > 0 && (
          <div className="mt-2 space-y-2">
            {Object.entries(properties).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-muted p-2 rounded-md">
                <div>
                  <span className="font-medium">{key}:</span> {value}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveProperty(key)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" className="w-full">
        Add Node
      </Button>
    </form>
  )
}

interface EdgeFormProps {
  onAddEdge: (edge: EdgeData) => void
  nodes: NodeData[]
}

function EdgeForm({ onAddEdge, nodes }: EdgeFormProps) {
  const [source, setSource] = useState("")
  const [target, setTarget] = useState("")
  const [label, setLabel] = useState("")
  const [color, setColor] = useState("#555")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (source === "" || target === "") return

    onAddEdge({
      id: "", // Will be set by parent component
      source,
      target,
      label,
      color,
    })

    // Reset form
    setLabel("")
    setColor("#555")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edge-source">Source Node</Label>
        <Select value={source} onValueChange={setSource} required>
          <SelectTrigger id="edge-source">
            <SelectValue placeholder="Select source node" />
          </SelectTrigger>
          <SelectContent>
            {nodes.map((node) => (
              <SelectItem key={node.id} value={node.id}>
                {node.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edge-target">Target Node</Label>
        <Select value={target} onValueChange={setTarget} required>
          <SelectTrigger id="edge-target">
            <SelectValue placeholder="Select target node" />
          </SelectTrigger>
          <SelectContent>
            {nodes.map((node) => (
              <SelectItem key={node.id} value={node.id}>
                {node.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edge-label">Relationship Label</Label>
        <Input
          id="edge-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., KNOWS, WORKS_FOR"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edge-color">Color</Label>
        <div className="flex gap-2">
          <Input
            id="edge-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#RRGGBB" className="flex-1" />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Add Relationship
      </Button>
    </form>
  )
}

