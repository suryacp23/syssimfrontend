export type SystemNodeType = 'client' | 'api' | 'database' | 'redis' | 'queue' | 'loadBalancer' | 'kafka' | 'cdn';

export type InstanceSize = 'small' | 'medium' | 'large';

export interface SystemNodeData extends Record<string, unknown> {
  label: string;
  width?: number;
  height?: number;
  icon?: string;
  type: SystemNodeType;
  instanceSize?: InstanceSize;
}
