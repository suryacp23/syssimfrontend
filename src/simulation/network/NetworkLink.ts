import { SimEvent } from '../types/Event';
import { SimRequest } from '../request/SimRequest';
import { SimulationEngine } from '../engine/SimulationEngine';

export class NetworkLink {
  private linkId: string;
  private sourceNodeId: string;
  private targetNodeId: string;
  private engine: SimulationEngine;

  // These properties would ideally be fetched from the global config or edge data
  private travelLatencyMs: number = 400; // default from current Simulator
  private packetLossProbability: number = 0;

  constructor(linkId: string, sourceNodeId: string, targetNodeId: string, engine: SimulationEngine) {
    this.linkId = linkId;
    this.sourceNodeId = sourceNodeId;
    this.targetNodeId = targetNodeId;
    this.engine = engine;
  }

  public getTargetNodeId(): string {
    return this.targetNodeId;
  }

  public transmit(request: SimRequest): void {
    // Check for packet loss
    if (Math.random() < this.packetLossProbability) {
      this.engine.handleRequestFailure(request, 'Network', `Packet lost in transit on link ${this.linkId}`);
      return;
    }

    // Schedule arrival event
    const arrivalTime = this.engine.getVirtualTime() + this.travelLatencyMs;
    
    // Add UI Edge Travel Animation
    this.engine.startEdgeAnimation(this.linkId, request.id, arrivalTime);

    this.engine.scheduleEvent({
      id: `evt-arrive-${request.id}-${this.targetNodeId}-${arrivalTime}`,
      time: arrivalTime,
      type: 'NODE_ARRIVE', // We map this to NODE_RECEIVED in the new architecture, but keeping NODE_ARRIVE for compatibility during transition
      requestId: request.id,
      nodeId: this.targetNodeId,
    });
  }
}
