"use client";

import React, { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  NodeMouseHandler,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store/canvasStore';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { CanvasToolbar } from './CanvasToolbar';
import { SystemNodeType, SystemNodeData } from '@/types/node';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const {
    activeProjectId,
    projects,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
    setSelectedEdgeId,
    removeNode,
  } = useCanvasStore();

  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  const edges = activeProjectId ? projects[activeProjectId]?.edges || [] : [];

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as SystemNodeType;
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: uuidv4(),
        type: 'custom',
        position,
        data: { label, type, width: 150, height: 60 } as SystemNodeData,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
    },
    [setSelectedNodeId, setSelectedEdgeId]
  );

  const onEdgeClick = useCallback(
    (_, edge) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
    },
    [setSelectedEdgeId, setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  const onNodeDragStart = useCallback(() => {
    useCanvasStore.getState().pushState();
  }, []);

  // React Flow handles Backspace and Delete internally for selected nodes and edges.

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <CanvasToolbar />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ccc" gap={16} />
        <MiniMap 
          zoomable 
          pannable 
          className="!bottom-4 !right-4 !border-zinc-800 !rounded-xl overflow-hidden shadow-md"
          style={{ backgroundColor: '#09090b' }} // zinc-950
          maskColor="#27272a80" // zinc-800 with opacity for the mask
          nodeColor="#52525b" // zinc-500 for nodes in the minimap
        />
        <Controls className="!bottom-4 !left-4 [&_button]:!bg-zinc-950 [&_button]:!text-zinc-100 [&_button]:!border-zinc-800 [&_button]:hover:!bg-zinc-900 shadow-md rounded-md overflow-hidden" />
        
        {nodes.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none select-none flex flex-col items-center">
            <div className="text-4xl mb-4">✨</div>
            <p className="text-lg font-medium">Drop components here</p>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}
