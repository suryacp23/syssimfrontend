import { RequestState } from './RequestState';

export interface RequestLog {
  timestamp: number;
  nodeId: string;
  event: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SimRequest {
  id: string;
  status: RequestState;
  
  // Timing
  createdAt: number;
  startedAt: number;
  completedAt: number | null;
  
  // Tracking
  currentNode: string | null;
  nextNode: string | null;
  path: string[];
  
  // Accumulated Metrics
  latency: number;
  cpuTime: number;
  queueTime: number;
  networkTime: number;
  databaseTime: number;
  
  // State
  cacheHit: boolean;
  retryCount: number;
  
  // Logs
  logs: RequestLog[];

  // UI Support
  isUIVisible: boolean;
}
