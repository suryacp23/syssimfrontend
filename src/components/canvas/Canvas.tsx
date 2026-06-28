"use client";

import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  NodeMouseHandler,
  Connection,
  Edge,
  HandleType,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

import '@xyflow/react/dist/style.css';

import { useCanvasStore, SystemNode } from '@/store/canvasStore';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { CanvasToolbar } from './CanvasToolbar';
import { SimulationControls } from './SimulationControls';
import { SystemNodeType, SystemNodeData } from '@/types/node';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSimulation } from '@/hooks/useSimulation';
import { ContextMenu } from './ContextMenu';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  // Tick simulator clock loop
  useSimulation();
  
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
    reconnectEdge,
    duplicateNode,
    copySelection,
    bringToFront,
    sendToBack,
  } = useCanvasStore();

  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  const edges = activeProjectId ? projects[activeProjectId]?.edges || [] : [];

  // Register Keyboard Shortcuts
  useKeyboardShortcuts();

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: SystemNode;
  } | null>(null);

  // Edge Reconnection State
  const edgeReconnectSuccessful = useRef(true);

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
      setContextMenu(null);
    },
    [setSelectedNodeId, setSelectedEdgeId]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
      setContextMenu(null);
    },
    [setSelectedEdgeId, setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  const onNodeDragStart = useCallback(() => {
    useCanvasStore.getState().pushState();
  }, []);

  // Context Menu Handlers
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        node: node as SystemNode,
      });
    },
    []
  );

  const onRenameNode = useCallback(
    (node: SystemNode) => {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      // Let React state update and then focus the input
      setTimeout(() => {
        const input = document.getElementById('node-label');
        if (input) {
          input.focus();
          (input as HTMLInputElement).select();
        }
      }, 50);
    },
    [setSelectedNodeId, setSelectedEdgeId]
  );

  const onCopyNode = useCallback(
    (node: SystemNode) => {
      const previousNodes = [...nodes];
      const previousEdges = [...edges];

      // Select ONLY the targeted node in store temporarily to copy it
      useCanvasStore.setState((state) => {
        const proj = state.projects[activeProjectId!];
        if (!proj) return {};
        return {
          projects: {
            ...state.projects,
            [activeProjectId!]: {
              nodes: proj.nodes.map((n) => ({ ...n, selected: n.id === node.id })),
              edges: proj.edges.map((e) => ({ ...e, selected: false })),
            },
          },
        };
      });

      copySelection();

      // Restore previous selections
      useCanvasStore.setState({
        projects: {
          ...useCanvasStore.getState().projects,
          [activeProjectId!]: { nodes: previousNodes, edges: previousEdges },
        },
      });
    },
    [nodes, edges, activeProjectId, copySelection]
  );

  // Edge Reconnection Handlers
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      reconnectEdge(oldEdge, newConnection);
    },
    [reconnectEdge]
  );

  const onReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        useCanvasStore.getState().removeEdge(edge.id);
      }
      edgeReconnectSuccessful.current = true;
    },
    []
  );

  // Connection Validation (Prevent self-loops and duplicate edges)
  const isValidConnection = useCallback(
    (connection: any) => {
      // Prevent connecting to self
      if (connection.source === connection.target) return false;

      // Prevent duplicate connections (same handles)
      const exists = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.sourceHandle === connection.sourceHandle &&
          edge.target === connection.target &&
          edge.targetHandle === connection.targetHandle
      );
      if (exists) return false;

      return true;
    },
    [edges]
  );

  return (
    <div className="w-full h-full relative animate-fade-in" ref={reactFlowWrapper}>
      <CanvasToolbar />
      <SimulationControls />
      
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
        onNodeContextMenu={onNodeContextMenu}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        isValidConnection={isValidConnection}
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
            <div className="text-4xl mb-4 animate-bounce">✨</div>
            <p className="text-lg font-medium">Drop components here</p>
          </div>
        )}
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onRename={onRenameNode}
          onDuplicate={(node) => duplicateNode(node.id)}
          onDelete={(node) => removeNode(node.id)}
          onCopy={onCopyNode}
          onBringForward={(node) => bringToFront(node.id)}
          onSendBack={(node) => sendToBack(node.id)}
        />
      )}
    </div>
  );
}
