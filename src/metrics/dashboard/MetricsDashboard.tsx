"use client";

import React, { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { useSimulationStore } from '@/store/simulationStore';
import { useCanvasStore } from '@/store/canvasStore';
import { LatencyChart } from '../charts/LatencyChart';
import { ThroughputChart } from '../charts/ThroughputChart';
import { CacheChart } from '../charts/CacheChart';
import { RequestsChart } from '../charts/RequestsChart';
import { MetricsCard } from './MetricsCard';
import { NodeStats } from './NodeStats';
import { RequestHistory } from './RequestHistory';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/useProjects';
import { 
  X, Download, Activity, AlertTriangle, TrendingUp, BarChart3, Database, Timer, 
  CheckSquare, History, Play, Pause, RotateCcw, Columns, RefreshCw, Clock, ShieldAlert
} from 'lucide-react';
import { simulatorInstance } from '@/simulation/engine/SimulationEngine';

export function MetricsDashboard() {
  const { 
    metrics, 
    history, 
    nodeMetrics, 
    alerts, 
    isFullDashboardOpen, 
    toggleFullDashboard, 
    pastRuns, 
    saveRun 
  } = useMetrics();
  
  const { 
    isRunning, 
    isPaused, 
    isCompleted, 
    speed, 
    requests,
    setSpeed, 
    startSimulation, 
    pauseSimulation, 
    resumeSimulation, 
    resetSimulation 
  } = useSimulationStore();
  
  const { id } = useParams();
  const projectId = id as string;
  const { data: project } = useProject(projectId);
  const projectName = project?.title || 'System Simulator';
  
  const { activeProjectId, projects } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<'charts' | 'nodes' | 'traces' | 'compare'>('charts');

  if (!isFullDashboardOpen) return null;

  const handleRun = () => {
    const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
    const edges = activeProjectId ? projects[activeProjectId]?.edges || [] : [];
    const ok = startSimulation(nodes, edges);
    if (ok) {
      simulatorInstance.init(nodes, edges);
    }
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      resumeSimulation();
    } else {
      pauseSimulation();
    }
  };

  const handleReset = () => {
    resetSimulation();
  };

  const handleSaveRun = () => {
    saveRun(projectName);
  };

  // Export JSON Report
  const exportJSON = () => {
    const reportData = {
      projectName,
      timestamp: new Date().toISOString(),
      summaryMetrics: metrics,
      nodeMetrics,
      timelinePoints: history,
      alerts
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simulation-report-${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV Report (Timeline)
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Time (Seconds),Avg Latency (ms),P95 Latency (ms),P99 Latency (ms),Throughput (rps),Active Requests,Cache Hit Ratio (%)\n";
    
    history.forEach(pt => {
      csvContent += `${pt.time},${pt.avgLatency},${pt.p95Latency},${pt.p99Latency},${pt.throughput},${pt.activeRequests},${pt.cacheHitRatio}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `simulation-timeline-${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200 select-none">
      {/* Top Banner Header */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
          <div>
            <h1 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span>Observability Control Center</span>
              <span className="text-[10px] bg-zinc-150 dark:bg-zinc-800 text-zinc-650 px-2 py-0.5 rounded-full font-bold select-all normal-case font-mono">
                {projectName}
              </span>
            </h1>
            <p className="text-[10px] text-muted-foreground">Grafana & Prometheus Live Simulation Metrics Dashboard</p>
          </div>
        </div>

        {/* Dashboard Simulation Controls */}
        <div className="flex items-center gap-3 bg-muted/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 px-2.5">
          <span className="text-[10px] font-black uppercase text-muted-foreground mr-1.5 select-none">Simulator</span>
          {isCompleted ? (
            <div className="flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400">
              <span>Simulation Finished ✓</span>
              <button onClick={handleReset} className="p-1.5 hover:bg-muted rounded cursor-pointer" title="Reset">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : !isRunning ? (
            <button
              onClick={handleRun}
              className="flex items-center gap-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePauseToggle}
                className="flex items-center gap-1 text-[11px] font-bold hover:bg-muted px-2.5 py-1 rounded-lg border cursor-pointer"
              >
                {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-2.5 py-1 rounded-lg border border-rose-500/20 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          )}

          {isRunning && !isCompleted && (
            <>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
              <div className="flex items-center gap-1 select-none">
                {[1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      speed === s ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:bg-muted'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {isCompleted && (
            <button
              onClick={handleSaveRun}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-250 dark:border-zinc-850 bg-background text-[11px] font-bold rounded-xl cursor-pointer hover:bg-muted transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>Capture Snapshot</span>
            </button>
          )}
          
          <div className="flex items-center border border-zinc-250 dark:border-zinc-850 rounded-xl overflow-hidden text-[11px] font-bold bg-background">
            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted border-r transition-colors cursor-pointer"
              title="Download detailed simulation metrics in JSON format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted transition-colors cursor-pointer"
              title="Download time series timeline data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <button
            onClick={() => toggleFullDashboard(false)}
            className="p-2 hover:bg-muted rounded-xl transition-colors cursor-pointer border shadow-sm bg-background text-zinc-600 dark:text-zinc-400 hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col min-h-0 bg-background/50">
        
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-4 shrink-0">
          <MetricsCard
            title="Total / Active Requests"
            value={`${metrics.totalRequests} / ${metrics.activeRequests}`}
            unit="reqs"
            description="Overall load footprint"
            icon={<BarChart3 className="w-4 h-4" />}
            glowColor="blue"
          />
          <MetricsCard
            title="Success Rate"
            value={`${metrics.successRate}`}
            unit="%"
            description={`${metrics.completedRequests} Completed, ${metrics.failedRequests} Failed`}
            icon={<CheckSquare className="w-4 h-4" />}
            glowColor={metrics.successRate >= 99 ? 'green' : metrics.successRate >= 95 ? 'amber' : 'red'}
          />
          <MetricsCard
            title="Average Latency"
            value={metrics.averageLatency}
            unit="ms"
            description={`Min: ${metrics.minLatency}ms | Max: ${metrics.maxLatency}ms`}
            icon={<Timer className="w-4 h-4" />}
            glowColor={metrics.averageLatency < 35 ? 'green' : metrics.averageLatency < 65 ? 'amber' : 'red'}
          />
          <MetricsCard
            title="P95 / P99 Latency"
            value={`${metrics.p95Latency} / ${metrics.p99Latency}`}
            unit="ms"
            description="Exposes tail end slow delays"
            icon={<TrendingUp className="w-4 h-4" />}
            glowColor={metrics.p95Latency < 55 ? 'green' : 'amber'}
          />
          <MetricsCard
            title="Throughput"
            value={metrics.currentThroughput}
            unit="rps"
            description={`Avg: ${metrics.averageThroughput} | Peak: ${metrics.peakThroughput}`}
            icon={<Activity className="w-4 h-4" />}
            glowColor="green"
          />
          <MetricsCard
            title="Cache Hit Rate"
            value={`${metrics.cacheHitRatio}`}
            unit="%"
            description={`${metrics.cacheHits} Hits, ${metrics.cacheMisses} Misses`}
            icon={<Database className="w-4 h-4" />}
            glowColor={metrics.cacheHitRatio >= 75 ? 'green' : metrics.cacheHitRatio >= 40 ? 'amber' : 'red'}
          />
          <MetricsCard
            title="Request Retries"
            value={metrics.retryCount}
            unit="count"
            description="Requests retried due to failures"
            icon={<RefreshCw className="w-4 h-4" />}
            glowColor={metrics.retryCount === 0 ? 'green' : 'amber'}
          />
          <MetricsCard
            title="Timeouts"
            value={metrics.timeoutCount}
            unit="count"
            description="Exceeded maximum wait time"
            icon={<Clock className="w-4 h-4" />}
            glowColor={metrics.timeoutCount === 0 ? 'green' : 'red'}
          />
          <MetricsCard
            title="Circuit Breakers"
            value={metrics.circuitBreakerTrips}
            unit="trips"
            description="Fast fail mechanism activations"
            icon={<ShieldAlert className="w-4 h-4" />}
            glowColor={metrics.circuitBreakerTrips === 0 ? 'green' : 'red'}
          />
        </div>

        {/* Alarm warnings alerts drawer */}
        {alerts.length > 0 && (
          <div className="bg-destructive/10 dark:bg-destructive/10 border border-destructive/20 rounded-2xl p-4 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 border-b border-destructive/15 pb-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-destructive">Active Observability Threshold Warnings ({alerts.length})</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-36 overflow-y-auto font-mono text-[11px] text-destructive/90">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex gap-2 items-start py-1 px-3 bg-destructive/5 rounded-xl border border-destructive/10">
                  <span className="font-extrabold select-none">[{alert.timestamp}s]</span>
                  <span className="font-semibold leading-relaxed select-all">{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Main View Selector Tabs */}
        <div className="flex border-b shrink-0 gap-1.5 select-none">
          <button
            onClick={() => setActiveTab('charts')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 hover:text-foreground cursor-pointer -mb-[2px] ${
              activeTab === 'charts'
                ? 'border-blue-500 text-foreground font-extrabold'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            System Timelines & Graphs
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 hover:text-foreground cursor-pointer -mb-[2px] ${
              activeTab === 'nodes'
                ? 'border-blue-500 text-foreground font-extrabold'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            Node Statistics Map
          </button>
          <button
            onClick={() => setActiveTab('traces')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 hover:text-foreground cursor-pointer -mb-[2px] ${
              activeTab === 'traces'
                ? 'border-blue-500 text-foreground font-extrabold'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            Distributed Request Traces
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 hover:text-foreground cursor-pointer -mb-[2px] ${
              activeTab === 'compare'
                ? 'border-blue-500 text-foreground font-extrabold'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            Snapshot Comparison ({pastRuns.length})
          </button>
        </div>

        {/* Inner Content Area */}
        <div className="flex-1 min-h-0">
          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-y-auto pr-1">
              <div className="lg:col-span-8 h-80">
                <LatencyChart data={history} />
              </div>
              <div className="lg:col-span-4 h-80">
                <CacheChart hits={metrics.cacheHits} misses={metrics.cacheMisses} />
              </div>
              <div className="lg:col-span-8 h-80">
                <ThroughputChart data={history} />
              </div>
              <div className="lg:col-span-4 h-80">
                <RequestsChart completed={metrics.completedRequests} failed={metrics.failedRequests} active={metrics.activeRequests} />
              </div>
            </div>
          )}

          {activeTab === 'nodes' && (
            <div className="h-full overflow-hidden">
              <NodeStats nodeStats={nodeMetrics} />
            </div>
          )}

          {activeTab === 'traces' && (
            <div className="h-full overflow-hidden">
              <RequestHistory />
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 bg-muted/5 h-full overflow-y-auto space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Simulation Compare Panel</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Compare architectural performance configurations across multiple simulation runs.</p>
              </div>

              {pastRuns.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground/60 border border-dashed rounded-xl flex flex-col items-center gap-2 bg-muted/5 select-none">
                  <Columns className="w-8 h-8 text-muted-foreground/45" />
                  <span>No Captured Snapshots Recorded</span>
                  <p className="max-w-xs text-[10px]">Complete a simulation and click the "Capture Snapshot" button at the top header to save its metrics for side-by-side verification comparison.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl bg-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/20 font-bold text-muted-foreground text-[10px] uppercase">
                        <th className="px-4 py-3">Run ID / Snapshot Name</th>
                        <th className="px-4 py-3 text-right">Success Rate</th>
                        <th className="px-4 py-3 text-right">Avg Latency</th>
                        <th className="px-4 py-3 text-right">P95 Latency</th>
                        <th className="px-4 py-3 text-right">P99 Latency</th>
                        <th className="px-4 py-3 text-right">Peak Throughput</th>
                        <th className="px-4 py-3 text-right">Cache Hit Ratio</th>
                        <th className="px-4 py-3 text-right">Total Requests</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono text-zinc-700 dark:text-zinc-300">
                      {/* Active Current Run Row */}
                      <tr className="bg-blue-50/20 dark:bg-blue-950/10 font-bold border-l-2 border-blue-500 pl-3">
                        <td className="px-4 py-3 font-sans text-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span>Current Execution Run (Active)</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{metrics.successRate}%</td>
                        <td className="px-4 py-3 text-right">{metrics.averageLatency}ms</td>
                        <td className="px-4 py-3 text-right text-blue-500">{metrics.p95Latency}ms</td>
                        <td className="px-4 py-3 text-right text-rose-500">{metrics.p99Latency}ms</td>
                        <td className="px-4 py-3 text-right">{metrics.peakThroughput} rps</td>
                        <td className="px-4 py-3 text-right text-blue-500">{metrics.cacheHitRatio}%</td>
                        <td className="px-4 py-3 text-right">{metrics.totalRequests}</td>
                      </tr>
                      {/* Past Captured Runs */}
                      {pastRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-sans text-foreground">
                            <div className="flex flex-col">
                              <span className="font-semibold">{run.projectName} Snapshot</span>
                              <span className="text-[9px] text-muted-foreground font-mono">{run.timestamp} ({run.id})</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{run.metrics.successRate}%</td>
                          <td className="px-4 py-3 text-right font-bold">{run.metrics.averageLatency}ms</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-500">{run.metrics.p95Latency}ms</td>
                          <td className="px-4 py-3 text-right font-bold text-rose-500">{run.metrics.p99Latency}ms</td>
                          <td className="px-4 py-3 text-right font-bold">{run.metrics.peakThroughput} rps</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-500">{run.metrics.cacheHitRatio}%</td>
                          <td className="px-4 py-3 text-right font-bold">{run.metrics.totalRequests}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
