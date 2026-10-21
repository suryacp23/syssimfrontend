import { SimRequest, RequestLog } from './SimRequest';
import { useSimulationStore } from '@/store/simulationStore';

export class RequestLogger {
  public static append(
    request: SimRequest, 
    timestamp: number, 
    nodeId: string, 
    event: string, 
    duration?: number, 
    metadata?: Record<string, any>
  ): void {
    const log: RequestLog = {
      timestamp,
      nodeId,
      event,
      duration,
      metadata
    };
    
    request.logs.push(log);
    
    // Sync to UI store immediately if it's visible
    if (request.isUIVisible) {
      useSimulationStore.getState().updateRequest(request.id, {
        logs: [...request.logs]
      });
    }
  }
}
