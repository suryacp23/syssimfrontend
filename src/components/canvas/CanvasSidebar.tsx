"use client";

import React from 'react';
import { MonitorSmartphone, Server, Database, Container, Box, Network } from 'lucide-react';
import { SystemNodeType } from '@/types/node';

interface SidebarItemProps {
  type: SystemNodeType;
  label: string;
  icon: React.ReactNode;
}

const SIDEBAR_ITEMS: SidebarItemProps[] = [
  { type: 'client', label: 'Client', icon: <MonitorSmartphone className="w-5 h-5 text-blue-500" /> },
  { type: 'api', label: 'API Server', icon: <Server className="w-5 h-5 text-green-500" /> },
  { type: 'loadBalancer', label: 'Load Balancer', icon: <Network className="w-5 h-5 text-purple-500" /> },
  { type: 'database', label: 'Database', icon: <Database className="w-5 h-5 text-indigo-500" /> },
  { type: 'redis', label: 'Redis', icon: <Container className="w-5 h-5 text-red-500" /> },
  { type: 'queue', label: 'Queue', icon: <Box className="w-5 h-5 text-orange-500" /> },
];

export function CanvasSidebar() {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 border-r p-4 shrink-0 bg-card overflow-y-auto flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Components</h2>
        <div className="flex flex-col gap-2">
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.type}
              className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:border-primary hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
              onDragStart={(event) => onDragStart(event, item.type, item.label)}
              draggable
            >
              <div className="shrink-0">{item.icon}</div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
