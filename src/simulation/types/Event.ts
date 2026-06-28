export interface SimEvent {
  id: string;
  time: number;
  type: 'REQUEST_START' | 'NODE_ARRIVE' | 'NODE_COMPLETE' | 'EDGE_TRAVEL';
  requestId: string;
  nodeId?: string;
  edgeId?: string;
  targetNodeId?: string;
  data?: any;
}
