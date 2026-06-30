import { create } from 'zustand';

export interface TimeSeriesDataPoint {
  time: number; // elapsed seconds of virtual time
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // completed req/sec in this second
  activeRequests: number;
  cacheHitRatio: number;
}

export interface NodeMetricsSummary {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  processedRequests: number;
  averageLatency: number;
  cacheHits: number;
  cacheMisses: number;
  activeRequests: number;
  dequeued: number;
  dropped: number;
}

export interface AggregateMetrics {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  failedRequests: number;
  successRate: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  medianLatency: number;
  p95Latency: number;
  p99Latency: number;
  currentThroughput: number;
  averageThroughput: number;
  peakThroughput: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRatio: number;
}

export interface SimulationRun {
  id: string;
  timestamp: string;
  projectName: string;
  metrics: AggregateMetrics;
  nodeMetrics: Record<string, NodeMetricsSummary>;
}

export interface MetricAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number; // virtual time
}

interface MetricsState {
  metrics: AggregateMetrics;
  history: TimeSeriesDataPoint[];
  nodeMetrics: Record<string, NodeMetricsSummary>;
  alerts: MetricAlert[];
  isFullDashboardOpen: boolean;
  pastRuns: SimulationRun[];

  setMetricsData: (
    metrics: AggregateMetrics,
    history: TimeSeriesDataPoint[],
    nodeMetrics: Record<string, NodeMetricsSummary>,
    alerts: MetricAlert[]
  ) => void;
  toggleFullDashboard: (open?: boolean) => void;
  addAlert: (alert: Omit<MetricAlert, 'id'>) => void;
  clearAlerts: () => void;
  saveRun: (projectName: string) => void;
  clearPastRuns: () => void;
  resetMetrics: () => void;
}

const initialMetrics: AggregateMetrics = {
  totalRequests: 0,
  activeRequests: 0,
  completedRequests: 0,
  failedRequests: 0,
  successRate: 0,
  averageLatency: 0,
  minLatency: 0,
  maxLatency: 0,
  medianLatency: 0,
  p95Latency: 0,
  p99Latency: 0,
  currentThroughput: 0,
  averageThroughput: 0,
  peakThroughput: 0,
  cacheHits: 0,
  cacheMisses: 0,
  cacheHitRatio: 0,
};

export const useMetricsStore = create<MetricsState>((set, get) => ({
  metrics: initialMetrics,
  history: [],
  nodeMetrics: {},
  alerts: [],
  isFullDashboardOpen: false,
  pastRuns: [],

  setMetricsData: (metrics, history, nodeMetrics, alerts) => {
    set({ metrics, history, nodeMetrics, alerts });
  },

  toggleFullDashboard: (open) => {
    set((state) => ({
      isFullDashboardOpen: open !== undefined ? open : !state.isFullDashboardOpen,
    }));
  },

  addAlert: (alert) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id }].slice(-10), // keep last 10 alerts
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  saveRun: (projectName) => {
    const { metrics, nodeMetrics } = get();
    const run: SimulationRun = {
      id: `run-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      projectName,
      metrics: { ...metrics },
      nodeMetrics: { ...nodeMetrics },
    };
    set((state) => ({
      pastRuns: [...state.pastRuns, run].slice(-5), // keep last 5 runs
    }));
  },

  clearPastRuns: () => {
    set({ pastRuns: [] });
  },

  resetMetrics: () => {
    set({
      metrics: initialMetrics,
      history: [],
      nodeMetrics: {},
      alerts: [],
    });
  },
}));
