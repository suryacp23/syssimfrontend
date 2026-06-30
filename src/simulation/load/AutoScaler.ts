import { useScalingStore } from '@/store/scalingStore';
import { resourceManagerInstance } from './ResourceManager';
import { AdjacencyList } from '../engine/GraphBuilder';
import { MetricsAggregator } from '@/metrics/aggregator/MetricsAggregator';

export class AutoScaler {
  private lastScaleTime: Record<string, number> = {};

  public reset() {
    this.lastScaleTime = {};
  }

  public evaluate(virtualTime: number, graph: AdjacencyList) {
    const store = useScalingStore.getState();
    const policies = store.scalingPolicies;
    const replicas = store.nodeReplicas;

    Object.entries(policies).forEach(([nodeId, policy]) => {
      if (!policy.enabled) return;

      const node = graph[nodeId]?.node;
      if (!node) return;

      const currentReplicas = replicas[nodeId] || 1;
      const instanceSize = (node?.data?.instanceSize as any) || 'small';
      const capacity = resourceManagerInstance.getCapacity(node.data.type as string, currentReplicas, instanceSize);
      const stats = resourceManagerInstance.getStats(nodeId, capacity);

      let metricValue = 0;
      if (policy.metric === 'cpu') {
        metricValue = stats.cpuUtilization;
      } else if (policy.metric === 'queue') {
        metricValue = stats.queued;
      }
      // Latency is harder since we need a windowed average per node, we can stick to CPU/Queue for now

      const lastScale = this.lastScaleTime[nodeId] || 0;

      // Scale Out
      if (metricValue > policy.threshold && currentReplicas < policy.maxReplicas) {
        if (virtualTime - lastScale > policy.scaleOutCooldownMs) {
          store.setNodeReplicas(nodeId, currentReplicas + 1);
          this.lastScaleTime[nodeId] = virtualTime;
          
          MetricsAggregator.addEvent({
            type: 'ScaleOut',
            nodeId,
            nodeName: node.data?.label || nodeId,
            timestamp: virtualTime,
          });
        }
      }
      // Scale In
      else if (metricValue < (policy.threshold / 2) && currentReplicas > policy.minReplicas) {
        if (virtualTime - lastScale > policy.scaleInCooldownMs) {
          store.setNodeReplicas(nodeId, currentReplicas - 1);
          this.lastScaleTime[nodeId] = virtualTime;
          
          MetricsAggregator.addEvent({
            type: 'ScaleIn',
            nodeId,
            nodeName: node.data?.label || nodeId,
            timestamp: virtualTime,
          });
        }
      }
    });
  }
}

export const autoScalerInstance = new AutoScaler();
