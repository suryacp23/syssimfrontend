import { SimEvent } from '../types/Event';
import { TrafficPattern } from '../load/TrafficPattern';

export class RequestGenerator {
  public static generateEvents(
    virtualUsers: number, 
    requestsPerVu: number, 
    pattern: TrafficPattern,
    clientNodeId: string
  ): SimEvent[] {
    const events: SimEvent[] = [];
    const totalRequests = virtualUsers * requestsPerVu;
    let timeAcc = 0;

    for (let i = 0; i < totalRequests; i++) {
      const vuId = i % virtualUsers;
      const id = `req-${vuId}-${Date.now()}-${i}`;
      
      let delay = 0;
      if (pattern.type === 'constant') {
        delay = 1000 / (1000 / (pattern.rampUpDurationMs || 1000));
      } else if (pattern.type === 'spike') {
        delay = i % (1000 / (pattern.rampUpDurationMs || 1000)) === 0 ? 1000 : 10;
      } else if (pattern.type === 'rampUp') {
        delay = 1000 / ((1000 / (pattern.rampUpDurationMs || 1000)) * (i / totalRequests + 0.1));
      } else if (pattern.type === 'wave') {
        delay = Math.random() * (2000 / (1000 / (pattern.rampUpDurationMs || 1000)));
      } else {
        delay = 1000 / (1000 / (pattern.rampUpDurationMs || 1000));
      }

      timeAcc += delay;
      
      events.push({
        id: `evt-start-${id}`,
        time: timeAcc,
        type: 'REQUEST_CREATED',
        requestId: id,
        nodeId: clientNodeId,
      });
    }

    return events;
  }
}
