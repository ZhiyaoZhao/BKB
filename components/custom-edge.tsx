import { memo } from "react"
import { type EdgeProps, getBezierPath } from "reactflow"
import type { EdgeData } from "@/lib/types"

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
  animated,
}: EdgeProps<EdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const color = data?.color || "#555"

  // Combine style from props with data style
  const edgeStyle = {
    ...style,
    stroke: color,
    strokeWidth: 2,
  }

  return (
    <>
      <path
        id={id}
        style={edgeStyle}
        className={`react-flow__edge-path ${animated ? "react-flow__edge-path-animated" : ""}`}
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fill: color, fontSize: 12 }}
            startOffset="50%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {data.label}
          </textPath>
        </text>
      )}
    </>
  )
}

export default memo(CustomEdge)

