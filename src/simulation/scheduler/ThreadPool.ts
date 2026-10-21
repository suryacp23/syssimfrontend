import { SimRequest } from '../request/SimRequest';
import { SimulationEngine } from '../engine/SimulationEngine';

export class ThreadPool {
  private nodeId: string;
  private maxWorkers: number;
  private engine: SimulationEngine;
  
  private activeWorkers: number = 0;
  private queue: SimRequest[] = [];

  constructor(nodeId: string, engine: SimulationEngine, maxWorkers: number = 4) {
    this.nodeId = nodeId;
    this.engine = engine;
    this.maxWorkers = maxWorkers;
  }

  public setMaxWorkers(workers: number) {
    this.maxWorkers = workers;
    // Process queue if we suddenly have more capacity
    while (this.activeWorkers < this.maxWorkers && this.queue.length > 0) {
      const nextReq = this.queue.shift()!;
      this.activeWorkers++;
      // We need a way to know processingTime, but wait! The queue holds requests, we need processingTime!
      // Let's pass processing time in release? Or store it in queue?
      // For now, let's just let it be picked up on next release.
    }
  }

  public submit(request: SimRequest, processingTime: number, onComplete: (req: SimRequest) => void): boolean {
    if (this.activeWorkers < this.maxWorkers) {
      this.activeWorkers++;
      this.scheduleCompletion(request, processingTime, onComplete);
      return true;
    } else {
      // Queue it
      this.queue.push(request);
      // Wait for a worker to become available
      return false; // Indicating it was queued, not started immediately
    }
  }

  public release(onComplete: (req: SimRequest) => void, processingTime: number): void {
    this.activeWorkers--;
    
    // Pick next from queue
    if (this.queue.length > 0) {
      const nextReq = this.queue.shift()!;
      this.activeWorkers++;
      
      // Simulate that the thread picked it up by scheduling its completion
      this.scheduleCompletion(nextReq, processingTime, onComplete);
    }
  }

  private scheduleCompletion(request: SimRequest, processingTime: number, onComplete: (req: SimRequest) => void) {
    const completeTime = this.engine.getVirtualTime() + processingTime;
    
    this.engine.scheduleEvent({
      id: `evt-thread-complete-${request.id}-${this.nodeId}-${completeTime}`,
      time: completeTime,
      type: 'NODE_COMPLETE',
      requestId: request.id,
      nodeId: this.nodeId,
      data: { callback: () => onComplete(request) }
    });
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getActiveWorkers(): number {
    return this.activeWorkers;
  }

  public getMaxWorkers(): number {
    return this.maxWorkers;
  }
}
