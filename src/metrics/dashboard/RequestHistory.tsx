"use client";

import React, { useState } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { useCanvasStore } from '@/store/canvasStore';
import { CheckCircle2, XCircle, Clock, ChevronRight, CornerDownRight, Play, Filter, ShieldAlert } from 'lucide-react';

export function RequestHistory() {
  const { requests, selectedRequestId, setSelectedRequestId } = useSimulationStore();
  const { activeProjectId, projects } = useCanvasStore();
  
  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'processing'>('all');

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Requests List */}
      <div className="w-80 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-muted/5 flex flex-col h-full shrink-0">
        <div className="px-4 py-3 border-b bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request History</h3>
          </div>
          <span className="text-[10px] font-black text-muted-foreground bg-muted border px-2 py-0.5 rounded-full select-none">
            {filteredRequests.length} / {requests.length}
          </span>
        </div>

        {/* Filters Tabs */}
        <div className="grid grid-cols-4 border-b border-border/60 text-[10px] font-bold text-muted-foreground bg-muted/5 p-1 gap-1 select-none">
          {(['all', 'completed', 'failed', 'processing'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`py-1 rounded-lg text-center capitalize cursor-pointer transition-colors ${
                filter === f
                  ? 'bg-background text-foreground border shadow-sm font-extrabold'
                  : 'hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 font-mono text-xs">
          {filteredRequests.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-center p-4">
              No matching requests found
            </div>
          ) : (
            filteredRequests.map((req) => (
              <button
                key={req.id}
                onClick={() => setSelectedRequestId(req.id)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-muted/45 cursor-pointer ${
                  selectedRequestId === req.id 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 pl-3.5 font-bold' 
                    : ''
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">{req.id}</span>
                  <span className="text-[9px] text-muted-foreground">Start: {req.startTime}ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{req.latency}ms</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    req.status === 'completed' ? 'bg-emerald-500' : req.status === 'failed' ? 'bg-red-500' : 'bg-blue-500 animate-ping'
                  }`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Selected Request Detail Panel */}
      <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-muted/5 flex flex-col h-full min-w-0">
        {selectedRequest ? (
          <div className="flex flex-col h-full overflow-hidden p-5 space-y-4">
            {/* Header details */}
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-foreground">{selectedRequest.id} Tracing Log</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  {selectedRequest.status === 'failed' && <XCircle className="w-3 h-3 text-red-500" />}
                  {selectedRequest.status === 'processing' && <Play className="w-3 h-3 text-blue-500 animate-pulse fill-current" />}
                  <span>{selectedRequest.status}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 border rounded-lg px-2.5 py-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Total Latency: {selectedRequest.latency}ms</span>
              </div>
            </div>

            {/* Traversal path hop graphics */}
            <div className="space-y-2 shrink-0">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Visual Hop Network Route</span>
              <div className="flex flex-wrap items-center gap-2 bg-muted/30 border p-3.5 rounded-2xl leading-relaxed select-none">
                {selectedRequest.path.map((nodeId, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0" />}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background border rounded-xl text-xs font-bold text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{getNodeLabel(nodeId)}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Trace Logs List */}
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Detailed Distributed Log Stream</span>
              <div className="flex-1 overflow-y-auto bg-black p-4 border border-zinc-800 rounded-2xl font-mono text-xs text-zinc-300 space-y-2 select-text">
                {selectedRequest.log.map((logLine, idx) => (
                  <div key={idx} className="flex gap-2.5 align-top leading-relaxed hover:text-white transition-colors">
                    <span className="text-zinc-650 font-bold shrink-0 select-none">[{idx + 1}]</span>
                    {logLine.includes('initiated') ? (
                      <span className="text-blue-400 font-semibold">{logLine}</span>
                    ) : logLine.includes('Arrived') ? (
                      <span className="text-zinc-300">{logLine}</span>
                    ) : logLine.includes('Cache Hit') ? (
                      <span className="text-blue-400 font-bold">{logLine}</span>
                    ) : logLine.includes('Cache Miss') ? (
                      <span className="text-red-400 font-bold">{logLine}</span>
                    ) : logLine.includes('Queue Overflow') || logLine.includes('overflow') || logLine.includes('dropped') ? (
                      <span className="text-red-500 font-extrabold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>{logLine}</span>
                      </span>
                    ) : logLine.includes('completed') ? (
                      <span className="text-emerald-400 font-bold">{logLine}</span>
                    ) : (
                      <span>{logLine}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <CornerDownRight className="w-8 h-8 text-muted-foreground/45 mb-2 animate-bounce" />
            <h4 className="font-extrabold text-muted-foreground/80">Select a Request to Inspect Traces</h4>
            <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">Select from the history on the left to see the request's precise hop-by-hop latency breakdown and routing log.</p>
          </div>
        )}
      </div>
    </div>
  );
}
