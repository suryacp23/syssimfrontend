import { create } from 'zustand';

export interface FailureConfig {
  serverCrash: boolean;
  databaseDown: boolean;
  redisDown: boolean;
  queueFailure: boolean;
  kafkaFailure: boolean;
  packetLoss: number;
  networkDelay: number;
  timeout: number;
  retryCount: number;
  circuitBreakerEnabled: boolean;
  cpuOverload: boolean;
}

export type NodeHealthStatus = 'healthy' | 'slow' | 'degraded' | 'unavailable';

interface FailureState {
  config: FailureConfig;
  healthStatus: Record<string, NodeHealthStatus>;
  
  setConfig: (config: Partial<FailureConfig>) => void;
  setNodeHealth: (nodeId: string, status: NodeHealthStatus) => void;
  resetFailures: () => void;
}

const defaultConfig: FailureConfig = {
  serverCrash: false,
  databaseDown: false,
  redisDown: false,
  queueFailure: false,
  kafkaFailure: false,
  packetLoss: 0,
  networkDelay: 0,
  timeout: 5000, // Default timeout 5s (practically disabled)
  retryCount: 0,
  circuitBreakerEnabled: false,
  cpuOverload: false,
};

export const useFailureStore = create<FailureState>((set) => ({
  config: { ...defaultConfig },
  healthStatus: {},

  setConfig: (updates) => set((state) => ({
    config: { ...state.config, ...updates }
  })),

  setNodeHealth: (nodeId, status) => set((state) => ({
    healthStatus: {
      ...state.healthStatus,
      [nodeId]: status
    }
  })),

  resetFailures: () => set({
    config: { ...defaultConfig },
    healthStatus: {}
  })
}));
