export type ScalingMetric = 'cpu' | 'queue' | 'latency';

export interface ScalingPolicy {
  id: string;
  enabled: boolean;
  metric: ScalingMetric;
  threshold: number; // e.g. 70 for 70%, or 100 for queue size
  minReplicas: number;
  maxReplicas: number;
  scaleOutCooldownMs: number;
  scaleInCooldownMs: number;
}

export const DEFAULT_SCALING_POLICY: ScalingPolicy = {
  id: 'default',
  enabled: false,
  metric: 'cpu',
  threshold: 70,
  minReplicas: 1,
  maxReplicas: 5,
  scaleOutCooldownMs: 5000,
  scaleInCooldownMs: 5000,
};
