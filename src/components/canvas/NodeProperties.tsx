"use client";

import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function NodeProperties() {
  const { activeProjectId, projects, selectedNodeId, selectedEdgeId, updateNodeData, removeNode, removeEdge } = useCanvasStore();
  
  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  const edges = activeProjectId ? projects[activeProjectId]?.edges || [] : [];
  
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  const [label, setLabel] = useState('');
  const [width, setWidth] = useState<number>(150);
  const [height, setHeight] = useState<number>(60);

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setWidth(selectedNode.data.width || 150);
      setHeight(selectedNode.data.height || 60);
    }
  }, [selectedNode?.id, selectedNode?.data.label, selectedNode?.data.width, selectedNode?.data.height]);

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="w-80 border-l p-4 shrink-0 bg-card overflow-y-auto flex flex-col">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Properties</h2>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center">
          Select a node or edge to view properties
        </div>
      </aside>
    );
  }

  if (selectedEdge) {
    const sourceNode = nodes.find(n => n.id === selectedEdge.source);
    const targetNode = nodes.find(n => n.id === selectedEdge.target);

    return (
      <aside className="w-80 border-l p-4 shrink-0 bg-card overflow-y-auto flex flex-col h-full">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Edge Properties</h2>
        
        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <Label>Connection</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              <div className="font-medium truncate" title={sourceNode?.data.label || 'Unknown Node'}>
                From: {sourceNode?.data.label || 'Unknown Node'}
              </div>
              <div className="font-medium truncate mt-2" title={targetNode?.data.label || 'Unknown Node'}>
                To: {targetNode?.data.label || 'Unknown Node'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button 
            variant="destructive" 
            className="w-full gap-2"
            onClick={() => removeEdge(selectedEdge.id)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Edge
          </Button>
        </div>
      </aside>
    );
  }

  // Node Properties handling
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    if (selectedNode) updateNodeData(selectedNode.id, { label: e.target.value });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 150;
    setWidth(val);
    if (selectedNode) updateNodeData(selectedNode.id, { width: val });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 60;
    setHeight(val);
    if (selectedNode) updateNodeData(selectedNode.id, { height: val });
  };

  return (
    <aside className="w-80 border-l p-4 shrink-0 bg-card overflow-y-auto flex flex-col h-full">
      <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Node Properties</h2>
      
      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <Label htmlFor="node-label">Label</Label>
          <Input 
            id="node-label" 
            value={label} 
            onChange={handleLabelChange} 
            placeholder="Node label" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-width">Width (px)</Label>
          <Input 
            id="node-width" 
            type="number" 
            value={width} 
            onChange={handleWidthChange} 
            min={100}
            max={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-height">Height (px)</Label>
          <Input 
            id="node-height" 
            type="number" 
            value={height} 
            onChange={handleHeightChange} 
            min={40}
            max={300}
          />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t">
        <Button 
          variant="destructive" 
          className="w-full gap-2"
          onClick={() => selectedNode && removeNode(selectedNode.id)}
        >
          <Trash2 className="w-4 h-4" />
          Delete Node
        </Button>
      </div>
    </aside>
  );
}
