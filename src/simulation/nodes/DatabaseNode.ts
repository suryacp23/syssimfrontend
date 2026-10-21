import { BaseNode } from './BaseNode';
import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { RequestState } from '../request/RequestState';
import { NetworkLink } from '../network/NetworkLink';
import { ConnectionPool } from '../database/ConnectionPool';
import { SimulationEngine } from '../engine/SimulationEngine';

export class DatabaseNode extends BaseNode {
  private outgoingLinks: NetworkLink[] = [];
  private connectionPool: ConnectionPool;
  private queryTime: number;

  constructor(nodeId: string, engine: SimulationEngine, maxConnections: number = 10, queryTime: number = 300) {
    super(nodeId, engine);
    this.connectionPool = new ConnectionPool(nodeId, engine, maxConnections);
    this.queryTime = queryTime;
  }

  public setReplicas(replicas: number): void {
    this.connectionPool.setMaxConnections(10 * replicas);
  }

  public getMetrics(): { cpuUtilization: number, queued: number } {
    const active = this.connectionPool.getActiveConnections();
    const max = this.connectionPool.getMaxConnections();
    return {
      cpuUtilization: max > 0 ? (active / max) * 100 : 0,
      queued: this.connectionPool.getQueueLength()
    };
  }

  public addOutgoingLink(link: NetworkLink) {
    this.outgoingLinks.push(link);
  }

  public receive(event: SimEvent, request: SimRequest): void {
    if (event.type === 'NODE_ARRIVE' || event.type === 'NODE_RECEIVED') {
      this.log(request, `Arrived at Database Server.`);
      this.process(request);
    } else if (event.type === 'NODE_COMPLETE' && event.data?.callback) {
      event.data.callback();
    }
  }

  protected process(request: SimRequest): void {
    const acquired = this.connectionPool.acquire(request, this.queryTime, (req) => {
      this.complete(req);
    });

    if (acquired) {
      this.log(request, `Executing query at Database.`);
    } else {
      this.log(request, `Waiting for Database Connection. Pool exhausted.`);
    }
  }

  protected complete(request: SimRequest): void {
    this.log(request, `Database query completed (+${this.queryTime}ms).`);
    this.recordNodeMetrics(this.queryTime);
    this.connectionPool.release((req) => this.complete(req), this.queryTime);
    this.forward(request);
  }

  protected forward(request: SimRequest): void {
    if (this.outgoingLinks.length === 0) {
      this.completeNodeRequest(request, RequestState.COMPLETED, `Completed at Database. Returning response to client.`);
      return;
    }
    
    // DB typically doesn't forward unless there's a specific downstream
    this.outgoingLinks[0].transmit(request);
  }
}
