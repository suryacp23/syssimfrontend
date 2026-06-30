export interface NodeStats {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  processedRequests: number;
  totalLatency: number;
  averageLatency: number;
  cacheHits: number;
  cacheMisses: number;
  activeRequests: number;
  dequeued: number;
  dropped: number;
}

export class NodeMetricsTracker {
  private nodeStatsMap: Record<string, NodeStats> = {};

  public initializeNode(nodeId: string, nodeName: string, nodeType: string) {
    if (!this.nodeStatsMap[nodeId]) {
      this.nodeStatsMap[nodeId] = {
        nodeId,
        nodeName,
        nodeType,
        processedRequests: 0,
        totalLatency: 0,
        averageLatency: 0,
        cacheHits: 0,
        cacheMisses: 0,
        activeRequests: 0,
        dequeued: 0,
        dropped: 0,
      };
    }
  }

  public registerVisit(nodeId: string, nodeName: string, nodeType: string, latency: number) {
    this.initializeNode(nodeId, nodeName, nodeType);
    const stats = this.nodeStatsMap[nodeId];
    stats.processedRequests += 1;
    stats.totalLatency += latency;
    stats.averageLatency = Math.round(stats.totalLatency / stats.processedRequests);
  }

  public registerDequeue(nodeId: string, nodeName: string) {
    this.initializeNode(nodeId, nodeName, 'queue');
    this.nodeStatsMap[nodeId].dequeued += 1;
  }

  public registerActiveCount(nodeId: string, nodeName: string, nodeType: string, activeCount: number) {
    this.initializeNode(nodeId, nodeName, nodeType);
    this.nodeStatsMap[nodeId].activeRequests = activeCount;
  }

  public registerCacheEvent(nodeId: string, nodeName: string, nodeType: string, isHit: boolean) {
    this.initializeNode(nodeId, nodeName, nodeType);
    const stats = this.nodeStatsMap[nodeId];
    if (isHit) {
      stats.cacheHits += 1;
    } else {
      stats.cacheMisses += 1;
    }
  }

  public registerDrop(nodeId: string, nodeName: string) {
    this.initializeNode(nodeId, nodeName, 'queue');
    const stats = this.nodeStatsMap[nodeId];
    stats.dropped += 1;
  }

  public getStatsMap(): Record<string, NodeStats> {
    return this.nodeStatsMap;
  }

  public reset() {
    this.nodeStatsMap = {};
  }
}
