import { SimEvent } from '../types/Event';
import { NodeRegistry } from './NodeRegistry';
import { Router } from './Router';
import { EventQueue } from './EventQueue';

export class EventDispatcher {
  private registry: NodeRegistry;
  private router: Router;
  private queue: EventQueue;

  constructor(registry: NodeRegistry, router: Router, queue: EventQueue) {
    this.registry = registry;
    this.router = router;
    this.queue = queue;
  }

  public dispatch(event: SimEvent, getRequest: (id: string) => any): void {
    const request = getRequest(event.requestId);
    if (!request) return;

    if (event.nodeId) {
      const node = this.registry.get(event.nodeId);
      if (node) {
        node.receive(event, request);
      }
    }
  }
}
