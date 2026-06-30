import { useSimulationStore, SimMetrics } from '@/store/simulationStore';
import { GraphBuilder, AdjacencyList } from './GraphBuilder';
import { SimRequest } from '../types/Request';
import { SimEvent } from '../types/Event';
import { SystemNode } from '@/store/canvasStore';
import { Edge } from '@xyflow/react';
import { MetricsAggregator } from '@/metrics/aggregator/MetricsAggregator';

// Default latency values per component type
const DEFAULT_LATENCY: Record<string, number> = {
  client: 1,
  loadBalancer: 2,
  api: 20,
  redis: 3,
  queue: 8,
  database: 50,
  cdn: 2,
};

export class SimulationEngine {
  private graph: AdjacencyList = {};
  private eventQueue: SimEvent[] = [];
  private virtualTime: number = 0;
  private lbIndexMap: Record<string, number> = {}; // lbNodeId -> current RR index
  private requestMap: Record<string, SimRequest> = {};
  private requestCallStack: Record<string, string[]> = {}; // requestId -> nodeStack for return path
  private requestCacheFlags: Record<string, boolean> = {}; // requestId -> cacheHit boolean

  // Initialize the simulation with 100 staggered requests
  public init(nodes: SystemNode[], edges: Edge[]) {
    this.graph = GraphBuilder.build(nodes, edges);
    this.eventQueue = [];
    this.virtualTime = 0;
    this.lbIndexMap = {};
    this.requestMap = {};
    this.requestCallStack = {};
    this.requestCacheFlags = {};

    // Initialize Metrics Aggregator
    MetricsAggregator.init();

    const clientNode = nodes.find(n => n.data?.type === 'client');
    if (!clientNode) return;

    // Create 100 requests staggered every 200ms of virtual simulation time
    const initialRequests: SimRequest[] = [];
    for (let i = 0; i < 100; i++) {
      const requestId = `req-${i + 1}`;
      
      const req: SimRequest = {
        id: requestId,
        status: 'pending',
        currentNodeId: null,
        path: [],
        latency: 0,
        startTime: i * 200,
        log: [`Scheduled to start at virtual time ${i * 200}ms.`],
      };

      initialRequests.push(req);
      this.requestMap[requestId] = req;
      this.requestCallStack[requestId] = [];

      // Schedule REQUEST_START event
      this.eventQueue.push({
        id: `evt-start-${requestId}`,
        time: i * 200,
        type: 'REQUEST_START',
        requestId,
        nodeId: clientNode.id,
      });
    }

    // Sort queue by time
    this.eventQueue.sort((a, b) => a.time - b.time);

    // Sync initial requests to store
    useSimulationStore.getState().setRequests(initialRequests);
  }

  // Run the clock forward by deltaTime (scaled by simulator speed)
  public tick(realDeltaTimeMs: number, speedMultiplier: number): { completed: boolean } {
    const store = useSimulationStore.getState();
    if (!store.isRunning || store.isPaused) {
      return { completed: false };
    }

    // Increment virtual clock
    const virtualDelta = realDeltaTimeMs * speedMultiplier;
    this.virtualTime += virtualDelta;

    // Process all events scheduled up to this virtual time
    while (this.eventQueue.length > 0 && this.eventQueue[0].time <= this.virtualTime) {
      const event = this.eventQueue.shift()!;
      this.processEvent(event);
    }

    // Check if the simulation is finished (queue is empty and all requests completed/failed)
    const activeOrPending = Object.values(this.requestMap).some(
      r => r.status === 'pending' || r.status === 'processing'
    );
    const completed = this.eventQueue.length === 0 && !activeOrPending;

    if (completed) {
      store.completeSimulation();
      MetricsAggregator.flush();
    } else {
      MetricsAggregator.updateTime(this.virtualTime);
    }

    return { completed };
  }

  // Process a single discrete event
  private processEvent(event: SimEvent) {
    const store = useSimulationStore.getState();
    const req = this.requestMap[event.requestId];
    if (!req) return;

    switch (event.type) {
      case 'REQUEST_START': {
        req.status = 'processing';
        req.currentNodeId = event.nodeId || null;
        req.log.push(`Request initiated at Client.`);
        store.updateRequest(req.id, {
          status: 'processing',
          currentNodeId: req.currentNodeId,
          log: [...req.log],
        });

        MetricsAggregator.addEvent({
          type: 'RequestStarted',
          requestId: req.id,
          timestamp: this.virtualTime,
        });

        // Arrive at the client node immediately
        this.scheduleEvent({
          id: `evt-arrive-${req.id}-${event.nodeId}`,
          time: this.virtualTime,
          type: 'NODE_ARRIVE',
          requestId: req.id,
          nodeId: event.nodeId,
        });
        break;
      }

      case 'NODE_ARRIVE': {
        const nodeId = event.nodeId!;
        req.currentNodeId = nodeId;
        req.path.push(nodeId);

        const node = this.graph[nodeId]?.node;
        const type = node?.data?.type || 'api';
        const latency = DEFAULT_LATENCY[type] || 10;

        // Implement Queue Dropping
        if (type === 'queue') {
          const currentQueueSize = useSimulationStore.getState().activeNodes[nodeId] || 0;
          const capacity = 8; // Default queue limit
          if (currentQueueSize >= capacity) {
            req.log.push(`Queue Overflow! Active count is ${currentQueueSize} (limit ${capacity}). Request dropped.`);
            MetricsAggregator.addEvent({
              type: 'QueueDropped',
              nodeId,
              nodeName: node?.data?.label || nodeId,
              timestamp: this.virtualTime,
            });
            this.completeRequest(req, 'failed', `Queue Overflow at ${node?.data?.label || 'Queue'}! Request dropped.`);
            break;
          }
        }

        req.log.push(`Arrived at ${node?.data?.label || 'Node'} (${type}). Processing...`);
        store.updateRequest(req.id, {
          currentNodeId: nodeId,
          path: [...req.path],
          log: [...req.log],
        });

        // Add node highlight glow
        store.incrementActiveNode(nodeId);
        MetricsAggregator.registerNodeActiveCount(
          nodeId,
          node?.data?.label || nodeId,
          type,
          useSimulationStore.getState().activeNodes[nodeId] || 0
        );

        // Schedule NODE_COMPLETE
        this.scheduleEvent({
          id: `evt-complete-${req.id}-${nodeId}`,
          time: this.virtualTime + latency,
          type: 'NODE_COMPLETE',
          requestId: req.id,
          nodeId: nodeId,
          data: { latency },
        });
        break;
      }

      case 'NODE_COMPLETE': {
        const nodeId = event.nodeId!;
        const latency = event.data?.latency || 0;
        req.latency += latency;

        const node = this.graph[nodeId]?.node;
        req.log.push(`Processed by ${node?.data?.label || 'Node'} (+${latency}ms).`);
        store.updateRequest(req.id, {
          latency: req.latency,
          log: [...req.log],
        });

        // Remove node highlight glow
        store.decrementActiveNode(nodeId);
        MetricsAggregator.registerNodeActiveCount(
          nodeId,
          node?.data?.label || nodeId,
          node?.data?.type || 'api',
          useSimulationStore.getState().activeNodes[nodeId] || 0
        );

        // Increment processed node count
        store.incrementProcessedNode(nodeId);

        // Record Node Visit in metrics
        MetricsAggregator.addEvent({
          type: 'NodeVisited',
          nodeId,
          nodeName: node?.data?.label || nodeId,
          nodeType: node?.data?.type || 'api',
          latency,
          timestamp: this.virtualTime,
        });

        // Determine routing direction
        this.routeRequest(req, nodeId);
        break;
      }

      case 'EDGE_TRAVEL': {
        const edgeId = event.edgeId!;
        const targetNodeId = event.targetNodeId!;
        
        // Remove animation from edge
        store.removeAnimatingEdge(edgeId, event.id);

        // Arrive at target node
        this.scheduleEvent({
          id: `evt-arrive-${req.id}-${targetNodeId}`,
          time: this.virtualTime,
          type: 'NODE_ARRIVE',
          requestId: req.id,
          nodeId: targetNodeId,
        });
        break;
      }
    }
  }

  // Event scheduling helper (keeps queue sorted by virtualTime)
  private scheduleEvent(event: SimEvent) {
    this.eventQueue.push(event);
    this.eventQueue.sort((a, b) => a.time - b.time);
  }

  // Request routing state machine (One-way forward routing)
  private routeRequest(req: SimRequest, nodeId: string) {
    const adj = this.graph[nodeId];

    if (!adj) {
      this.completeRequest(req, 'failed', `Error: Node metadata missing.`);
      return;
    }

    const type = adj.node.data?.type;
    const outgoing = adj.outgoing;

    // Terminal node (Database or no outgoing connections): Request ends successfully!
    if (type === 'database' || outgoing.length === 0) {
      this.completeRequest(req, 'completed', `Reached terminal node ${adj.node.data?.label || 'Database'}. Request completed!`);
      return;
    }

    // 1. Load Balancer Round Robin Outgoing Allocation
    if (type === 'loadBalancer') {
      const rrIndex = this.lbIndexMap[nodeId] || 0;
      const targetEdge = outgoing[rrIndex % outgoing.length];
      this.lbIndexMap[nodeId] = (rrIndex + 1) % outgoing.length;

      req.log.push(`Load balanced (Round Robin index ${rrIndex}) to API.`);
      this.dispatchTravel(req, targetEdge.edgeId, targetEdge.targetId);
      return;
    }

    // 2. API Server Routing (Cache hit/miss evaluation)
    if (type === 'api') {
      const redisEdge = outgoing.find(e => {
        const tgt = this.graph[e.targetId]?.node;
        return tgt?.data?.type === 'redis';
      });

      if (redisEdge) {
        const hit = Math.random() < 0.8; // 80% Cache Hit Rate
        this.requestCacheFlags[req.id] = hit;

        req.log.push(`Checking Cache: Hit probability decided as ${hit ? 'HIT (80%)' : 'MISS (20%)'}.`);
        this.dispatchTravel(req, redisEdge.edgeId, redisEdge.targetId);
        return;
      }
      
      const targetEdge = outgoing.find(e => {
        const tType = this.graph[e.targetId]?.node?.data?.type;
        return tType === 'database' || tType === 'queue';
      }) || outgoing[0];

      this.dispatchTravel(req, targetEdge.edgeId, targetEdge.targetId);
      return;
    }

    // 3. Redis Cache Hit/Miss Routing
    if (type === 'redis') {
      let isCacheHit = this.requestCacheFlags[req.id];
      if (isCacheHit === undefined) {
        // Roll cache hit decision at Redis if not pre-decided at API server
        isCacheHit = Math.random() < 0.8; // 80% Cache Hit Rate
        this.requestCacheFlags[req.id] = isCacheHit;
        req.log.push(`Checking Cache (at Redis): Decision rolled as ${isCacheHit ? 'HIT (80%)' : 'MISS (20%)'}.`);
      }

      const nodeName = adj.node.data?.label || nodeId;

      if (isCacheHit) {
        // Cache Hit: ends at Redis!
        MetricsAggregator.addEvent({
          type: 'CacheHit',
          nodeId,
          nodeName,
          nodeType: 'redis',
          timestamp: this.virtualTime,
        });
        this.completeRequest(req, 'completed', `Cache Hit! Redis returning values immediately.`);
      } else {
        // Cache Miss: forwards to Database
        MetricsAggregator.addEvent({
          type: 'CacheMiss',
          nodeId,
          nodeName,
          nodeType: 'redis',
          timestamp: this.virtualTime,
        });
        req.log.push(`Cache Miss! Redis fetching from Database.`);
        const dbEdge = outgoing.find(e => {
          const tgt = this.graph[e.targetId]?.node;
          return tgt?.data?.type === 'database';
        }) || outgoing[0];

        this.dispatchTravel(req, dbEdge.edgeId, dbEdge.targetId);
      }
      return;
    }

    // 4. Default: Forward along first outgoing edge
    const targetEdge = outgoing[0];
    this.dispatchTravel(req, targetEdge.edgeId, targetEdge.targetId);
  }

  // Dispatch request travel along edge
  private dispatchTravel(req: SimRequest, edgeId: string, targetNodeId: string) {
    const store = useSimulationStore.getState();
    const animId = `anim-${req.id}-${edgeId}-${this.virtualTime}`;

    store.addAnimatingEdge(edgeId, req.id, animId);

    const travelTime = 400; // Edge travel takes 400ms virtual time

    this.scheduleEvent({
      id: animId,
      time: this.virtualTime + travelTime,
      type: 'EDGE_TRAVEL',
      requestId: req.id,
      edgeId: edgeId,
      targetNodeId: targetNodeId,
    });
  }

  // Complete request and finalize status
  private completeRequest(req: SimRequest, status: 'completed' | 'failed', message: string) {
    const store = useSimulationStore.getState();
    req.status = status;
    req.currentNodeId = null;
    req.log.push(message);
    
    store.updateRequest(req.id, {
      status,
      currentNodeId: null,
      log: [...req.log],
    });

    if (status === 'completed') {
      MetricsAggregator.addEvent({
        type: 'RequestCompleted',
        requestId: req.id,
        latency: req.latency,
        timestamp: this.virtualTime,
      });
    } else {
      MetricsAggregator.addEvent({
        type: 'RequestFailed',
        requestId: req.id,
        timestamp: this.virtualTime,
      });
    }
  }
}

export const simulatorInstance = new SimulationEngine();
