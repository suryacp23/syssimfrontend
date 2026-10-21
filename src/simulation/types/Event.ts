export interface SimEvent {
  id: string;
  time: number;
  type: 
    | 'REQUEST_START' | 'NODE_ARRIVE' | 'NODE_COMPLETE' | 'EDGE_TRAVEL' // Legacy
    | 'REQUEST_CREATED' 
    | 'NODE_RECEIVED' 
    | 'QUEUED' 
    | 'THREAD_ASSIGNED' 
    | 'CPU_ASSIGNED' 
    | 'CPU_RELEASED' 
    | 'CACHE_HIT' 
    | 'CACHE_MISS' 
    | 'DB_CONNECTION_ACQUIRED' 
    | 'DB_CONNECTION_RELEASED' 
    | 'NETWORK_TRAVEL' 
    | 'REQUEST_COMPLETED' 
    | 'REQUEST_FAILED';
  requestId: string;
  nodeId?: string;
  edgeId?: string;
  targetNodeId?: string;
  data?: any;
}
