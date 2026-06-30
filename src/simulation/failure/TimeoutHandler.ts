import { useFailureStore } from '@/store/failureStore';

export class TimeoutHandler {
  public static isTimeout(latency: number): boolean {
    const config = useFailureStore.getState().config;
    // We treat 5000 as effectively 'no timeout' for this simulation scale unless exceeded
    if (config.timeout <= 0) return false;
    return latency > config.timeout;
  }
}
