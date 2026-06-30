export class ThroughputCalculator {
  private completionsPerSecond: Record<number, number> = {};
  private peak: number = 0;

  public registerCompletion(virtualTimeMs: number) {
    const second = Math.floor(virtualTimeMs / 1000);
    this.completionsPerSecond[second] = (this.completionsPerSecond[second] || 0) + 1;
    if (this.completionsPerSecond[second] > this.peak) {
      this.peak = this.completionsPerSecond[second];
    }
  }

  public getThroughputMetrics(completedCount: number, elapsedSeconds: number) {
    const currentSecond = Math.max(0, Math.floor(elapsedSeconds));
    const current = this.completionsPerSecond[currentSecond] || 0;
    const average = elapsedSeconds > 0 
      ? parseFloat((completedCount / elapsedSeconds).toFixed(1))
      : 0;

    return {
      current,
      average,
      peak: this.peak,
    };
  }

  public getCompletionsAtSecond(second: number): number {
    return this.completionsPerSecond[second] || 0;
  }

  public reset() {
    this.completionsPerSecond = {};
    this.peak = 0;
  }
}
