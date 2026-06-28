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

        {/* Render selection overlay (connections + delete button) when selected */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan flex flex-col items-center gap-1.5 z-50 animate-in fade-in scale-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center bg-zinc-950/95 border border-zinc-800 shadow-xl p-2.5 rounded-xl text-xs text-zinc-300 gap-1.5 min-w-[140px]">
              <div className="flex items-center gap-1.5 font-medium border-b border-zinc-900 pb-1 w-full justify-center px-1">
                <span className="truncate max-w-[70px]" title={sourceNode?.data.label}>
                  {sourceNode?.data.label || 'Node'}
                </span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
                <span className="truncate max-w-[70px]" title={targetNode?.data.label}>
                  {targetNode?.data.label || 'Node'}
                </span>
              </div>
              
              {displayLabel && (
                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-850 rounded-md text-[10px] font-mono text-zinc-400">
                  {displayLabel}
                </span>
              )}

              <button
                className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors text-[11px] font-medium cursor-pointer shadow-sm"
                onClick={handleDelete}
                onPointerDown={handleDelete}
                title="Delete Edge"
              >
                <Trash2 className="w-3 h-3" />
                Delete Edge
              </button>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
