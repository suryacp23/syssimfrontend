export class CacheMetricsTracker {
  private hits: number = 0;
  private misses: number = 0;

  public registerHit() {
    this.hits += 1;
  }

  public registerMiss() {
    this.misses += 1;
  }

  public getMetrics() {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? Math.round((this.hits / total) * 100) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio,
    };
  }

  public reset() {
    this.hits = 0;
    this.misses = 0;
  }
}
