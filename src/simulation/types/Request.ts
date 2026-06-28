export interface SimRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentNodeId: string | null;
  path: string[];
  latency: number;
  startTime: number;
  endTime?: number;
  log: string[];
}
