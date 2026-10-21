import { SimRequest } from '../request/SimRequest';
import { BaseNode } from '../nodes/BaseNode';
import { NetworkLink } from '../network/NetworkLink';

export class Router {
  public forward(request: SimRequest, currentNode: BaseNode, outgoingLinks: NetworkLink[]): NetworkLink | null {
    if (outgoingLinks.length === 0) return null;
    
    // For now, simple static routing (always pick first edge)
    // Future: Read LB strategy if node is LB, etc.
    return outgoingLinks[0];
  }
}
