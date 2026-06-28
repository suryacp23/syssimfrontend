import React from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  EdgeProps, 
  getBezierPath, 
  getSmoothStepPath, 
  getStraightPath 
} from '@xyflow/react';
import { useCanvasStore } from '@/store/canvasStore';
import { Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  label,
  data,
}: EdgeProps) {
  const { removeEdge, setSelectedEdgeId, activeProjectId, projects } = useCanvasStore();

  const pathType = data?.type || 'smoothstep';

  let pathResult;
  if (pathType === 'bezier') {
    pathResult = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else if (pathType === 'straight') {
    pathResult = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else {
    pathResult = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 10,
    });
  }

  const [edgePath, labelX, labelY] = pathResult;

  const onEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEdgeId(id);
  };

  const handleDelete = (event: React.MouseEvent | React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    removeEdge(id);
  };

  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  const displayLabel = label || (data?.label as string);

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={style} 
        className={cn(
          "transition-all duration-150",
          selected 
            ? "stroke-blue-500 stroke-[3px] filter drop-shadow-[0_0_4px_rgba(59,130,246,0.4)]" 
            : "stroke-zinc-400 stroke-[2px] hover:stroke-blue-500/50 dark:stroke-zinc-700 dark:hover:stroke-blue-500/50"
        )}
      />
      <EdgeLabelRenderer>
        {/* Render persistent label when not selected */}
        {!selected && displayLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            onClick={onEdgeClick}
            className="nodrag nopan bg-zinc-950/90 dark:bg-zinc-900/95 border border-zinc-800 shadow-sm px-2 py-0.5 rounded-full text-[10px] font-semibold text-zinc-300 whitespace-nowrap cursor-pointer hover:border-zinc-650 hover:text-white transition-colors"
          >
            {displayLabel}
          </div>
        )}

        {/* Render selection overlay (only delete icon, small & static) when selected */}
        {selected && (
          <button
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md border border-red-500 z-50 cursor-pointer"
            onClick={handleDelete}
            onPointerDown={handleDelete}
            title="Delete Edge"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
