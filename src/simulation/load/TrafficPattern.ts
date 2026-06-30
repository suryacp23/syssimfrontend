export type TrafficPatternType = 'constant' | 'rampUp' | 'spike' | 'wave';

export interface TrafficPattern {
  type: TrafficPatternType;
  rampUpDurationMs?: number; // Used for rampUp
  spikeIntervalMs?: number;  // Used for spike
  wavePeriodMs?: number;     // Used for wave
}

export const DEFAULT_TRAFFIC_PATTERN: TrafficPattern = {
  type: 'constant',
};
