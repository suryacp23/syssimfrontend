export type SystemNodeType = 'client' | 'api' | 'database' | 'redis' | 'queue' | 'loadBalancer';

export interface SystemNodeData extends Record<string, unknown> {
  label: string;
  width?: number;
  height?: number;
  icon?: string;
  type: SystemNodeType;
}
