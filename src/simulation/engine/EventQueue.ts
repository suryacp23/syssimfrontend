import { SimEvent } from '../types/Event';

export class EventQueue {
  private queue: SimEvent[] = [];

  public push(event: SimEvent): void {
    this.queue.push(event);
    // Min Heap simple array sort based on time
    this.queue.sort((a, b) => a.time - b.time);
  }

  public pop(): SimEvent | undefined {
    return this.queue.shift();
  }

  public peek(): SimEvent | undefined {
    return this.queue.length > 0 ? this.queue[0] : undefined;
  }

  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  public reset(): void {
    this.queue = [];
  }
}
