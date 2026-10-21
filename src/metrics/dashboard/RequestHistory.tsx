"use client";

import React, { useState } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { useCanvasStore } from '@/store/canvasStore';
import { CheckCircle2, XCircle, Clock, ChevronRight, CornerDownRight, Play, Filter, ShieldAlert, Search } from 'lucide-react';
import { RequestState } from '@/simulation/request/RequestState';

export function RequestHistory() {
  const { requests, selectedRequestId, setSelectedRequestId } = useSimulationStore();
  const { activeProjectId, projects } = useCanvasStore();
  
  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  
  const [filter, setFilter] = useState<{
    search: string;
    type: 'all' | RequestState.COMPLETED | RequestState.FAILED | RequestState.PROCESSING;
  }>({ search: '', type: 'all' });

  const filteredRequests = requests.filter(req => {
    const matchSearch = filter.search === '' || req.id.toLowerCase().includes(filter.search.toLowerCase());
    const matchType = filter.type === 'all' || req.status === filter.type;
    return matchSearch && matchType;
  });

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case RequestState.COMPLETED: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case RequestState.FAILED: return 'bg-red-500/10 text-red-500 border-red-500/20';
      case RequestState.PROCESSING: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
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

        {/* Filters & Search */}
        <div className="p-2 border-b border-border/60 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search request..." 
              className="w-full pl-7 pr-2 py-1 text-xs bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
            />
          </div>
          <div className="flex gap-1 text-[10px] font-bold overflow-x-auto pb-1">
            <button onClick={() => setFilter({ ...filter, type: 'all' })} className={`px-2.5 py-1 rounded-full whitespace-nowrap ${filter.type === 'all' ? 'bg-muted text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>All</button>
            <button onClick={() => setFilter({ ...filter, type: RequestState.COMPLETED })} className={`px-2.5 py-1 rounded-full whitespace-nowrap ${filter.type === RequestState.COMPLETED ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'hover:bg-muted text-muted-foreground'}`}>Completed</button>
            <button onClick={() => setFilter({ ...filter, type: RequestState.FAILED })} className={`px-2.5 py-1 rounded-full whitespace-nowrap ${filter.type === RequestState.FAILED ? 'bg-red-500/20 text-red-700 dark:text-red-400' : 'hover:bg-muted text-muted-foreground'}`}>Failed</button>
            <button onClick={() => setFilter({ ...filter, type: RequestState.PROCESSING })} className={`px-2.5 py-1 rounded-full whitespace-nowrap ${filter.type === RequestState.PROCESSING ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'hover:bg-muted text-muted-foreground'}`}>Processing</button>
          </div>
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
                className={`w-full text-left px-4 py-2.5 flex flex-col gap-2 transition-colors hover:bg-muted/45 cursor-pointer ${
                  selectedRequestId === req.id 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 pl-3.5 font-bold' 
                    : ''
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-foreground">{req.id}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{req.latency}ms</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      req.status === RequestState.COMPLETED ? 'bg-emerald-500' : req.status === RequestState.FAILED ? 'bg-red-500' : 'bg-blue-500 animate-ping'
                    }`} />
                  </div>
                </div>
                <div className="p-2 bg-black/5 dark:bg-black/20 rounded-lg max-h-20 overflow-y-auto space-y-0.5 font-mono text-[9px] text-muted-foreground w-full">
                  {req.logs.slice(-3).map((log, idx) => (
                    <div key={idx} className="truncate">[{Math.round(log.timestamp)}ms] {log.nodeId}: {log.event}</div>
                  ))}
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
                  {selectedRequest.status === RequestState.COMPLETED && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  {selectedRequest.status === RequestState.FAILED && <XCircle className="w-3 h-3 text-red-500" />}
                  {selectedRequest.status === RequestState.PROCESSING && <Play className="w-3 h-3 text-blue-500 animate-pulse fill-current" />}
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
              <div className="flex-1 overflow-y-auto bg-black p-4 border border-zinc-800 rounded-2xl font-mono text-xs text-zinc-300 space-y-4 select-text custom-scrollbar">
                <div className="relative">
                  <div className="absolute top-2 bottom-2 left-[36px] w-px bg-zinc-800"></div>
                  {selectedRequest.logs.map((log, idx) => {
                    const time = `${Math.round(log.timestamp)}ms`;
                    const msg = log.event;

                    return (
                      <div key={idx} className="relative flex gap-4 align-top leading-relaxed hover:bg-white/5 transition-colors p-1.5 -ml-1.5 rounded-lg group">
                        <div className="w-[36px] text-right shrink-0 relative z-10 pt-0.5">
                          <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-400 bg-black py-1">{time}</span>
                        </div>
                        <div className="absolute left-[36px] top-3 w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-blue-500 border border-black transform -translate-x-1/2 z-10"></div>
                        <div className="flex-1 text-zinc-400 pt-0.5">
                          {msg.includes('initiated') || msg.includes('start') ? (
                            <span className="text-blue-400 font-semibold">{msg}</span>
                          ) : msg.includes('Arrived') || msg.includes('Queued') ? (
                            <span className="text-zinc-300">{msg}</span>
                          ) : msg.includes(RequestState.PROCESSING) ? (
                            <span className="text-amber-400/90">{msg}</span>
                          ) : msg.includes('Cache Hit') ? (
                            <span className="text-blue-400 font-bold">{msg}</span>
                          ) : msg.includes('Cache Miss') ? (
                            <span className="text-red-400 font-bold">{msg}</span>
                          ) : msg.includes('Queue Overflow') || msg.includes('overflow') || msg.includes('dropped') ? (
                            <span className="text-red-500 font-extrabold flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span>{msg}</span>
                            </span>
                          ) : msg.includes(RequestState.COMPLETED) || msg.includes('Processed by') ? (
                            <span className="text-emerald-400 font-bold">{msg}</span>
                          ) : (
                            <span>{msg}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Total Traversal Time Footer */}
                {selectedRequest.status === RequestState.COMPLETED && (
                  <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-emerald-400 font-bold flex justify-between items-center text-sm">
                    <span>Total Traversal Time</span>
                    <span className="bg-emerald-500/20 px-2 py-1 rounded">{selectedRequest.latency}ms</span>
                  </div>
                )}
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
