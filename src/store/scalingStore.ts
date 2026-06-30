import { create } from 'zustand';
import { TrafficPattern, TrafficPatternType, DEFAULT_TRAFFIC_PATTERN } from '@/simulation/load/TrafficPattern';
import { ScalingPolicy, DEFAULT_SCALING_POLICY } from '@/simulation/load/ScalingPolicy';

export type LoadBalancerAlgo = 'roundRobin' | 'leastConnections' | 'random' | 'weightedRoundRobin';

interface ScalingState {
  // Load generation config
  virtualUsers: number;
  requestsPerVu: number;
  trafficPattern: TrafficPattern;
  loadBalancerAlgo: LoadBalancerAlgo;
  
  // Auto-scaling config
  scalingPolicies: Record<string, ScalingPolicy>; // nodeId -> policy
  nodeReplicas: Record<string, number>; // nodeId -> active instances
  
  // Cost tracking
  estimatedMonthlyCost: number;

  // Actions
  setVirtualUsers: (v: number) => void;
  setRequestsPerVu: (r: number) => void;
  setTrafficPattern: (t: TrafficPattern) => void;
  setLoadBalancerAlgo: (algo: LoadBalancerAlgo) => void;
  setScalingPolicy: (nodeId: string, policy: ScalingPolicy) => void;
  setNodeReplicas: (nodeId: string, count: number) => void;
  setEstimatedMonthlyCost: (cost: number) => void;
  resetScale: () => void;
}

export const useScalingStore = create<ScalingState>((set, get) => ({
  virtualUsers: 100,
  requestsPerVu: 10, // Default 1,000 total requests
  trafficPattern: DEFAULT_TRAFFIC_PATTERN,
  loadBalancerAlgo: 'roundRobin',
  
  scalingPolicies: {},
  nodeReplicas: {},
  estimatedMonthlyCost: 0,

  setVirtualUsers: (v) => set({ virtualUsers: v }),
  setRequestsPerVu: (r) => set({ requestsPerVu: r }),
  setTrafficPattern: (t) => set({ trafficPattern: t }),
  setLoadBalancerAlgo: (algo) => set({ loadBalancerAlgo: algo }),
  setScalingPolicy: (nodeId, policy) => set(state => ({
    scalingPolicies: { ...state.scalingPolicies, [nodeId]: policy }
  })),
  setNodeReplicas: (nodeId, count) => set(state => ({
    nodeReplicas: { ...state.nodeReplicas, [nodeId]: count }
  })),
  setEstimatedMonthlyCost: (cost) => set({ estimatedMonthlyCost: cost }),
  
  resetScale: () => set({
    nodeReplicas: {}, // Reset back to 1 for all nodes
    estimatedMonthlyCost: 0
  })
}));
