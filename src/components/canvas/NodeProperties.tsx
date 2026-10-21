"use client";

import React, { useEffect, useState } from 'react';
import { RequestState } from '@/simulation/request/RequestState';
import { useCanvasStore } from '@/store/canvasStore';
import { useSimulationStore } from '@/store/simulationStore';
import { useScalingStore } from '@/store/scalingStore';
import { simulatorInstance } from '@/simulation/engine/SimulationEngine';
import { resourceManagerInstance } from '@/simulation/load/ResourceManager';
import { InstanceSize } from '@/types/node';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const DEFAULT_LATENCY: Record<string, number> = {
  client: 0,
  api: 15,
  database: 50,
  redis: 2,
  kafka: 5,
  queue: 5,
  loadBalancer: 1,
};

export function NodeProperties() {
  const isRunning = useSimulationStore(state => state.isRunning);
  const requests = useSimulationStore(state => state.requests);
  const virtualTime = simulatorInstance.getVirtualTime();
  const scalingPolicies = useScalingStore(state => state.scalingPolicies);
  const nodeReplicas = useScalingStore(state => state.nodeReplicas);
  const virtualUsers = useScalingStore(state => state.virtualUsers);
  const requestsPerVu = useScalingStore(state => state.requestsPerVu);
  const trafficPattern = useScalingStore(state => state.trafficPattern);
  const generationLogs = useScalingStore(state => state.generationLogs);
  
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
  const [instanceSize, setInstanceSize] = useState<string>('small');
  const [processingTime, setProcessingTime] = useState<number>(10);

  // Edge states
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeStyle, setEdgeStyle] = useState('smoothstep');

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setWidth(selectedNode.data.width || 150);
      setHeight(selectedNode.data.height || 60);
      setInstanceSize(selectedNode.data.instanceSize as string || 'small');
      
      const type = selectedNode.data.type as string;
      const defaultTime = DEFAULT_LATENCY[type] || 10;
      setProcessingTime(selectedNode.data.processingTime !== undefined ? Number(selectedNode.data.processingTime) : defaultTime);
    }
  }, [selectedNode?.id, selectedNode?.data.label, selectedNode?.data.width, selectedNode?.data.height, selectedNode?.data.instanceSize, selectedNode?.data.processingTime]);

  useEffect(() => {
    if (selectedEdge) {
      const labelVal = typeof selectedEdge.label === 'string' 
        ? selectedEdge.label 
        : (selectedEdge.data?.label as string) || '';
      setEdgeLabel(labelVal);
      setEdgeStyle((selectedEdge.data?.type as string) || 'smoothstep');
    }
  }, [selectedNode, selectedEdge]);

  const activeReqsData = React.useMemo(() => {
    if (!isRunning || !selectedNodeId) return [];
    const activeReqs = requests.filter(r => 
      r.currentNode === selectedNodeId && (r.status === RequestState.PROCESSING || r.status === RequestState.QUEUED || r.status === RequestState.NETWORK)
    );
    
    return activeReqs.map(r => {
      const parts = r.id.split('-');
      return {
        id: r.id,
        vu: parts[1],
        createdAt: r.createdAt
      };
    });
  }, [isRunning, requests, selectedNodeId]);

  if (isRunning) {
    if (!selectedNode) {
      return (
        <aside className="w-80 border-l p-4 shrink-0 bg-card overflow-y-auto flex flex-col">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Live Node Data</h2>
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center">
            Select a node to track its active virtual users
          </div>
        </aside>
      );
    }

    return (
      <aside className="w-80 border-l p-4 shrink-0 bg-card overflow-y-auto flex flex-col">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Live Node Data</h2>
        
        <div className="p-4 bg-zinc-950 text-white rounded-xl shadow-inner border border-zinc-800 flex flex-col">
          <div className="font-bold border-b border-zinc-800 pb-2 mb-3 text-zinc-400 uppercase tracking-wider flex justify-between items-center text-xs">
            <span className="truncate mr-2">{selectedNode.data.label || 'Node'} - Live Req</span>
            <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">{activeReqsData.length}</span>
          </div>
          
          <div className="overflow-y-auto max-h-[300px] space-y-1.5 custom-scrollbar pr-1">
            {activeReqsData.length === 0 ? (
              <div className="text-xs text-zinc-600 italic py-4 text-center">No active requests on this node right now</div>
            ) : (
              activeReqsData.map(req => (
                <div key={req.id} className="text-emerald-400 flex items-center justify-between text-sm bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span className="truncate">User {req.vu} <span className="text-[10px] text-emerald-600/70">({req.id})</span></span>
                  </div>
                  <span className="text-[10px] text-emerald-600/70 font-mono bg-emerald-500/10 px-1 rounded shrink-0" title="Spawn time">
                    {Math.round(virtualTime - req.createdAt)}ms
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    );
  }

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

  const handleInstanceSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setInstanceSize(val);
    if (selectedNode) updateNodeData(selectedNode.id, { instanceSize: val as any });
  };

  const handleProcessingTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setProcessingTime(val);
    if (selectedNode) updateNodeData(selectedNode.id, { processingTime: val });
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

        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="processing-time" className="flex items-center justify-between">
            Processing Time (ms)
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Simulation</span>
          </Label>
          <Input 
            id="processing-time" 
            type="number" 
            value={processingTime} 
            onChange={handleProcessingTimeChange} 
            min={0}
            max={10000}
          />
        </div>

        {selectedNode?.data?.type && ['api', 'database', 'redis', 'queue', 'kafka'].includes(selectedNode.data.type as string) && (
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="instance-size" className="flex items-center justify-between">
              Instance Size
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Vertical Scaling</span>
            </Label>
            <select
              id="instance-size"
              value={instanceSize}
              onChange={handleInstanceSizeChange}
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 cursor-pointer"
            >
              <option value="small">Small (Base Capacity)</option>
              <option value="medium">Medium (2x Capacity)</option>
              <option value="large">Large (4x Capacity)</option>
            </select>
            
            {selectedNode && (
              <div className="grid grid-cols-2 gap-2 text-sm mt-3 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 bg-muted/30">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Max Workers</span>
                  <span className="font-mono font-bold">
                    {resourceManagerInstance.getCapacity(selectedNode.data.type as string, nodeReplicas[selectedNode.id] || 1, instanceSize as InstanceSize).maxWorkers.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Max Queue</span>
                  <span className="font-mono font-bold">
                    {resourceManagerInstance.getCapacity(selectedNode.data.type as string, nodeReplicas[selectedNode.id] || 1, instanceSize as InstanceSize).maxQueue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-muted-foreground mt-2">
              Affects max threads, queue capacity, memory, and cost. Capacity scales linearly with Auto-Scaling replicas.
            </p>
          </div>
        )}

        {selectedNode && scalingPolicies[selectedNode.id]?.enabled && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="flex items-center justify-between text-muted-foreground">
              Current Replicas
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Auto-Scaled</span>
            </Label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm font-mono font-bold">
              {nodeReplicas[selectedNode.id] || 1} Instances
            </div>
          </div>
        )}

        {selectedNode?.data?.type === 'client' && (
          <div className="space-y-4 pt-4 border-t">
            <Label className="flex items-center justify-between">
              Load Generator
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Source</span>
            </Label>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 p-2 rounded-md border border-input">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-1">Virtual Users</span>
                <span className="font-mono font-bold">{virtualUsers.toLocaleString()}</span>
              </div>
              <div className="bg-muted/50 p-2 rounded-md border border-input">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-1">Reqs / VU</span>
                <span className="font-mono font-bold">{requestsPerVu.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-muted/50 p-2 rounded-md border border-input">
              <span className="text-muted-foreground text-[10px] uppercase font-bold flex justify-between mb-1">
                <span>Total Requests</span>
                <span className="capitalize text-blue-600 dark:text-blue-400">{trafficPattern.type}</span>
              </span>
              <span className="font-mono font-bold text-lg">{(virtualUsers * requestsPerVu).toLocaleString()}</span>
            </div>

            {generationLogs.length > 0 && (
              <div className="bg-zinc-950 p-2 rounded-md border border-zinc-800 space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Live Generation Log</span>
                {generationLogs.map((log, idx) => (
                  <div key={idx} className="font-mono text-[10px] text-green-400/90 leading-tight">
                    &gt; {log}
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Adjust load generation settings in the <strong>Load & Scale</strong> panel.
            </p>
          </div>
        )}
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
