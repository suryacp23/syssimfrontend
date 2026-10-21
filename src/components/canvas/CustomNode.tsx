"use client";

import { Handle, Position } from '@xyflow/react';
import { SystemNodeData } from '@/types/node';
import { MonitorSmartphone, Server, Database, Container, Box, Network, AlertCircle, AlertOctagon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/store/simulationStore';
import { useFailureStore } from '@/store/failureStore';
import { useScalingStore } from '@/store/scalingStore';
import React from 'react';

export function CustomNode({ id, data, selected }: { id: string; data: SystemNodeData; selected: boolean }) {
  const activeCount = useSimulationStore(state => state.activeNodes[id] || 0);
  const isActive = activeCount > 0;
  const processedCount = useSimulationStore(state => state.processedNodes[id] || 0);
  const isSimulationActive = useSimulationStore(state => state.isRunning);
  const healthStatus = useFailureStore(state => state.healthStatus[id] || 'healthy');
  const replicas = useScalingStore(state => state.nodeReplicas[id] || 1);

  const getIcon = () => {
    switch (data.type) {
      case 'client': return <MonitorSmartphone className="w-6 h-6 text-blue-500" />;
      case 'api': return <Server className="w-6 h-6 text-green-500" />;
      case 'database': return <Database className="w-6 h-6 text-indigo-500" />;
      case 'redis': return <Container className="w-6 h-6 text-red-500" />; // Redis-ish color
      case 'queue': return <Box className="w-6 h-6 text-orange-500" />;
      case 'loadBalancer': return <Network className="w-6 h-6 text-purple-500" />;
      default: return <Server className="w-6 h-6 text-gray-500" />;
    }
  };

  const width = data.width || 150;
  const height = data.height || 60;

  const getHeatmapClass = () => {
    if (!isSimulationActive) {
      return selected 
        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.3)] scale-[1.02]" 
        : "border-border hover:border-zinc-400 dark:hover:border-zinc-650";
    }

    if (healthStatus === 'unavailable') {
      return "border-red-600 bg-red-50/20 dark:bg-red-950/20 grayscale opacity-80 shadow-[0_0_15px_rgba(220,38,38,0.5)]";
    }
    if (healthStatus === 'degraded') {
      return "border-orange-500 bg-orange-50/10 dark:bg-orange-950/10 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse";
    }

    if (activeCount <= 1) {
      return selected
        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-[1.02] bg-emerald-50/5 dark:bg-emerald-950/5"
        : "border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-emerald-50/5 dark:bg-emerald-950/5";
    }
    
    if (activeCount <= 3) {
      return selected
        ? "border-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.02] bg-amber-50/5 dark:bg-amber-950/5"
        : "border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] bg-amber-50/5 dark:bg-amber-950/5";
    }

    if (activeCount <= 6) {
      return selected
        ? "border-orange-500 ring-2 ring-orange-500/20 shadow-[0_0_18px_rgba(249,115,22,0.6)] scale-[1.02] bg-orange-50/10 dark:bg-orange-950/10"
        : "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] bg-orange-50/5 dark:bg-orange-950/5 animate-pulse";
    }

    return selected
      ? "border-rose-500 ring-2 ring-rose-500/20 shadow-[0_0_22px_rgba(239,68,68,0.8)] scale-[1.03] bg-rose-50/10 dark:bg-rose-950/10"
      : "border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] scale-[1.02] bg-rose-50/5 dark:bg-rose-950/5 animate-pulse";
  };

  const getBulletColor = () => {
    if (activeCount <= 1) return 'bg-emerald-500';
    if (activeCount <= 3) return 'bg-amber-500';
    if (activeCount <= 6) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const getBadgeColor = () => {
    if (activeCount <= 1) return 'bg-emerald-500';
    if (activeCount <= 3) return 'bg-amber-500';
    if (activeCount <= 6) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const getHealthIndicator = () => {
    switch (healthStatus) {
      case 'slow': return <Clock className="w-3.5 h-3.5 text-yellow-500 absolute -top-1.5 -left-1.5 drop-shadow-md bg-white dark:bg-black rounded-full" />;
      case 'degraded': return <AlertCircle className="w-3.5 h-3.5 text-orange-500 absolute -top-1.5 -left-1.5 drop-shadow-md animate-pulse bg-white dark:bg-black rounded-full" />;
      case 'unavailable': return <AlertOctagon className="w-4 h-4 text-red-600 absolute -top-2 -left-2 drop-shadow-md animate-bounce bg-white dark:bg-black rounded-full" />;
      default: return null;
    }
  };

  return (
    <div className="relative" style={{ width, height }}>
      {/* Replica Stack Visuals */}
      {replicas > 1 && Array.from({ length: Math.min(replicas - 1, 3) }).map((_, idx) => (
        <div
          key={`replica-${idx}`}
          className="absolute inset-0 bg-card border-2 border-blue-500/40 rounded-xl transition-all duration-300 pointer-events-none"
          style={{
            transform: `translate(${(idx + 1) * 6}px, ${(idx + 1) * 6}px)`,
            zIndex: -1 - idx,
            opacity: 1 - (idx * 0.2)
          }}
        />
      ))}

      {/* Main Node Body */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-card border-2 rounded-xl shadow-sm transition-all duration-300 ease-out overflow-hidden z-10",
          getHeatmapClass()
        )}
      >
        {getHealthIndicator()}
        
        <Handle type="target" position={Position.Top} id="top" className="w-2 h-2 !bg-primary/50 !border-background z-20" />
        <Handle type="target" position={Position.Left} id="left" className="w-2 h-2 !bg-primary/50 !border-background z-20" />
        
        <div className={cn(
          "flex items-center justify-center gap-3 w-full px-2 transition-all",
          isSimulationActive && "pb-3.5"
        )}>
          <div className="shrink-0">{getIcon()}</div>
          <div className="font-medium text-sm truncate max-w-[calc(100%-2.5rem)]">{data.label}</div>
        </div>

        <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 !bg-primary/50 !border-background z-20" />
        <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-primary/50 !border-background z-20" />

        {/* Active Processing Count Badge */}
        {isActive && (
          <div className={cn(
            "absolute top-1 right-1 min-w-[14px] h-[14px] rounded-sm text-white flex items-center justify-center text-[8px] font-black px-0.5 pointer-events-none select-none z-20",
            getBadgeColor()
          )}>
            {activeCount}
          </div>
        )}

        {/* Static Simulation Statistics Overlay Footer */}
        {isSimulationActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[15px] bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-2 text-[8px] font-black text-muted-foreground select-none font-mono z-20">
            <span className="flex items-center gap-0.5">
              <span className={cn("w-1 h-1 rounded-full", getBulletColor())} />
              <span>ACT: {activeCount}</span>
            </span>
            <span>TOT: {processedCount}</span>
          </div>
        )}
      </div>

      {/* Auto-Scaling Replicas Badge (Hovering outside the node) */}
      {replicas > 1 && (
        <div className="absolute -top-3 right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm flex items-center gap-1 border border-blue-600 z-30">
          <Server className="w-2.5 h-2.5" />
          <span>x{replicas}</span>
        </div>
      )}
    </div>
  );
}
