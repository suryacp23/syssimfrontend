import { useFailureStore, NodeHealthStatus } from '@/store/failureStore';
import { circuitBreakerInstance } from './CircuitBreaker';
import { retryPolicyInstance } from './RetryPolicy';
import { SystemNode } from '@/store/canvasStore';
import { AdjacencyList } from '../engine/GraphBuilder';

export class FailureEngine {
  private crashedNodes: Set<string> = new Set();
  
  public reset() {
    this.crashedNodes.clear();
    circuitBreakerInstance.reset();
    retryPolicyInstance.reset();
  }

  // Called periodically or on config change to assign crashes to specific nodes
  public updateNodeHealth(graph: AdjacencyList) {
    const config = useFailureStore.getState().config;
    const setNodeHealth = useFailureStore.getState().setNodeHealth;
    
    // Find one API to crash if enabled
    const apiNodes = Object.values(graph).filter(n => n.node.data?.type === 'api');
    
    // We deterministically pick the first API to crash if serverCrash is true, else clear it.
    if (config.serverCrash && apiNodes.length > 0) {
      this.crashedNodes.add(apiNodes[0].node.id);
    } else {
      apiNodes.forEach(n => this.crashedNodes.delete(n.node.id));
    }

    Object.values(graph).forEach(({ node }) => {
      let status: NodeHealthStatus = 'healthy';
      const type = node.data?.type;

      if (this.crashedNodes.has(node.id)) {
        status = 'unavailable';
      } else if (type === 'database' && config.databaseDown) {
        status = 'unavailable';
      } else if (type === 'redis' && config.redisDown) {
        status = 'unavailable';
      } else if (type === 'queue' && config.queueFailure) {
        status = 'unavailable';
      } else if (type === 'kafka' && config.kafkaFailure) {
        status = 'unavailable';
      } else if (config.cpuOverload) {
        status = 'degraded';
      } else if (config.networkDelay > 0) {
        status = 'slow';
      }

      // Check Circuit Breaker
      if (config.circuitBreakerEnabled && circuitBreakerInstance.isOpen(node.id, 0)) {
        status = 'unavailable';
      }

      setNodeHealth(node.id, status);
    });
  }

  public getNodeStatus(nodeId: string, virtualTime: number): NodeHealthStatus {
    const config = useFailureStore.getState().config;
    if (config.circuitBreakerEnabled && circuitBreakerInstance.isOpen(nodeId, virtualTime)) {
       return 'unavailable';
    }
    return useFailureStore.getState().healthStatus[nodeId] || 'healthy';
  }

  public getAddedLatency(): number {
    const config = useFailureStore.getState().config;
    let extra = 0;
    if (config.networkDelay > 0) extra += config.networkDelay;
    if (config.cpuOverload) extra += 150; // CPU overload adds 150ms
    return extra;
  }

  public checkPacketLoss(): boolean {
    const config = useFailureStore.getState().config;
    if (config.packetLoss > 0) {
      const dropProb = config.packetLoss / 100;
      return Math.random() < dropProb;
    }
    return false;
  }
}

export const failureEngineInstance = new FailureEngine();
