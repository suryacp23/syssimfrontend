export class RetryPolicy {
  private retries: Record<string, number> = {};

  public reset() {
    this.retries = {};
  }

  public getRetryCount(requestId: string): number {
    return this.retries[requestId] || 0;
  }

  public incrementRetry(requestId: string): number {
    const current = this.getRetryCount(requestId) + 1;
    this.retries[requestId] = current;
    return current;
  }

  // Calculate exponential backoff: base * 2^retry
  public getBackoffMs(retryAttempt: number): number {
    const baseDelay = 100; // 100ms base virtual time
    return baseDelay * Math.pow(2, retryAttempt - 1);
  }
}

export const retryPolicyInstance = new RetryPolicy();
