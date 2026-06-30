import { SimEvent } from '../types/Event';
import { TrafficPattern } from './TrafficPattern';

export class LoadGenerator {
  public static generate(
    virtualUsers: number,
    requestsPerVu: number,
    pattern: TrafficPattern,
    clientNodeId: string
  ): SimEvent[] {
    const events: SimEvent[] = [];
    const totalRequests = virtualUsers * requestsPerVu;
    let timeCursor = 0;

    for (let i = 0; i < totalRequests; i++) {
      let delay = 0;

      switch (pattern.type) {
        case 'constant':
          // Uniformly spread over 10 seconds (10000ms) by default
          delay = (10000 / totalRequests);
          break;
        case 'rampUp':
          // Exponentially decreasing delay (more requests at the end)
          const duration = pattern.rampUpDurationMs || 10000;
          const progress = i / totalRequests;
          // Invert so frequency increases
          delay = (duration / totalRequests) * (1 - progress + 0.1); 
          break;
        case 'spike':
          // Normal traffic, then a massive spike in the middle
          const isSpike = i > (totalRequests * 0.4) && i < (totalRequests * 0.6);
          delay = isSpike ? 2 : 100; // 2ms between reqs during spike, 100ms normal
          break;
        case 'wave':
          // Sinusoidal wave
          const wavePeriod = pattern.wavePeriodMs || 5000;
          const baseDelay = 50;
          const amplitude = 40;
          delay = baseDelay + amplitude * Math.sin((i / totalRequests) * Math.PI * 4);
          break;
      }

      timeCursor += delay;

      events.push({
        id: `evt-start-req-${i}`,
        time: timeCursor,
        type: 'REQUEST_START',
        requestId: `req-${i}`,
        nodeId: clientNodeId,
      });
    }

    return events;
  }
}
