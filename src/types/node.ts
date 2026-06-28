export type SystemNodeType = 'client' | 'api' | 'database' | 'redis' | 'queue' | 'loadBalancer';

export interface SystemNodeData {
  label: string;
  width?: number;
  height?: number;
  icon?: string;
  type: SystemNodeType;
}
