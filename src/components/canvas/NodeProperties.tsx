"use client";

import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function NodeProperties() {
  const { 
    activeProjectId, 
    projects, 
    selectedNodeId, 
    selectedEdgeId, 
    updateNodeData, 
    removeNode, 
    removeEdge,
    updateEdge 
  } = useCanvasStore();
  
  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  const edges = activeProjectId ? projects[activeProjectId]?.edges || [] : [];
  
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // Node states
  const [label, setLabel] = useState('');
  const [width, setWidth] = useState<number>(150);
  const [height, setHeight] = useState<number>(60);

  // Edge states
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeStyle, setEdgeStyle] = useState('smoothstep');

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setWidth(selectedNode.data.width || 150);
      setHeight(selectedNode.data.height || 60);
    }
  }, [selectedNode?.id, selectedNode?.data.label, selectedNode?.data.width, selectedNode?.data.height]);

  useEffect(() => {
    if (selectedEdge) {
      const labelVal = typeof selectedEdge.label === 'string' 
        ? selectedEdge.label 
        : (selectedEdge.data?.label as string) || '';
      setEdgeLabel(labelVal);
      setEdgeStyle((selectedEdge.data?.type as string) || 'smoothstep');
    }
  }, [selectedEdge?.id, selectedEdge?.label, selectedEdge?.data?.type]);

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

  // Edge properties panel
  if (selectedEdge) {
    const sourceNode = nodes.find(n => n.id === selectedEdge.source);
    const targetNode = nodes.find(n => n.id === selectedEdge.target);

    const handleEdgeLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setEdgeLabel(val);
      updateEdge(selectedEdge.id, { label: val, data: { label: val } });
    };

    const handleEdgeStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setEdgeStyle(val);
      updateEdge(selectedEdge.id, { data: { type: val } });
    };

    const handlePresetClick = (preset: string) => {
      setEdgeLabel(preset);
      updateEdge(selectedEdge.id, { label: preset, data: { label: preset } });
    };

    const presets = ["Reads", "Writes", "Cache Hit", "Cache Miss", "Sync", "Async"];

    return (
      <aside className="w-80 border-l p-4 shrink-0 bg-card overflow-y-auto flex flex-col h-full">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Edge Properties</h2>
        
        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <Label>Connection</Label>
            <div className="p-3 bg-muted/50 border rounded-xl text-sm">
              <div className="font-medium truncate" title={sourceNode?.data.label || 'Unknown Node'}>
                <span className="text-muted-foreground text-xs block mb-0.5">Source Node</span>
                {sourceNode?.data.label || 'Unknown Node'}
              </div>
              <div className="font-medium truncate mt-3 border-t pt-2" title={targetNode?.data.label || 'Unknown Node'}>
                <span className="text-muted-foreground text-xs block mb-0.5">Target Node</span>
                {targetNode?.data.label || 'Unknown Node'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edge-label">Label</Label>
            <Input 
              id="edge-label" 
              value={edgeLabel} 
              onChange={handleEdgeLabelChange} 
              placeholder="e.g. Reads, Writes, Call" 
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-750 hover:text-foreground transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edge-style">Edge Style</Label>
            <select
              id="edge-style"
              value={edgeStyle}
              onChange={handleEdgeStyleChange}
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 cursor-pointer"
            >
              <option value="smoothstep">Smooth Step</option>
              <option value="bezier">Bezier</option>
              <option value="straight">Straight</option>
            </select>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button 
            variant="destructive" 
            className="w-full gap-2 cursor-pointer"
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
          className="w-full gap-2 cursor-pointer"
          onClick={() => selectedNode && removeNode(selectedNode.id)}
        >
          <Trash2 className="w-4 h-4" />
          Delete Node
        </Button>
      </div>
    </aside>
  );
}
