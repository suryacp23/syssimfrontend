import { Node, Edge } from '@xyflow/react';
import { SystemNodeData } from './node';

export interface DiagramData {
  nodes: Node<SystemNodeData>[];
  edges: Edge[];
}
