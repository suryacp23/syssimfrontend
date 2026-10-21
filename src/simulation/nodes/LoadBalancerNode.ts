import { BaseNode } from './BaseNode';
import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { RequestState } from '../request/RequestState';
import { NetworkLink } from '../network/NetworkLink';
import { SimulationEngine } from '../engine/SimulationEngine';

export class LoadBalancerNode extends BaseNode {
  private outgoingLinks: NetworkLink[] = [];
  private rrIndex: number = 0;

  constructor(nodeId: string, engine: SimulationEngine) {
    super(nodeId, engine);
  }

  public addOutgoingLink(link: NetworkLink) {
    this.outgoingLinks.push(link);
  }

  public receive(event: SimEvent, request: SimRequest): void {
    if (event.type === 'NODE_ARRIVE' || event.type === 'NODE_RECEIVED') {
      this.log(request, `Arrived at Load Balancer.`);
      this.process(request);
    }
  }

  protected process(request: SimRequest): void {
    // LB processes instantly (or minimal latency)
    this.log(request, `Routing via Load Balancer (round-robin).`);
    this.complete(request);
  }

  protected complete(request: SimRequest): void {
    this.recordNodeMetrics(5); // assuming 5ms internal LB latency
    this.forward(request);
  }

  protected forward(request: SimRequest): void {
    if (this.outgoingLinks.length === 0) {
      this.completeNodeRequest(request, RequestState.FAILED, `Load Balancer has no downstream servers configured.`);
      return;
    }

    // Round robin logic
    const link = this.outgoingLinks[this.rrIndex];
    this.rrIndex = (this.rrIndex + 1) % this.outgoingLinks.length;
    
    link.transmit(request);
  }
}
