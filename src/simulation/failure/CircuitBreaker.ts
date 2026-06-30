export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private static readonly FAILURE_THRESHOLD = 3;
  private static readonly RESET_TIMEOUT = 5000; // ms of virtual time

  private failures: Record<string, number> = {};
  private states: Record<string, CircuitState> = {};
  private lastFailureTime: Record<string, number> = {};

  public reset() {
    this.failures = {};
    this.states = {};
    this.lastFailureTime = {};
  }

  public recordSuccess(nodeId: string) {
    if (this.states[nodeId] === 'HALF_OPEN') {
      this.states[nodeId] = 'CLOSED';
      this.failures[nodeId] = 0;
    } else if (this.states[nodeId] === 'CLOSED') {
      this.failures[nodeId] = 0;
    }
  }

  public recordFailure(nodeId: string, virtualTime: number) {
    const currentFailures = (this.failures[nodeId] || 0) + 1;
    this.failures[nodeId] = currentFailures;
    this.lastFailureTime[nodeId] = virtualTime;

    if (currentFailures >= CircuitBreaker.FAILURE_THRESHOLD && this.states[nodeId] !== 'OPEN') {
      this.states[nodeId] = 'OPEN';
      return true; // Tripped just now
    }
    return false;
  }

  public isOpen(nodeId: string, virtualTime: number): boolean {
    const state = this.states[nodeId] || 'CLOSED';

    if (state === 'OPEN') {
      const lastFail = this.lastFailureTime[nodeId] || 0;
      if (virtualTime - lastFail >= CircuitBreaker.RESET_TIMEOUT) {
        this.states[nodeId] = 'HALF_OPEN';
        return false; // Let one through
      }
      return true; // Still open
    }

    if (state === 'HALF_OPEN') {
      // In half open, usually you let a restricted number of requests. We'll let one pass and see if it succeeds.
      return false; 
    }

    return false; // CLOSED
  }
}

export const circuitBreakerInstance = new CircuitBreaker();
