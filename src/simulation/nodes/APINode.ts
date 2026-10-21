import { BaseNode } from './BaseNode';
import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { RequestState } from '../request/RequestState';
import { NetworkLink } from '../network/NetworkLink';
import { ThreadPool } from '../scheduler/ThreadPool';
import { SimulationEngine } from '../engine/SimulationEngine';

export class APINode extends BaseNode {
  private outgoingLinks: NetworkLink[] = [];
  private threadPool: ThreadPool;
  private processingTime: number;

  constructor(nodeId: string, engine: SimulationEngine, maxWorkers: number = 4, processingTime: number = 200) {
    super(nodeId, engine);
    this.threadPool = new ThreadPool(nodeId, engine, maxWorkers);
    this.processingTime = processingTime;
  }

  public setReplicas(replicas: number): void {
    // scale max workers based on replicas
    // Assuming base maxWorkers was what we initialized with (e.g. 4)
    // For simplicity, let's just multiply base (4) * replicas
    this.threadPool.setMaxWorkers(4 * replicas);
  }

  public getMetrics(): { cpuUtilization: number, queued: number } {
    const active = this.threadPool.getActiveWorkers();
    const max = this.threadPool.getMaxWorkers();
    return { 
      cpuUtilization: max > 0 ? (active / max) * 100 : 0, 
      queued: this.threadPool.getQueueLength() 
    };
  }

  public addOutgoingLink(link: NetworkLink) {
    this.outgoingLinks.push(link);
  }

  public receive(event: SimEvent, request: SimRequest): void {
    if (event.type === 'NODE_ARRIVE' || event.type === 'NODE_RECEIVED') {
      this.log(request, `Arrived at API Server.`);
      this.process(request);
    } else if (event.type === 'NODE_COMPLETE' && event.data?.callback) {
      event.data.callback();
    }
  }

  protected process(request: SimRequest): void {
    const started = this.threadPool.submit(request, this.processingTime, (req) => {
      this.complete(req);
    });

    if (started) {
      this.log(request, `Processing at API Server (api).`);
    } else {
      this.log(request, `Queued at API Server (api). Thread pool exhausted.`);
    }
  }

  protected complete(request: SimRequest): void {
    this.log(request, `Processed by API Server (+${this.processingTime}ms).`);
    this.recordNodeMetrics(this.processingTime);
    this.threadPool.release((req) => this.complete(req), this.processingTime);
    this.forward(request);
  }

  protected forward(request: SimRequest): void {
    if (this.outgoingLinks.length === 0) {
      this.completeNodeRequest(request, RequestState.COMPLETED, `Completed at API Server.`);
      return;
    }

    // Look for Redis (Cache) edge first
    const redisEdge = this.outgoingLinks.find(link => this.engine.getNodeType(link.getTargetNodeId()) === 'redis');
    if (redisEdge) {
      // API dictates cache decision 
      const hit = Math.random() < 0.8; 
      this.engine.setCacheDecision(request.id, hit);
      this.log(request, `Checking Cache: Hit probability decided as ${hit ? 'HIT (80%)' : 'MISS (20%)'}.`);
      redisEdge.transmit(request);
      return;
    }

    // Look for DB or Queue
    const targetEdge = this.outgoingLinks.find(link => {
      const type = this.engine.getNodeType(link.getTargetNodeId());
      return type === 'database' || type === 'queue';
    }) || this.outgoingLinks[0];

    targetEdge.transmit(request);
  }
}
