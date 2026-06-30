import { LatencyCalculator } from './LatencyCalculator';
import { ThroughputCalculator } from './ThroughputCalculator';
import { CacheMetricsTracker } from './CacheMetrics';
import { NodeMetricsTracker } from './NodeMetrics';
import { useMetricsStore, AggregateMetrics, TimeSeriesDataPoint, MetricAlert } from '@/store/metricsStore';

export type MetricEvent =
  | { type: 'RequestStarted'; requestId: string; timestamp: number }
  | { type: 'RequestCompleted'; requestId: string; latency: number; timestamp: number }
  | { type: 'RequestFailed'; requestId: string; timestamp: number }
  | { type: 'NodeVisited'; nodeId: string; nodeName: string; nodeType: string; latency: number; timestamp: number }
  | { type: 'CacheHit'; nodeId: string; nodeName: string; nodeType: string; timestamp: number }
  | { type: 'CacheMiss'; nodeId: string; nodeName: string; nodeType: string; timestamp: number }
  | { type: 'QueueDropped'; nodeId: string; nodeName: string; timestamp: number };

class MetricsAggregatorClass {
  private latencyCalculator = new LatencyCalculator();
  private throughputCalculator = new ThroughputCalculator();
  private cacheTracker = new CacheMetricsTracker();
  private nodeTracker = new NodeMetricsTracker();

  // Global counters
  private totalRequests = 0;
  private activeRequests = 0;
  private completedRequests = 0;
  private failedRequests = 0;
  private allLatencies: number[] = [];

  // Alerts collection
  private alerts: MetricAlert[] = [];
  private triggeredAlertKeys = new Set<string>(); // avoid duplicate alerts

  // Time-series tracking
  // virtualSecond -> data accumulator
  private seriesAccumulator: Record<number, {
    completedCount: number;
    latencies: number[];
    cacheHits: number;
    cacheMisses: number;
    activeSum: number;
    activeSamplesCount: number;
  }> = {};

  private lastFlushRealTime = 0;
  private currentVirtualTime = 0;

  public init() {
    this.latencyCalculator = new LatencyCalculator();
    this.throughputCalculator = new ThroughputCalculator();
    this.cacheTracker = new CacheMetricsTracker();
    this.nodeTracker = new NodeMetricsTracker();

    this.totalRequests = 0;
    this.activeRequests = 0;
    this.completedRequests = 0;
    this.failedRequests = 0;
    this.allLatencies = [];
    this.alerts = [];
    this.triggeredAlertKeys.clear();
    this.seriesAccumulator = {};
    this.lastFlushRealTime = Date.now();
    this.currentVirtualTime = 0;

    useMetricsStore.getState().resetMetrics();
  }

  public addEvent(event: MetricEvent) {
    this.currentVirtualTime = Math.max(this.currentVirtualTime, event.timestamp);
    const second = Math.floor(event.timestamp / 1000);

    // Initialize second accumulator if not exists
    if (!this.seriesAccumulator[second]) {
      this.seriesAccumulator[second] = {
        completedCount: 0,
        latencies: [],
        cacheHits: 0,
        cacheMisses: 0,
        activeSum: 0,
        activeSamplesCount: 0,
      };
    }
    const acc = this.seriesAccumulator[second];

    switch (event.type) {
      case 'RequestStarted':
        this.totalRequests += 1;
        this.activeRequests += 1;
        break;

      case 'RequestCompleted':
        this.completedRequests += 1;
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.allLatencies.push(event.latency);
        this.throughputCalculator.registerCompletion(event.timestamp);

        acc.completedCount += 1;
        acc.latencies.push(event.latency);
        break;

      case 'RequestFailed':
        this.failedRequests += 1;
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        break;

      case 'NodeVisited':
        this.nodeTracker.registerVisit(event.nodeId, event.nodeName, event.nodeType, event.latency);
        
        // Alert check: High Database/API Latency
        if (event.nodeType === 'database' && event.latency > 70) {
          this.triggerAlert('warning', `High Database Latency detected at ${event.nodeName} (${event.latency}ms)`, `db-latency-${event.nodeId}-${second}`, second);
        }
        break;

      case 'CacheHit':
        this.cacheTracker.registerHit();
        this.nodeTracker.registerCacheEvent(event.nodeId, event.nodeName, event.nodeType, true);
        acc.cacheHits += 1;
        break;

      case 'CacheMiss':
        this.cacheTracker.registerMiss();
        this.nodeTracker.registerCacheEvent(event.nodeId, event.nodeName, event.nodeType, false);
        acc.cacheMisses += 1;
        break;

      case 'QueueDropped':
        this.nodeTracker.registerDrop(event.nodeId, event.nodeName);
        this.triggerAlert('error', `Queue capacity exceeded! Request dropped at ${event.nodeName}`, `queue-drop-${event.nodeId}-${second}`, second);
        break;
    }

    // Sample active requests for this second
    acc.activeSum += this.activeRequests;
    acc.activeSamplesCount += 1;

    // Throttle updating Zustand store to twice per second (500ms) of real time
    const now = Date.now();
    if (now - this.lastFlushRealTime >= 500) {
      this.flush();
      this.lastFlushRealTime = now;
    }
  }

  public updateTime(timestamp: number) {
    this.currentVirtualTime = Math.max(this.currentVirtualTime, timestamp);
    
    const now = Date.now();
    if (now - this.lastFlushRealTime >= 500) {
      this.flush();
      this.lastFlushRealTime = now;
    }
  }

  public registerNodeActiveCount(nodeId: string, nodeName: string, nodeType: string, activeCount: number) {
    this.nodeTracker.registerActiveCount(nodeId, nodeName, nodeType, activeCount);
  }

  private triggerAlert(type: 'warning' | 'error' | 'info', message: string, key: string, second: number) {
    if (!this.triggeredAlertKeys.has(key)) {
      this.triggeredAlertKeys.add(key);
      const alert: MetricAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: second,
      };
      this.alerts = [...this.alerts, alert].slice(-10);
      useMetricsStore.getState().addAlert(alert);
    }
  }

  public flush() {
    // 1. Calculate Aggregate Latency Metrics
    const latencyStats = LatencyCalculator.calculate(this.allLatencies);

    // 2. Calculate Throughput Metrics
    const elapsedSeconds = this.currentVirtualTime / 1000;
    const throughputStats = this.throughputCalculator.getThroughputMetrics(this.completedRequests, elapsedSeconds);

    // 3. Cache Metrics
    const cacheStats = this.cacheTracker.getMetrics();

    // 4. Alert check: cache hit ratio drops below 50%
    if (cacheStats.hits + cacheStats.misses >= 5 && cacheStats.hitRatio < 50) {
      const second = Math.floor(this.currentVirtualTime / 1000);
      this.triggerAlert('warning', `Cache Hit Ratio is low: ${cacheStats.hitRatio}% (Below 50%)`, 'cache-hit-low', second);
    }

    const successRate = this.completedRequests + this.failedRequests > 0
      ? Math.round((this.completedRequests / (this.completedRequests + this.failedRequests)) * 1000) / 10
      : 0;

    const aggregateMetrics: AggregateMetrics = {
      totalRequests: this.totalRequests,
      activeRequests: this.activeRequests,
      completedRequests: this.completedRequests,
      failedRequests: this.failedRequests,
      successRate,
      averageLatency: latencyStats.average,
      minLatency: latencyStats.minimum,
      maxLatency: latencyStats.maximum,
      medianLatency: latencyStats.median,
      p95Latency: latencyStats.p95,
      p99Latency: latencyStats.p99,
      currentThroughput: throughputStats.current,
      averageThroughput: throughputStats.average,
      peakThroughput: throughputStats.peak,
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
      cacheHitRatio: cacheStats.hitRatio,
    };

    // 5. Construct sliding window history of 60 seconds
    const currentSecond = Math.floor(elapsedSeconds);
    const startSecond = Math.max(0, currentSecond - 59);

    const historyPoints: TimeSeriesDataPoint[] = [];

    for (let s = startSecond; s <= currentSecond; s++) {
      const acc = this.seriesAccumulator[s];
      
      let avgLat = 0;
      let p95Lat = 0;
      let p99Lat = 0;
      let tput = 0;
      let actReq = 0;
      let chRatio = 0;

      if (acc) {
        const lStats = LatencyCalculator.calculate(acc.latencies);
        avgLat = lStats.average;
        p95Lat = lStats.p95;
        p99Lat = lStats.p99;
        tput = acc.completedCount;
        actReq = acc.activeSamplesCount > 0 ? Math.round(acc.activeSum / acc.activeSamplesCount) : 0;
        const totalCache = acc.cacheHits + acc.cacheMisses;
        chRatio = totalCache > 0 ? Math.round((acc.cacheHits / totalCache) * 100) : 0;
      } else {
        tput = 0;
        actReq = 0;
      }

      historyPoints.push({
        time: s,
        avgLatency: avgLat,
        p95Latency: p95Lat,
        p99Latency: p99Lat,
        throughput: tput,
        activeRequests: actReq,
        cacheHitRatio: chRatio,
      });
    }

    // 6. Update Node Metrics list with current active counts
    const nodeStatsMap = { ...this.nodeTracker.getStatsMap() };
    
    // Update state
    useMetricsStore.getState().setMetricsData(
      aggregateMetrics,
      historyPoints,
      nodeStatsMap as any,
      this.alerts
    );
  }
}

export const MetricsAggregator = new MetricsAggregatorClass();
