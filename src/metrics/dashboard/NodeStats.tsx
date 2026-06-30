"use client";

import React from 'react';
import { NodeMetricsSummary } from '@/store/metricsStore';
import { Server, Database, Container, Box, Network, MonitorSmartphone, ShieldAlert, Heart } from 'lucide-react';

interface NodeStatsProps {
  nodeStats: Record<string, NodeMetricsSummary>;
}

export function NodeStats({ nodeStats }: NodeStatsProps) {
  const statsList = Object.values(nodeStats);

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <MonitorSmartphone className="w-4 h-4 text-blue-500" />;
      case 'api': return <Server className="w-4 h-4 text-green-500" />;
      case 'database': return <Database className="w-4 h-4 text-indigo-500" />;
      case 'redis': return <Container className="w-4 h-4 text-red-500" />;
      case 'queue': return <Box className="w-4 h-4 text-orange-500" />;
      case 'loadBalancer': return <Network className="w-4 h-4 text-purple-500" />;
      default: return <Server className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthStatus = (node: NodeMetricsSummary) => {
    if (node.nodeType === 'queue' && node.dropped > 0) {
      return { label: 'Degraded (Drops)', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }
    if (node.nodeType === 'database' && node.averageLatency > 60) {
      return { label: 'High Latency', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    }
    if (node.activeRequests > 6) {
      return { label: 'High Load', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    }
    return { label: 'Healthy', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  };

  if (statsList.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground/60 border rounded-2xl bg-muted/5">
        No node activity metrics recorded yet. Run the simulation to see node stats.
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-muted/5 flex flex-col h-full">
      <div className="px-4 py-3 border-b bg-muted/10 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Node Performance Statistics</h3>
        <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold border border-blue-500/15">
          {statsList.length} Nodes Monitored
        </span>
      </div>
      <div className="flex-1 overflow-x-auto min-h-0 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/10 font-bold text-muted-foreground text-[10px] uppercase select-none">
              <th className="px-4 py-2.5">Node</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5 text-right">Processed</th>
              <th className="px-4 py-2.5 text-right">Active</th>
              <th className="px-4 py-2.5 text-right">Avg Latency</th>
              <th className="px-4 py-2.5 text-right">Cache Hit Ratio</th>
              <th className="px-4 py-2.5 text-right font-semibold">Queue (Size / Deq / Drop)</th>
              <th className="px-4 py-2.5 text-center">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono text-zinc-700 dark:text-zinc-300">
            {statsList.map((node) => {
              const health = getHealthStatus(node);
              const cacheTotal = node.cacheHits + node.cacheMisses;
              const hitRate = cacheTotal > 0 ? Math.round((node.cacheHits / cacheTotal) * 100) : null;

              return (
                <tr key={node.nodeId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-sans font-semibold text-foreground flex items-center gap-2 truncate max-w-[150px]">
                    {getIcon(node.nodeType)}
                    <span>{node.nodeName}</span>
                  </td>
                  <td className="px-4 py-2.5 font-sans text-muted-foreground capitalize">{node.nodeType}</td>
                  <td className="px-4 py-2.5 text-right font-bold">{node.processedRequests}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-blue-500 dark:text-blue-400">{node.activeRequests}</td>
                  <td className="px-4 py-2.5 text-right font-bold">{node.averageLatency > 0 ? `${node.averageLatency}ms` : '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">
                    {hitRate !== null ? `${hitRate}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-orange-500">
                    {node.nodeType === 'queue' ? (
                      <span className="flex items-center justify-end gap-1">
                        <span>{node.activeRequests}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-emerald-500">{node.dequeued}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className={node.dropped > 0 ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}>{node.dropped}</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center font-sans">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${health.color}`}>
                      {health.label === 'Healthy' ? <Heart className="w-2.5 h-2.5 fill-current" /> : <ShieldAlert className="w-2.5 h-2.5 fill-current" />}
                      <span>{health.label}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
