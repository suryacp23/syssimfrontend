import { BaseNode } from './BaseNode';
import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { RequestState } from '../request/RequestState';
import { NetworkLink } from '../network/NetworkLink';
import { SimulationEngine } from '../engine/SimulationEngine';
import { MetricsAggregator } from '@/metrics/aggregator/MetricsAggregator';

export class CDNNode extends BaseNode {
  private outgoingLinks: NetworkLink[] = [];
  private processingTime: number = 10; // Extremely fast edge cache

  constructor(nodeId: string, engine: SimulationEngine) {
    super(nodeId, engine);
  }

  public addOutgoingLink(link: NetworkLink) {
    this.outgoingLinks.push(link);
  }

  public receive(event: SimEvent, request: SimRequest): void {
    if (event.type === 'NODE_ARRIVE' || event.type === 'NODE_RECEIVED') {
      this.log(request, `Arrived at CDN Edge.`);
      this.process(request);
    } else if (event.type === 'NODE_COMPLETE' && event.data?.callback) {
      event.data.callback();
    }
  }

  protected process(request: SimRequest): void {
    const completeTime = this.engine.getVirtualTime() + this.processingTime;
    this.engine.scheduleEvent({
      id: `evt-cdn-complete-${request.id}-${this.nodeId}-${completeTime}`,
      time: completeTime,
      type: 'NODE_COMPLETE',
      requestId: request.id,
      nodeId: this.nodeId,
      data: { callback: () => this.complete(request) }
    });
  }

  protected complete(request: SimRequest): void {
    const isHit = this.engine.getCacheDecision(request.id);
    
    this.recordNodeMetrics(this.processingTime);

    if (isHit) {
      this.log(request, `CDN Cache Hit! Serving asset from edge (+${this.processingTime}ms).`);
      MetricsAggregator.addEvent({
        type: 'CacheHit',
        nodeId: this.nodeId,
        nodeName: this.engine.getNodeName(this.nodeId),
        nodeType: 'cdn',
        timestamp: this.engine.getVirtualTime()
      });
      this.completeNodeRequest(request, RequestState.COMPLETED, `Served from CDN.`);
    } else {
      this.log(request, `CDN Cache Miss! Forwarding to origin (+${this.processingTime}ms).`);
      MetricsAggregator.addEvent({
        type: 'CacheMiss',
        nodeId: this.nodeId,
        nodeName: this.engine.getNodeName(this.nodeId),
        nodeType: 'cdn',
        timestamp: this.engine.getVirtualTime()
      });
      this.forward(request);
    }
  }

  protected forward(request: SimRequest): void {
    if (this.outgoingLinks.length === 0) {
      this.completeNodeRequest(request, RequestState.FAILED, `CDN Miss but no origin configured.`);
      return;
    }
    
    this.outgoingLinks[0].transmit(request);
  }
}
