import { InstanceSize } from '@/types/node';

export interface ResourceConfig {
  maxWorkers: number;
  maxQueue: number;
  memoryMb: number;
}

export class NodeResourceManager {
  private activeWorkers: Record<string, number> = {};
  private queueCount: Record<string, number> = {}; 
  private requestQueue: Record<string, string[]> = {}; 

  public init() {
    this.activeWorkers = {};
    this.queueCount = {};
    this.requestQueue = {};
  }

  public getCapacity(nodeType: string, replicas: number = 1, size: InstanceSize = 'small'): ResourceConfig {
    let baseWorkers = 10;
    let baseQueue = 50;
    let baseMemory = 512;

    switch (nodeType) {
      case 'database':
        baseWorkers = 20; 
        baseQueue = 100;
        baseMemory = 2048;
        break;
      case 'redis':
        baseWorkers = 100;
        baseQueue = 500;
        baseMemory = 1024;
        break;
      case 'api':
        baseWorkers = 10;
        baseQueue = 100;
        baseMemory = 512;
        break;
      case 'queue':
      case 'kafka':
        baseWorkers = 500;
        baseQueue = 10000;
        baseMemory = 4096;
        break;
    }

    const sizeMultiplier = size === 'large' ? 4 : size === 'medium' ? 2 : 1;

    return {
      maxWorkers: baseWorkers * replicas * sizeMultiplier,
      maxQueue: baseQueue * replicas * sizeMultiplier,
      memoryMb: baseMemory * replicas * sizeMultiplier,
    };
  }

  public tryAcquire(nodeId: string, capacity: ResourceConfig, requestId: string): 'acquired' | 'queued' | 'dropped' {
    if (!this.activeWorkers[nodeId]) this.activeWorkers[nodeId] = 0;
    if (!this.requestQueue[nodeId]) this.requestQueue[nodeId] = [];

    if (this.activeWorkers[nodeId] < capacity.maxWorkers) {
      this.activeWorkers[nodeId]++;
      return 'acquired';
    }

    if (this.requestQueue[nodeId].length < capacity.maxQueue) {
      this.requestQueue[nodeId].push(requestId);
      return 'queued';
    }

    return 'dropped';
  }

  public release(nodeId: string): string | null {
    if (this.activeWorkers[nodeId] > 0) {
      this.activeWorkers[nodeId]--;
    }

    if (this.requestQueue[nodeId] && this.requestQueue[nodeId].length > 0) {
      const nextRequestId = this.requestQueue[nodeId].shift()!;
      this.activeWorkers[nodeId]++; // Instantly acquire for the next one
      return nextRequestId;
    }

    return null;
  }

  public getStats(nodeId: string, capacity: ResourceConfig) {
    const active = this.activeWorkers[nodeId] || 0;
    const queued = this.requestQueue[nodeId]?.length || 0;
    const cpuUtilization = capacity.maxWorkers > 0 ? (active / capacity.maxWorkers) * 100 : 0;
    
    // Simulate memory: base footprint (10%) + usage proportional to queue and active workers
    const activeMemoryFactor = capacity.maxWorkers > 0 ? (active / capacity.maxWorkers) * 40 : 0;
    const queueMemoryFactor = capacity.maxQueue > 0 ? (queued / capacity.maxQueue) * 50 : 0;
    const memoryUtilization = Math.min(100, 10 + activeMemoryFactor + queueMemoryFactor);
    
    return {
      active,
      queued,
      cpuUtilization: Math.min(100, Math.round(cpuUtilization)),
      memoryUtilization: Math.min(100, Math.round(memoryUtilization)),
      memoryMbUsed: Math.round((capacity.memoryMb * memoryUtilization) / 100)
    };
  }
}

export const resourceManagerInstance = new NodeResourceManager();
