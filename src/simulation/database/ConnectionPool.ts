import { SimRequest } from '../request/SimRequest';
import { SimulationEngine } from '../engine/SimulationEngine';

export class ConnectionPool {
  private nodeId: string;
  private maxConnections: number;
  private engine: SimulationEngine;
  
  private activeConnections: number = 0;
  private queue: SimRequest[] = [];
  private connectionTimeoutMs: number = 5000; // 5 seconds wait timeout

  constructor(nodeId: string, engine: SimulationEngine, maxConnections: number = 10) {
    this.nodeId = nodeId;
    this.engine = engine;
    this.maxConnections = maxConnections;
  }

  public setMaxConnections(connections: number) {
    this.maxConnections = connections;
    while (this.activeConnections < this.maxConnections && this.queue.length > 0) {
      const nextReq = this.queue.shift()!;
      this.activeConnections++;
      // We don't have queryLatency here, so let it be handled when next query releases, or we'd need to store it.
    }
  }

  public getActiveConnections(): number {
    return this.activeConnections;
  }

  public getMaxConnections(): number {
    return this.maxConnections;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public acquire(request: SimRequest, queryLatency: number, onComplete: (req: SimRequest) => void): boolean {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      this.scheduleCompletion(request, queryLatency, onComplete);
      return true; // Acquired immediately
    } else {
      // Queue it
      this.queue.push(request);
      
      // Schedule a timeout check
      const timeoutTime = this.engine.getVirtualTime() + this.connectionTimeoutMs;
      this.engine.scheduleEvent({
        id: `evt-db-timeout-${request.id}-${this.nodeId}`,
        time: timeoutTime,
        type: 'REQUEST_FAILED',
        requestId: request.id,
        nodeId: this.nodeId,
        data: { reason: 'Database Connection Pool Timeout' }
      });
      return false; // Queued
    }
  }

  public release(onComplete: (req: SimRequest) => void, queryLatency: number): void {
    this.activeConnections--;
    
    if (this.queue.length > 0) {
      // Dequeue valid (non-timed out) requests
      const nextReq = this.queue.shift()!;
      // NOTE: In a perfect world we'd check if nextReq was already failed by timeout.
      // We will handle this by checking req.status in the simulator engine before processing.
      
      this.activeConnections++;
      this.scheduleCompletion(nextReq, queryLatency, onComplete);
    }
  }

  private scheduleCompletion(request: SimRequest, queryLatency: number, onComplete: (req: SimRequest) => void) {
    const completeTime = this.engine.getVirtualTime() + queryLatency;
    this.engine.scheduleEvent({
      id: `evt-db-complete-${request.id}-${this.nodeId}-${completeTime}`,
      time: completeTime,
      type: 'NODE_COMPLETE',
      requestId: request.id,
      nodeId: this.nodeId,
      data: { callback: () => onComplete(request) }
    });
  }
}
