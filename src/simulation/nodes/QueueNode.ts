import { BaseNode } from './BaseNode';
import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { RequestState } from '../request/RequestState';
import { NetworkLink } from '../network/NetworkLink';
import { SimulationEngine } from '../engine/SimulationEngine';
import { MetricsAggregator } from '@/metrics/aggregator/MetricsAggregator';

export class QueueNode extends BaseNode {
  private outgoingLinks: NetworkLink[] = [];
  private processingTime: number = 50;
  private maxQueueSize: number;

  constructor(nodeId: string, engine: SimulationEngine, maxQueueSize: number = 100) {
    super(nodeId, engine);
    this.maxQueueSize = maxQueueSize;
  }

  public addOutgoingLink(link: NetworkLink) {
    this.outgoingLinks.push(link);
  }

  public receive(event: SimEvent, request: SimRequest): void {
    if (event.type === 'NODE_ARRIVE' || event.type === 'NODE_RECEIVED') {
      if (this.queue.length >= this.maxQueueSize) {
        this.log(request, `Queue is full! Request dropped.`);
        MetricsAggregator.addEvent({
          type: 'QueueDropped',
          nodeId: this.nodeId,
          nodeName: this.engine.getNodeName(this.nodeId),
          timestamp: this.engine.getVirtualTime()
        });
        this.completeNodeRequest(request, RequestState.FAILED, `Queue Overflow at node ${this.nodeId}`);
        return;
      }
      this.log(request, `Arrived at Queue.`);
      this.queue.push(request);
      this.process(request);
    } else if (event.type === 'NODE_COMPLETE' && event.data?.callback) {
      event.data.callback();
    }
  }

  protected process(request: SimRequest): void {
    // In a real message broker, it holds until consumers pull.
    // For this simple simulation, we will add a static processing delay and then forward.
    const completeTime = this.engine.getVirtualTime() + this.processingTime;
    this.engine.scheduleEvent({
      id: `evt-queue-complete-${request.id}-${this.nodeId}-${completeTime}`,
      time: completeTime,
      type: 'NODE_COMPLETE',
      requestId: request.id,
      nodeId: this.nodeId,
      data: { callback: () => this.complete(request) }
    });
  }

  protected complete(request: SimRequest): void {
    // Remove from internal queue array (just keeping track of length for overflow)
    const idx = this.queue.findIndex(r => r.id === request.id);
    if (idx !== -1) this.queue.splice(idx, 1);
    
    this.log(request, `Processed by Queue (+${this.processingTime}ms).`);
    this.recordNodeMetrics(this.processingTime);
    this.forward(request);
  }

  protected forward(request: SimRequest): void {
    if (this.outgoingLinks.length === 0) {
      this.completeNodeRequest(request, RequestState.COMPLETED, `Completed at Queue (No downstream consumers).`);
      return;
    }
    
    this.outgoingLinks[0].transmit(request);
  }
}
