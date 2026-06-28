import { SystemNode } from '@/store/canvasStore';
import { Edge } from '@xyflow/react';

export interface GraphEdge {
  edgeId: string;
  targetId: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface AdjacencyList {
  [nodeId: string]: {
    node: SystemNode;
    outgoing: GraphEdge[];
    incoming: string[];
  };
}

export const GraphBuilder = {
  build: (nodes: SystemNode[], edges: Edge[]): AdjacencyList => {
    const graph: AdjacencyList = {};

    // Initialize list
    for (const node of nodes) {
      graph[node.id] = {
        node,
        outgoing: [],
        incoming: [],
      };
    }

    // Populate edges
    for (const edge of edges) {
      if (graph[edge.source] && graph[edge.target]) {
        graph[edge.source].outgoing.push({
          edgeId: edge.id,
          targetId: edge.target,
          sourceHandle: edge.sourceHandle || 'bottom',
          targetHandle: edge.targetHandle || 'top',
        });
        graph[edge.target].incoming.push(edge.source);
      }
    }

    return graph;
  },

  validate: (nodes: SystemNode[], edges: Edge[]): string[] => {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push("The architecture diagram is empty. Drop some components onto the canvas first!");
      return errors;
    }

    const clientNodes = nodes.filter(n => n.data?.type === 'client');
    const apiNodes = nodes.filter(n => n.data?.type === 'api');

    // 1. One Client check
    if (clientNodes.length === 0) {
      errors.push("Missing Client: Add exactly one Client component to trigger requests.");
    } else if (clientNodes.length > 1) {
      errors.push(`Too many Clients: Only 1 Client is allowed, but found ${clientNodes.length}.`);
    }

    // 2. At least one API Server check
    if (apiNodes.length === 0) {
      errors.push("Missing API: Add at least one API Server component to route requests.");
    }

    // If client is missing, we cannot run reachability check, so exit early
    if (clientNodes.length !== 1) {
      return errors;
    }

    const client = clientNodes[0];

    // 3. Isolated node check
    for (const node of nodes) {
      const isConnected = edges.some(e => e.source === node.id || e.target === node.id);
      if (!isConnected && nodes.length > 1) {
        errors.push(`Disconnected component: "${node.data?.label || 'Node'}" is isolated. Connect it to the diagram.`);
      }
    }

    // 4. Reachability from Client
    const reachable = new Set<string>();
    const queue: string[] = [client.id];
    reachable.add(client.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const outgoingTargets = edges
        .filter(e => e.source === current)
        .map(e => e.target);

      for (const target of outgoingTargets) {
        if (!reachable.has(target)) {
          reachable.add(target);
          queue.push(target);
        }
      }
    }

    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        errors.push(`Unreachable component: "${node.data?.label || 'Node'}" cannot be reached from the Client.`);
      }
    }

    return errors;
  }
};
