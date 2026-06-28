"use client";

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
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
}: EdgeProps) {
  const { removeEdge, setSelectedEdgeId, activeProjectId, projects } = useCanvasStore();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
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

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={style} 
        className={cn(selected ? "stroke-primary stroke-[3px]" : "stroke-border hover:stroke-primary/50")}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={cn(
            "nodrag nopan transition-all duration-200 flex flex-col items-center gap-1.5",
            selected ? "opacity-100 z-50 scale-100" : "opacity-0 scale-95 pointer-events-none"
          )}
          onClick={onEdgeClick}
        >
          <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border shadow-sm px-2.5 py-1 rounded-md text-xs font-medium text-foreground whitespace-nowrap">
            <span className="truncate max-w-[100px]">{sourceNode?.data.label || 'Unknown'}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="truncate max-w-[100px]">{targetNode?.data.label || 'Unknown'}</span>
          </div>
          
          <button
            className="flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-destructive text-destructive-foreground shadow-sm hover:scale-105 transition-transform text-xs font-medium"
            onClick={handleDelete}
            onPointerDown={handleDelete}
            title="Delete Edge"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
