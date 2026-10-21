import { SimRequest } from './SimRequest';
import { RequestState } from './RequestState';

export class RequestFactory {
  public static create(id: string, virtualTime: number, isUIVisible: boolean = true): SimRequest {
    return {
      id,
      status: RequestState.CREATED,
      createdAt: virtualTime,
      startedAt: 0,
      completedAt: null,
      currentNode: null,
      nextNode: null,
      path: [],
      latency: 0,
      cpuTime: 0,
      queueTime: 0,
      networkTime: 0,
      databaseTime: 0,
      cacheHit: false,
      retryCount: 0,
      logs: [],
      isUIVisible
    };
  }
}
