import { BaseNode } from './BaseNode';
import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { RequestState } from '../request/RequestState';
import { NetworkLink } from '../network/NetworkLink';
import { SimulationEngine } from '../engine/SimulationEngine';
import { MetricsAggregator } from '@/metrics/aggregator/MetricsAggregator';

export class RedisNode extends BaseNode {
  private outgoingLinks: NetworkLink[] = [];
  private processingTime: number = 20;

  constructor(nodeId: string, engine: SimulationEngine) {
    super(nodeId, engine);
  }

  public addOutgoingLink(link: NetworkLink) {
    this.outgoingLinks.push(link);
  }

  public receive(event: SimEvent, request: SimRequest): void {
    if (event.type === 'NODE_ARRIVE' || event.type === 'NODE_RECEIVED') {
      this.log(request, `Arrived at Redis Cache.`);
      this.process(request);
    } else if (event.type === 'NODE_COMPLETE' && event.data?.callback) {
      event.data.callback();
    }
  }

  protected process(request: SimRequest): void {
    // Schedule completion
    const completeTime = this.engine.getVirtualTime() + this.processingTime;
    this.engine.scheduleEvent({
      id: `evt-redis-complete-${request.id}-${this.nodeId}-${completeTime}`,
      time: completeTime,
      type: 'NODE_COMPLETE',
      requestId: request.id,
      nodeId: this.nodeId,
      data: { callback: () => this.complete(request) }
    });
  }

  protected complete(request: SimRequest): void {
    const isHit = this.engine.getCacheDecision(request.id);
    this.log(request, `Processed by Redis (+${this.processingTime}ms).`);
    
    if (isHit) {
      this.log(request, `Cache Hit! Redis returning values immediately.`);
      MetricsAggregator.addEvent({
        type: 'CacheHit',
        nodeId: this.nodeId,
        nodeName: 'Redis Cache',
        nodeType: 'redis',
        timestamp: this.engine.getVirtualTime()
      });
      this.completeNodeRequest(request, RequestState.COMPLETED, `Completed from Cache.`);
    } else {
      this.log(request, `Cache Miss! Redis fetching from Database.`);
      MetricsAggregator.addEvent({
        type: 'CacheMiss',
        nodeId: this.nodeId,
        nodeName: 'Redis Cache',
        nodeType: 'redis',
        timestamp: this.engine.getVirtualTime()
      });
      this.forward(request);
    }
  }

  protected forward(request: SimRequest): void {
    if (this.outgoingLinks.length === 0) {
      this.completeNodeRequest(request, RequestState.FAILED, `Cache Miss but no downstream database configured.`);
      return;
    }
    
    // Forward to DB
    this.outgoingLinks[0].transmit(request);
  }
}
