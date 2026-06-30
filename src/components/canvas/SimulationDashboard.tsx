"use client";

import React from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useMetricsStore } from '@/store/metricsStore';
import { useScalingStore } from '@/store/scalingStore';
import { CheckCircle2, XCircle, Clock, ChevronRight, Activity, DollarSign, AlertTriangle, Zap } from 'lucide-react';

export function SimulationDashboard() {
  const { isRunning, isCompleted, requests, selectedRequestId, setSelectedRequestId } = useSimulationStore();
  const { metrics, recommendations } = useMetricsStore(state => state);
  const { activeProjectId, projects } = useCanvasStore();

  if (!isRunning) return null;

  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  
  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  const hitRate = metrics.cacheHitRatio;

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  return (
    <aside className="w-80 border-l p-4 shrink-0 bg-card overflow-y-auto flex flex-col h-full z-15 select-none animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500 animate-bounce" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Simulation Report</h2>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Simulation Panel</h2>
            </>
          )}
        </div>
        <button
          onClick={() => useMetricsStore.getState().toggleFullDashboard(true)}
          className="p-1 hover:bg-muted rounded text-zinc-500 hover:text-foreground cursor-pointer"
          title="Open advanced Observability Dashboard"
        >
          <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
        </button>
      </div>

      {/* Observability center banner button */}
      <button
        onClick={() => useMetricsStore.getState().toggleFullDashboard(true)}
        className="mb-4 w-full flex items-center justify-between px-3 py-2 border border-blue-500/35 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors animate-pulse"
      >
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>Open Observability Center</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Metrics Counters */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-muted/40 border rounded-xl flex flex-col gap-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase">Requests Run</span>
            <span className="text-lg font-extrabold">{requests.length} / 100</span>
          </div>
          <div className="p-3 bg-muted/40 border rounded-xl flex flex-col gap-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase">Cache Hit Rate</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{hitRate}%</span>
          </div>
        </div>

        <div className="p-3 bg-muted/40 border rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              Completed
            </span>
            <span className="font-bold text-green-600 dark:text-green-400">{metrics.completedRequests}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-t pt-2">
            <span className="font-semibold text-zinc-500 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              Failed
            </span>
            <span className="font-bold text-destructive">{metrics.failedRequests}</span>
          </div>
        </div>

        <div className="p-3 bg-muted/40 border rounded-xl space-y-2">
          <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Latency Stats</span>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-500">Average Latency</span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {metrics.averageLatency}ms
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-t pt-2">
            <span className="font-semibold text-zinc-500">Min / Max Latency</span>
            <span className="font-bold text-foreground">
              {metrics.minLatency}ms / {metrics.maxLatency}ms
            </span>
          </div>
        </div>
        
        {isCompleted && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-blue-600/80 dark:text-blue-400/80 uppercase">Est. Monthly Cost</span>
               <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Architecture Total</span>
            </div>
            <div className="flex items-center text-lg font-black text-blue-700 dark:text-blue-300">
               <DollarSign className="w-5 h-5 mr-0.5" />
               {useScalingStore.getState().estimatedMonthlyCost.toFixed(2)}
            </div>
          </div>
        )}

        {/* Performance Recommendations */}
        {isCompleted && recommendations.length > 0 && (
          <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Insights & Recommendations
            </h3>
            <div className="flex flex-col gap-2">
              {recommendations.map((rec, i) => (
                <div key={i} className={`p-3 rounded-xl border text-xs ${
                  rec.severity === 'high' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                  rec.severity === 'medium' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400' :
                  'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {rec.severity === 'high' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                    <span>{rec.nodeName} ({rec.nodeId})</span>
                  </div>
                  <p className="font-medium opacity-90 mb-2">{rec.issue}</p>
                  <p className="opacity-80 leading-relaxed bg-background/50 p-1.5 rounded">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Requests History List */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-xl overflow-hidden bg-muted/10">
        <div className="px-3 py-2 border-b bg-muted/40 text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase">
          Request Execution History
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/50 font-mono text-xs">
          {requests.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground/60 text-center p-4">
              Waiting for requests to run...
            </div>
          ) : (
            requests.map((req) => (
              <button
                key={req.id}
                onClick={() => setSelectedRequestId(req.id)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors hover:bg-muted/50 cursor-pointer ${
                  selectedRequestId === req.id ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 pl-2.5' : ''
                }`}
              >
                <span className="font-semibold">{req.id}</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>{req.latency}ms</span>
                  {req.status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  {req.status === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  {req.status === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Selected Request Detail Panel */}
      {selectedRequest && (
        <div className="mt-4 p-3 bg-muted/40 border rounded-xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150 shrink-0">
          <div className="flex items-center justify-between border-b pb-1.5">
            <span className="font-bold text-xs">{selectedRequest.id} Path</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
              selectedRequest.status === 'completed' 
                ? 'bg-green-155 text-green-800 dark:bg-green-950/40 dark:text-green-400'
                : selectedRequest.status === 'failed'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
            }`}>
              {selectedRequest.status}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] font-black text-muted-foreground uppercase block">Request Traversal Route</span>
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-foreground leading-relaxed">
              {selectedRequest.path.map((nodeId, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                  <span className="px-1.5 py-0.5 bg-background border rounded text-xs truncate max-w-[90px]" title={getNodeLabel(nodeId)}>
                    {getNodeLabel(nodeId)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="space-y-1 border-t pt-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1">Timeline Logs</span>
            <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[10px] leading-relaxed text-muted-foreground">
              {selectedRequest.log.map((logLine, idx) => (
                <div key={idx} className="flex gap-1.5 align-top">
                  <span className="text-zinc-500 font-bold shrink-0">[{idx + 1}]</span>
                  <span>{logLine}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
