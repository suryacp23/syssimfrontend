import { TrafficPattern } from '../simulation/load/TrafficPattern';
import { SimEvent } from '../simulation/types/Event';

self.onmessage = (e: MessageEvent) => {
  const { virtualUsers, requestsPerVu, pattern, clientNodeId } = e.data as {
    virtualUsers: number;
    requestsPerVu: number;
    pattern: TrafficPattern;
    clientNodeId: string;
  };

  try {
    const events: SimEvent[] = [];
    const totalRequests = virtualUsers * requestsPerVu;
    const progressThreshold = Math.max(1000, Math.floor(totalRequests / 10));
    let reqIndex = 0;

    for (let vu = 0; vu < virtualUsers; vu++) {
      let timeCursor = 0; 

      for (let req = 0; req < requestsPerVu; req++) {
        let delay = 0;

        switch (pattern.type) {
          case 'constant':
            // 3 seconds delay between requests
            delay = 3000;
            break;
          case 'rampUp':
            const duration = pattern.rampUpDurationMs || 10000;
            const progress = req / requestsPerVu;
            // Delay decreases as progress increases
            delay = (duration / requestsPerVu) * (1 - progress + 0.1); 
            break;
          case 'spike':
            // Spike in the middle of this VU's execution
            const isSpike = req > (requestsPerVu * 0.4) && req < (requestsPerVu * 0.6);
            delay = isSpike ? 20 : 1000; // 20ms delay in spike, 1000ms normally
            break;
          case 'wave':
            const baseDelay = 500;
            const amplitude = 400;
            delay = baseDelay + amplitude * Math.sin((req / requestsPerVu) * Math.PI * 4);
            break;
        }

        events.push({
          id: `evt-start-req-${reqIndex}`,
          time: timeCursor,
          type: 'REQUEST_START',
          requestId: `VU-${vu + 1}-Req-${reqIndex + 1}`,
          nodeId: clientNodeId
        });
        
        timeCursor += delay;
        reqIndex++;

        // Report progress back to the main thread
        if (reqIndex % progressThreshold === 0) {
          self.postMessage({ type: 'PROGRESS', generatedCount: reqIndex, totalCount: totalRequests, vuIndex: vu });
        }
      }
    }

    // Return the generated events back to the main thread
    self.postMessage({ type: 'SUCCESS', events });
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', message: error.message });
  }
};
