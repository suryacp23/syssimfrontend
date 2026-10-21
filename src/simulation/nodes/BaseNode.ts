import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { RequestState } from '../request/RequestState';
import { SimulationEngine } from '../engine/SimulationEngine';
import { MetricsAggregator } from '@/metrics/aggregator/MetricsAggregator';


export abstract class BaseNode {
  protected nodeId: string;
  protected engine: SimulationEngine;
  
  // Track requests currently sitting at this node (queued or processing)
  protected queue: SimRequest[] = [];

  constructor(nodeId: string, engine: SimulationEngine) {
    this.nodeId = nodeId;
    this.engine = engine;
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  public setReplicas(replicas: number): void {
    // Override in specific nodes if they need to scale pools
  }

  public getMetrics(): { cpuUtilization: number, queued: number } {
    return { cpuUtilization: 0, queued: this.queue.length };
  }

  protected log(request: SimRequest, message: string) {
    this.engine.log(request, this.nodeId, message);
  }

  protected completeNodeRequest(request: SimRequest, status: RequestState, message: string) {
    this.engine.completeRequest(request, status, message, this.nodeId);
  }

  protected recordNodeMetrics(latency: number) {
    MetricsAggregator.addEvent({
      type: 'NodeVisited',
      nodeId: this.nodeId,
      nodeName: this.engine.getNodeName(this.nodeId),
      nodeType: this.engine.getNodeType(this.nodeId),
      latency,
      timestamp: this.engine.getVirtualTime()
    });
  }

  /**
   * Called by the engine or network link when a packet/event arrives at this node.
   */
  public abstract receive(event: SimEvent, request: SimRequest): void;

  /**
   * Internal mechanism to start processing a request
   */
  protected abstract process(request: SimRequest): void;

  /**
   * Internal mechanism to complete processing
   */
  protected abstract complete(request: SimRequest): void;

  /**
   * Forward a request to the next node/link.
   */
  protected abstract forward(request: SimRequest): void;
}
