export interface NodeData {
  id: string
  label: string
  type?: string
  color?: string
  properties?: Record<string, any>
  position?: { x: number; y: number }
}

export interface EdgeData {
  id: string
  source: string
  target: string
  label?: string
  color?: string
  animated?: boolean
  style?: Record<string, any>
  properties?: Record<string, any>
}

export interface GraphData {
  id?: string
  name: string
  description?: string
  nodes: NodeData[]
  edges: EdgeData[]
  created_at?: string // Django uses snake_case
  updated_at?: string // Django uses snake_case
  createdAt?: string // For frontend compatibility
  updatedAt?: string // For frontend compatibility
}

