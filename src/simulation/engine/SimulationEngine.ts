import { useSimulationStore } from '@/store/simulationStore';
import { GraphBuilder, AdjacencyList } from './GraphBuilder';
import { SystemNode } from '@/store/canvasStore';
import { Edge } from '@xyflow/react';
import { MetricsAggregator, MetricEvent } from '@/metrics/aggregator/MetricsAggregator';
import { useFailureStore } from '@/store/failureStore';
import { failureEngineInstance } from '../failure/FailureEngine';
import { useMetricsStore } from '@/store/metricsStore';

import { VirtualClock } from './VirtualClock';
import { EventQueue } from './EventQueue';
import { NodeRegistry } from './NodeRegistry';
import { Router } from './Router';
import { EventDispatcher } from './EventDispatcher';
import { SimEvent } from '../types/Event';
import { RequestState } from '../request/RequestState';
import { SimRequest } from '../request/SimRequest';
import { RequestFactory } from '../request/RequestFactory';
import { RequestGenerator } from '../request/RequestGenerator';
import { RequestLogger } from '../request/RequestLogger';
import { useScalingStore } from '@/store/scalingStore';

import { ClientNode } from '../nodes/ClientNode';
import { APINode } from '../nodes/APINode';
import { DatabaseNode } from '../nodes/DatabaseNode';
import { RedisNode } from '../nodes/RedisNode';
import { LoadBalancerNode } from '../nodes/LoadBalancerNode';
import { QueueNode } from '../nodes/QueueNode';
import { CDNNode } from '../nodes/CDNNode';
import { NetworkLink } from '../network/NetworkLink';

export class SimulationEngine {
  private clock = new VirtualClock();
  private queue = new EventQueue();
  private registry = new NodeRegistry();
  private router = new Router();
  private dispatcher: EventDispatcher;

  private graph: AdjacencyList = {};
  private requestMap: Map<string, SimRequest> = new Map();
  private linkMap: Map<string, NetworkLink> = new Map();
  private requestCacheFlags: Map<string, boolean> = new Map();

  constructor() {
    this.dispatcher = new EventDispatcher(this.registry, this.router, this.queue);
  }

  public init(nodes: SystemNode[], edges: Edge[], preGeneratedEvents?: SimEvent[]) {
    this.graph = GraphBuilder.build(nodes, edges);
    this.clock.reset();
    this.queue.reset();
    this.registry.clear();
    this.requestMap.clear();
    this.linkMap.clear();
    this.requestCacheFlags.clear();

    MetricsAggregator.init();
    failureEngineInstance.reset();
    failureEngineInstance.updateNodeHealth(this.graph);

    // 1. Instantiate modular nodes
    nodes.forEach(node => {
      const type = node.data?.type;
      const processingTime = node.data?.processingTime ? Number(node.data.processingTime) : undefined;
      let simNode;
      
      switch(type) {
        case 'client': simNode = new ClientNode(node.id, this); break;
        case 'api': simNode = new APINode(node.id, this, 4, processingTime || 20); break;
        case 'database': simNode = new DatabaseNode(node.id, this, 10, processingTime || 50); break;
        case 'redis': simNode = new RedisNode(node.id, this); break;
        case 'loadBalancer': simNode = new LoadBalancerNode(node.id, this); break;
        case 'queue': simNode = new QueueNode(node.id, this, 100); break;
        case 'cdn': simNode = new CDNNode(node.id, this); break;
        default: simNode = new APINode(node.id, this, 4, processingTime || 20);
      }
      this.registry.register(simNode);
    });

    // 2. Instantiate NetworkLinks
    edges.forEach(edge => {
      const link = new NetworkLink(edge.id, edge.source, edge.target, this);
      this.linkMap.set(edge.id, link);
      
      const sourceNode = this.registry.get(edge.source) as any;
      if (sourceNode && typeof sourceNode.addOutgoingLink === 'function') {
        sourceNode.addOutgoingLink(link);
      }
    });

    const clientNode = nodes.find(n => n.data?.type === 'client');
    if (!clientNode) return;

    let startEvents: SimEvent[] = [];
    if (preGeneratedEvents) {
      startEvents = preGeneratedEvents;
    } else {
      const scalingStore = useScalingStore.getState();
      const { virtualUsers, requestsPerVu, trafficPattern } = scalingStore;
      startEvents = RequestGenerator.generateEvents(virtualUsers, requestsPerVu, trafficPattern, clientNode.id);
    }
    
    startEvents.forEach(e => this.queue.push(e));

    const initialUiRequests: SimRequest[] = [];
    const MAX_UI_REQUESTS = 200;
    const isUiVisible = startEvents.length <= MAX_UI_REQUESTS;

    startEvents.forEach((evt, idx) => {
      const visible = isUiVisible || idx < MAX_UI_REQUESTS;
      const req = RequestFactory.create(evt.requestId, evt.time, visible);
      RequestLogger.append(req, evt.time, clientNode.id, 'Created');
      
      this.requestMap.set(req.id, req);
      MetricsAggregator.addEvent({
        type: 'RequestStarted',
        requestId: req.id,
        timestamp: evt.time,
      });
      if (visible) {
        initialUiRequests.push(req);
      }
    });

    // Notice we're passing it to the store. 
    // Wait, the store needs to accept SimRequest matching the new format. We will update the store soon.
    useSimulationStore.getState().setRequests(initialUiRequests);
  }

  public tick(realDeltaTimeMs: number, speedMultiplier: number): { completed: boolean } {
    const store = useSimulationStore.getState();
    if (!store.isRunning || store.isPaused) {
      return { completed: false };
    }

    const virtualDelta = realDeltaTimeMs * speedMultiplier;
    this.clock.advance(virtualDelta);
    
    failureEngineInstance.updateNodeHealth(this.graph);

    while (!this.queue.isEmpty()) {
      const peekEvent = this.queue.peek()!;
      if (peekEvent.time > this.clock.now()) {
        break; // Stop processing future events
      }

      const event = this.queue.pop()!;
      
      if (event.type === 'EDGE_TRAVEL') {
        useSimulationStore.getState().removeAnimatingEdge(event.edgeId!, event.data?.animId);
        continue;
      }

      const req = this.requestMap.get(event.requestId);
      if (req && (req.status === RequestState.FAILED || req.status === RequestState.COMPLETED)) {
        continue; // Skip processing dead requests
      }

      this.dispatcher.dispatch(event, (id) => this.requestMap.get(id));
    }

    const activeOrPending = Array.from(this.requestMap.values()).some(
      r => r.status !== RequestState.COMPLETED && r.status !== RequestState.FAILED
    );
    const completed = this.queue.isEmpty() && !activeOrPending;

    if (completed) {
      store.completeSimulation();
      MetricsAggregator.flush();
    } else {
      MetricsAggregator.updateTime(this.clock.now());
    }

    return { completed };
  }

  public scheduleEvent(event: SimEvent) {
    this.queue.push(event);
  }

  public getVirtualTime(): number {
    return this.clock.now();
  }

  public getGraph(): AdjacencyList {
    return this.graph;
  }

  public getNode(id: string) {
    return this.registry.get(id);
  }

  public getRouter(): Router {
    return this.router;
  }

  public log(request: SimRequest, nodeId: string, message: string) {
    RequestLogger.append(request, this.clock.now(), nodeId, message);
  }

  public completeRequest(request: SimRequest, status: RequestState, message: string, nodeId: string) {
    request.status = status;
    request.currentNode = null;
    request.completedAt = this.clock.now();
    request.latency = Math.round(request.completedAt - request.createdAt);
    
    this.log(request, nodeId, message);
    
    useSimulationStore.getState().updateRequest(request.id, {
      status,
      currentNode: null,
      latency: request.latency,
    });

    if (status === RequestState.COMPLETED) {
      MetricsAggregator.addEvent({
        type: 'RequestCompleted',
        requestId: request.id,
        latency: request.latency,
        timestamp: this.clock.now(),
      });
    } else {
      MetricsAggregator.addEvent({
        type: 'RequestFailed',
        requestId: request.id,
        timestamp: this.clock.now(),
      });
    }
  }

  public startEdgeAnimation(edgeId: string, requestId: string, arrivalTime: number) {
    const animId = `anim-${requestId}-${edgeId}-${this.clock.now()}`;
    useSimulationStore.getState().addAnimatingEdge(edgeId, requestId, animId);
    
    this.scheduleEvent({
      id: `evt-edge-clear-${requestId}-${edgeId}`,
      time: arrivalTime,
      type: 'EDGE_TRAVEL',
      requestId: requestId,
      edgeId: edgeId,
      data: { animId }
    });
  }

  public setCacheDecision(requestId: string, hit: boolean) {
    this.requestCacheFlags.set(requestId, hit);
  }

  public getCacheDecision(requestId: string): boolean {
    if (!this.requestCacheFlags.has(requestId)) {
      this.requestCacheFlags.set(requestId, Math.random() < 0.8);
    }
    return this.requestCacheFlags.get(requestId)!;
  }

  public handleRequestFailure(req: SimRequest, message: string, nodeId: string) {
    this.completeRequest(req, RequestState.FAILED, message, nodeId);
  }
  
  public getNodeType(nodeId: string): string {
    return this.graph[nodeId]?.node?.data?.type || 'api';
  }

  public getNodeName(nodeId: string): string {
    return this.graph[nodeId]?.node?.data?.label || nodeId;
  }
}

export const simulatorInstance = new SimulationEngine();
