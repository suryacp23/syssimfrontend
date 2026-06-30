import { useSimulationStore, SimMetrics } from '@/store/simulationStore';
import { GraphBuilder, AdjacencyList } from './GraphBuilder';
import { SimRequest } from '../types/Request';
import { SimEvent } from '../types/Event';
import { SystemNode } from '@/store/canvasStore';
import { Edge } from '@xyflow/react';
import { MetricsAggregator, MetricEvent } from '@/metrics/aggregator/MetricsAggregator';
import { useFailureStore } from '@/store/failureStore';
import { failureEngineInstance } from '../failure/FailureEngine';
import { TimeoutHandler } from '../failure/TimeoutHandler';
import { circuitBreakerInstance } from '../failure/CircuitBreaker';
import { retryPolicyInstance } from '../failure/RetryPolicy';
import { LoadGenerator } from '../load/LoadGenerator';
import { useMetricsStore } from '@/store/metricsStore';
import { useScalingStore } from '@/store/scalingStore';
import { resourceManagerInstance } from '../load/ResourceManager';
import { autoScalerInstance } from '../load/AutoScaler';

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

  public init(nodes: SystemNode[], edges: Edge[]) {
    this.graph = GraphBuilder.build(nodes, edges);
    this.eventQueue = [];
    this.virtualTime = 0;
    this.lbIndexMap = {};
    this.requestMap = {};
    this.requestCallStack = {};
    this.requestCacheFlags = {};

    // Initialize Metrics Aggregator, Failure Engine, Resource Manager & AutoScaler
    MetricsAggregator.init();
    failureEngineInstance.reset();
    failureEngineInstance.updateNodeHealth(this.graph);
    resourceManagerInstance.init();
    autoScalerInstance.reset();

    const clientNode = nodes.find(n => n.data?.type === 'client');
    if (!clientNode) return;

    // Fetch load generation config
    const scalingStore = useScalingStore.getState();
    const { virtualUsers, requestsPerVu, trafficPattern } = scalingStore;

    // Generate requests using LoadGenerator
    const startEvents = LoadGenerator.generate(virtualUsers, requestsPerVu, trafficPattern, clientNode.id);
    
    // Sort and push to event queue
    startEvents.sort((a, b) => a.time - b.time);
    this.eventQueue = [...startEvents];

    // Initialize request map and call stack, mark up to 200 for UI visibility
    const initialUiRequests: SimRequest[] = [];
    const MAX_UI_REQUESTS = 200;
    const isUiVisible = startEvents.length <= MAX_UI_REQUESTS;

    startEvents.forEach((evt, idx) => {
      const visible = isUiVisible || idx < MAX_UI_REQUESTS;
      
      const req: SimRequest = {
        id: evt.requestId,
        status: 'pending',
        currentNodeId: null,
        path: [],
        latency: 0,
        startTime: evt.time,
        log: [`Scheduled to start at virtual time ${Math.round(evt.time)}ms.`],
        isUIVisible: visible,
      };

      this.requestMap[req.id] = req;
      this.requestCallStack[req.id] = [];

      if (visible) {
        initialUiRequests.push(req);
      }
    });

    // Sync ONLY visible requests to store
    useSimulationStore.getState().setRequests(initialUiRequests);
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
    
    // Update node health dynamic status
    failureEngineInstance.updateNodeHealth(this.graph);

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
      
      // Calculate final cost
      const { costCalculatorInstance } = require('../load/CostCalculator');
      const finalCost = costCalculatorInstance.calculateMonthlyCost(this.graph);
      useScalingStore.getState().setEstimatedMonthlyCost(finalCost);

      // Generate Performance Recommendations
      const { performanceAnalyzerInstance } = require('../../metrics/analysis/PerformanceAnalyzer');
      const { metrics, nodeMetrics, setRecommendations } = useMetricsStore.getState();
      const recommendations = performanceAnalyzerInstance.analyze(nodeMetrics, metrics);
      setRecommendations(recommendations);
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
        const nodeStatus = failureEngineInstance.getNodeStatus(nodeId, this.virtualTime);

        if (nodeStatus === 'unavailable') {
          const tripped = circuitBreakerInstance.recordFailure(nodeId, this.virtualTime);
          if (tripped) {
            MetricsAggregator.addEvent({
              type: 'CircuitOpened',
              nodeId,
              nodeName: this.graph[nodeId]?.node?.data?.label || nodeId,
              timestamp: this.virtualTime,
            } as unknown as MetricEvent);
          }
          this.handleRequestFailure(req, event, `Node ${nodeId} is unavailable!`);
          break;
        }

        circuitBreakerInstance.recordSuccess(nodeId);

        req.currentNodeId = nodeId;
        req.path.push(nodeId);

        const node = this.graph[nodeId]?.node;
        const type = node?.data?.type || 'api';
        const latency = (DEFAULT_LATENCY[type] || 10) + failureEngineInstance.getAddedLatency();
        
        // Implement Resource Pools
        const replicas = useScalingStore.getState().nodeReplicas[nodeId] || 1;
        const instanceSize = (node?.data?.instanceSize as any) || 'small';
        
        const capacity = resourceManagerInstance.getCapacity(type as string, replicas, instanceSize);
        
        const acquireResult = resourceManagerInstance.tryAcquire(nodeId, capacity, req.id);

        if (acquireResult === 'dropped') {
          req.log.push(`Queue Overflow at ${node?.data?.label || 'Node'}! Request dropped.`);
          MetricsAggregator.addEvent({
            type: 'QueueDropped',
            nodeId,
            nodeName: node?.data?.label || nodeId,
            timestamp: this.virtualTime,
          });
          this.completeRequest(req, 'failed', `Queue Overflow at ${node?.data?.label || 'Node'}! Request dropped.`);
          break;
        }

        if (acquireResult === 'queued') {
          req.log.push(`Queued at ${node?.data?.label || 'Node'} (${type}).`);
          if (req.isUIVisible) {
            store.updateRequest(req.id, {
              currentNodeId: nodeId,
              path: [...req.path],
              log: [...req.log],
            });
          }
          // Request is queued, it will be resumed by NODE_COMPLETE of another request
          break;
        }

        // Acquired successfully
        req.log.push(`Processing at ${node?.data?.label || 'Node'} (${type}).`);
        if (req.isUIVisible) {
          store.updateRequest(req.id, {
            currentNodeId: nodeId,
            path: [...req.path],
            log: [...req.log],
          });
        }

        store.incrementActiveNode(nodeId);
        MetricsAggregator.registerNodeActiveCount(
          nodeId,
          node?.data?.label || nodeId,
          type,
          useSimulationStore.getState().activeNodes[nodeId] || 0
        );

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

        if (TimeoutHandler.isTimeout(req.latency)) {
           MetricsAggregator.addEvent({
             type: 'RequestTimeout',
             requestId: req.id,
             timestamp: this.virtualTime,
           } as unknown as MetricEvent);
           this.handleRequestFailure(req, event, `Request timed out (Latency ${req.latency}ms)`);
           // Note: Timeout means it failed, but we still release the worker below
        } else {
           const node = this.graph[nodeId]?.node;
           req.log.push(`Processed by ${node?.data?.label || 'Node'} (+${latency}ms).`);
           if (req.isUIVisible) {
             store.updateRequest(req.id, {
               latency: req.latency,
               log: [...req.log],
             });
           }
        } // closing brace for else block

        // Remove node highlight glow
        store.decrementActiveNode(nodeId);
        store.incrementProcessedNode(nodeId);

        // Release worker and pick next from queue
        const nextReqId = resourceManagerInstance.release(nodeId);
        if (nextReqId) {
          const nextReq = this.requestMap[nextReqId];
          const node = this.graph[nodeId]?.node;
          const type = node?.data?.type || 'api';
          const newLatency = (DEFAULT_LATENCY[type] || 10) + failureEngineInstance.getAddedLatency();

          if (nextReq) {
            nextReq.log.push(`Resumed processing at ${node?.data?.label || 'Node'} (${type}).`);
            store.incrementActiveNode(nodeId);
            this.scheduleEvent({
              id: `evt-complete-${nextReqId}-${nodeId}-${this.virtualTime}`,
              time: this.virtualTime + newLatency,
              type: 'NODE_COMPLETE',
              requestId: nextReqId,
              nodeId: nodeId,
              data: { latency: newLatency },
            });
          }
        }

        // Evaluate auto-scaling
        autoScalerInstance.evaluate(this.virtualTime, this.graph);
        const node = this.graph[nodeId]?.node;

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

        if (failureEngineInstance.checkPacketLoss()) {
          this.handleRequestFailure(req, event, `Packet lost in transit to ${targetNodeId}`);
          break;
        }

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

    // 1. Load Balancer Allocation
    if (type === 'loadBalancer') {
      const algo = useScalingStore.getState().loadBalancerAlgo || 'roundRobin';
      let targetEdge = outgoing[0];

      // Filter out unavailable downstream nodes
      const availableEdges = outgoing.filter(e => 
        failureEngineInstance.getNodeStatus(e.targetId, this.virtualTime) !== 'unavailable'
      );

      if (availableEdges.length === 0) {
        this.completeRequest(req, 'failed', `Load Balancer failed: All downstream API servers are unavailable.`);
        return;
      }

      if (algo === 'roundRobin') {
        let rrIndex = this.lbIndexMap[nodeId] || 0;
        targetEdge = availableEdges[rrIndex % availableEdges.length];
        this.lbIndexMap[nodeId] = (rrIndex + 1) % availableEdges.length;
        req.log.push(`Load balanced (Round Robin) to API.`);
      } 
      else if (algo === 'leastConnections') {
        let minActive = Infinity;
        let selectedEdge = availableEdges[0];
        
        availableEdges.forEach(edge => {
          const stats = resourceManagerInstance.getStats(edge.targetId, { maxWorkers: 0, maxQueue: 0, memoryMb: 0 }); // We only need active count
          const active = stats.active + stats.queued; // Total connections/requests queued
          if (active < minActive) {
            minActive = active;
            selectedEdge = edge;
          }
        });
        
        targetEdge = selectedEdge;
        req.log.push(`Load balanced (Least Connections) to API.`);
      }
      else if (algo === 'random') {
        const randomIndex = Math.floor(Math.random() * availableEdges.length);
        targetEdge = availableEdges[randomIndex];
        req.log.push(`Load balanced (Random) to API.`);
      }
      else if (algo === 'weightedRoundRobin') {
        // Simplified: use random for now or base it on node capacity
        // Assuming capacity as weight:
        const totalCapacity = availableEdges.reduce((sum, e) => {
          const reps = useScalingStore.getState().nodeReplicas[e.targetId] || 1;
          return sum + reps;
        }, 0);
        
        let roll = Math.random() * totalCapacity;
        for (const edge of availableEdges) {
          const reps = useScalingStore.getState().nodeReplicas[edge.targetId] || 1;
          roll -= reps;
          if (roll <= 0) {
            targetEdge = edge;
            break;
          }
        }
        req.log.push(`Load balanced (Weighted Round Robin) to API.`);
      }

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

  // Handle request failure (retry or complete with failure)
  private handleRequestFailure(req: SimRequest, currentEvent: SimEvent, message: string) {
    const config = useFailureStore.getState().config;
    
    if (retryPolicyInstance.getRetryCount(req.id) < config.retryCount) {
      req.log.push(`Failure: ${message}`);
      const attempt = retryPolicyInstance.incrementRetry(req.id);
      const backoff = retryPolicyInstance.getBackoffMs(attempt);
      req.log.push(`Retrying request (Attempt ${attempt}/${config.retryCount}) after ${backoff}ms...`);
      
      MetricsAggregator.addEvent({
        type: 'RequestRetried',
        requestId: req.id,
        timestamp: this.virtualTime,
      } as unknown as MetricEvent);

      // Reset request properties for retry
      req.path = [];
      req.latency = 0;
      req.currentNodeId = null;

      const clientNodeId = req.path[0] || currentEvent.nodeId; // fallback
      
      this.scheduleEvent({
        id: `evt-retry-${req.id}-${this.virtualTime}`,
        time: this.virtualTime + backoff,
        type: 'REQUEST_START',
        requestId: req.id,
        nodeId: clientNodeId, 
      });
    } else {
      this.completeRequest(req, 'failed', `Permanent failure: ${message}`);
    }
  }
}

export const simulatorInstance = new SimulationEngine();
