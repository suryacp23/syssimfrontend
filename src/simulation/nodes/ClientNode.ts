import { BaseNode } from './BaseNode';
import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { RequestState } from '../request/RequestState';
import { NetworkLink } from '../network/NetworkLink';

export class ClientNode extends BaseNode {
  private outgoingLinks: NetworkLink[] = [];

  public addOutgoingLink(link: NetworkLink) {
    this.outgoingLinks.push(link);
  }

  public receive(event: SimEvent, request: SimRequest): void {
    if (event.type === 'REQUEST_START' || event.type === 'REQUEST_CREATED') {
      this.log(request, `Request initiated at Client.`);
      this.process(request);
    }
  }

  protected process(request: SimRequest): void {
    // Client node processes immediately
    this.log(request, `Processing at Client (client).`);
    this.complete(request);
  }

  protected complete(request: SimRequest): void {
    this.log(request, `Processed by Client (+10ms).`);
    this.recordNodeMetrics(10);
    this.forward(request);
  }

  protected forward(request: SimRequest): void {
    if (this.outgoingLinks.length === 0) {
      this.completeNodeRequest(request, RequestState.COMPLETED, `Completed at Client (no outgoing links)`);
      return;
    }
    
    // For client, just forward to the first connected component (usually LB, API, or CDN)
    this.outgoingLinks[0].transmit(request);
  }
}
