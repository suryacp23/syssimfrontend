"use client";

import { Handle, Position } from '@xyflow/react';
import { SystemNodeData } from '@/types/node';
import { MonitorSmartphone, Server, Database, Container, Box, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomNode({ data, selected }: { data: SystemNodeData; selected: boolean }) {
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

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-card border-2 rounded-xl shadow-sm transition-all overflow-hidden",
        selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/50"
      )}
      style={{ width, height }}
    >
      <Handle type="target" position={Position.Top} id="top" className="w-2 h-2 !bg-primary/50 !border-background" />
      <Handle type="target" position={Position.Left} id="left" className="w-2 h-2 !bg-primary/50 !border-background" />
      
      <div className="flex items-center justify-center gap-3 w-full px-2">
        <div className="shrink-0">{getIcon()}</div>
        <div className="font-medium text-sm truncate max-w-[calc(100%-2.5rem)]">{data.label}</div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 !bg-primary/50 !border-background" />
      <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-primary/50 !border-background" />
    </div>
  );
}
