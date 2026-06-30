import { useMetricsStore } from '@/store/metricsStore';

export function useMetrics() {
  const metrics = useMetricsStore((state) => state.metrics);
  const history = useMetricsStore((state) => state.history);
  const nodeMetrics = useMetricsStore((state) => state.nodeMetrics);
  const alerts = useMetricsStore((state) => state.alerts);
  const isFullDashboardOpen = useMetricsStore((state) => state.isFullDashboardOpen);
  const toggleFullDashboard = useMetricsStore((state) => state.toggleFullDashboard);
  const resetMetrics = useMetricsStore((state) => state.resetMetrics);
  const saveRun = useMetricsStore((state) => state.saveRun);
  const pastRuns = useMetricsStore((state) => state.pastRuns);

  return {
    metrics,
    history,
    nodeMetrics,
    alerts,
    isFullDashboardOpen,
    toggleFullDashboard,
    resetMetrics,
    saveRun,
    pastRuns,
  };
}
