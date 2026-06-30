export class LatencyCalculator {
  public static calculate(latencies: number[]) {
    if (latencies.length === 0) {
      return {
        average: 0,
        minimum: 0,
        maximum: 0,
        median: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const count = sorted.length;

    const average = Math.round(sum / count);
    const minimum = sorted[0];
    const maximum = sorted[count - 1];
    
    // Percentile helper
    const getPercentile = (p: number) => {
      const idx = Math.ceil((p / 100) * count) - 1;
      return sorted[Math.max(0, idx)];
    };

    const median = getPercentile(50);
    const p95 = getPercentile(95);
    const p99 = getPercentile(99);

    return {
      average,
      minimum,
      maximum,
      median,
      p95,
      p99,
    };
  }
}
