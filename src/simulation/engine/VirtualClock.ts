export class VirtualClock {
  private time: number = 0;

  public now(): number {
    return this.time;
  }

  public advance(delta: number): void {
    if (delta > 0) {
      this.time += delta;
    }
  }

  public reset(): void {
    this.time = 0;
  }
}
