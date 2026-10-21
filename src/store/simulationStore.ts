import { create } from 'zustand';
import { SystemNode } from './canvasStore';
import { Edge } from '@xyflow/react';
import { SimRequest } from '@/simulation/request/SimRequest';
import { RequestState } from '@/simulation/request/RequestState';
import { GraphBuilder } from '@/simulation/engine/GraphBuilder';

export interface SimMetrics {
  totalRequests: number;
  completed: number;
  failed: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  cacheHits: number;
  cacheMisses: number;
}

interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  requests: SimRequest[];
  activeNodes: Record<string, number>; // nodeId -> active request counts
  animatingEdges: Record<string, { id: string; requestId: string }[]>; // edgeId -> active requests
  processedNodes: Record<string, number>; // nodeId -> total processed requests
  metrics: SimMetrics;
  speed: number;
  selectedRequestId: string | null;
  validationErrors: string[];

  startSimulation: (nodes: SystemNode[], edges: Edge[]) => boolean;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  completeSimulation: () => void;
  setSpeed: (speed: number) => void;
  setSelectedRequestId: (id: string | null) => void;
  
  setRequests: (requests: SimRequest[]) => void;
  updateRequest: (requestId: string, updates: Partial<SimRequest>) => void;
  incrementActiveNode: (nodeId: string) => void;
  decrementActiveNode: (nodeId: string) => void;
  incrementProcessedNode: (nodeId: string) => void;
  addAnimatingEdge: (edgeId: string, requestId: string, animId: string) => void;
  removeAnimatingEdge: (edgeId: string, animId: string) => void;
  setValidationErrors: (errors: string[]) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  isCompleted: false,
  requests: [],
  activeNodes: {},
  animatingEdges: {},
  processedNodes: {},
  metrics: {
    totalRequests: 0,
    completed: 0,
    failed: 0,
    avgLatency: 0,
    minLatency: 0,
    maxLatency: 0,
    cacheHits: 0,
    cacheMisses: 0,
  },
  speed: 1,
  selectedRequestId: null,
  validationErrors: [],

  startSimulation: (nodes, edges) => {
    const errors = GraphBuilder.validate(nodes, edges);
    if (errors.length > 0) {
      set({ validationErrors: errors, isRunning: false });
      return false;
    }

    set({
      validationErrors: [],
      isRunning: true,
      isPaused: false,
      isCompleted: false,
      requests: [],
      activeNodes: {},
      animatingEdges: {},
      processedNodes: {},
      selectedRequestId: null,
      metrics: {
        totalRequests: 0,
        completed: 0,
        failed: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
    });
    return true;
  },

  pauseSimulation: () => {
    set({ isPaused: true });
  },

  resumeSimulation: () => {
    set({ isPaused: false });
  },

  resetSimulation: () => {
    set({
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      requests: [],
      activeNodes: {},
      animatingEdges: {},
      processedNodes: {},
      selectedRequestId: null,
      validationErrors: [],
    });
  },

  completeSimulation: () => {
    set({
      isCompleted: true,
      isPaused: false,
    });
  },

  setSpeed: (speed) => {
    set({ speed });
  },

  setSelectedRequestId: (selectedRequestId) => {
    set({ selectedRequestId });
  },

  setRequests: (requests) => {
    set({ requests });
  },

  updateRequest: (requestId, updates) => {
    const { requests, metrics } = get();
    const updatedRequests = requests.map((req) => {
      if (req.id === requestId) {
        const nextReq = { ...req, ...updates };
        
        // If request status transitions to completed or failed, update stats
        if (req.status !== nextReq.status && (nextReq.status === RequestState.COMPLETED || nextReq.status === RequestState.FAILED)) {
          const isCompleted = nextReq.status === RequestState.COMPLETED;
          const nextCompleted = isCompleted ? metrics.completed + 1 : metrics.completed;
          const nextFailed = !isCompleted ? metrics.failed + 1 : metrics.failed;
          const lat = nextReq.latency || 0;
          
          let nextMin = metrics.minLatency;
          let nextMax = metrics.maxLatency;
          let nextAvg = metrics.avgLatency;

          if (isCompleted) {
            nextMin = nextMin === 0 ? lat : Math.min(nextMin, lat);
            nextMax = Math.max(nextMax, lat);
            const totalCompletedCount = nextCompleted;
            nextAvg = Math.round(
              ((metrics.avgLatency * (totalCompletedCount - 1)) + lat) / totalCompletedCount
            );
          }

          // Compute cache hit ratios
          let nextHits = metrics.cacheHits;
          let nextMisses = metrics.cacheMisses;
          
          const logStr = nextReq.logs.map((l: any) => l.event).join(', ');
          if (logStr.includes("Cache Hit")) {
            nextHits += 1;
          } else if (logStr.includes("Cache Miss")) {
            nextMisses += 1;
          }

          set({
            metrics: {
              ...metrics,
              completed: nextCompleted,
              failed: nextFailed,
              minLatency: nextMin,
              maxLatency: nextMax,
              avgLatency: nextAvg,
              cacheHits: nextHits,
              cacheMisses: nextMisses,
            }
          });
        }
        return nextReq;
      }
      return req;
    });

    set({ requests: updatedRequests });
  },

  incrementActiveNode: (nodeId) => {
    set((state) => ({
      activeNodes: {
        ...state.activeNodes,
        [nodeId]: (state.activeNodes[nodeId] || 0) + 1,
      },
    }));
  },

  decrementActiveNode: (nodeId) => {
    set((state) => ({
      activeNodes: {
        ...state.activeNodes,
        [nodeId]: Math.max(0, (state.activeNodes[nodeId] || 0) - 1),
      },
    }));
  },

  incrementProcessedNode: (nodeId) => {
    set((state) => ({
      processedNodes: {
        ...state.processedNodes,
        [nodeId]: (state.processedNodes[nodeId] || 0) + 1,
      },
    }));
  },

  addAnimatingEdge: (edgeId, requestId, animId) => {
    set((state) => {
      const edgeAnims = state.animatingEdges[edgeId] || [];
      return {
        animatingEdges: {
          ...state.animatingEdges,
          [edgeId]: [...edgeAnims, { id: animId, requestId }],
        },
      };
    });
  },

  removeAnimatingEdge: (edgeId, animId) => {
    set((state) => {
      const edgeAnims = state.animatingEdges[edgeId] || [];
      return {
        animatingEdges: {
          ...state.animatingEdges,
          [edgeId]: edgeAnims.filter((anim) => anim.id !== animId),
        },
      };
    });
  },

  setValidationErrors: (validationErrors) => {
    set({ validationErrors });
  },
}));
