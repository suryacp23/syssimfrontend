import { BaseNode } from '../nodes/BaseNode';

export class NodeRegistry {
  private nodes: Map<string, BaseNode> = new Map();

  public register(node: BaseNode): void {
    this.nodes.set(node.getNodeId(), node);
  }

  public get(id: string): BaseNode | undefined {
    return this.nodes.get(id);
  }

  public getAll(): BaseNode[] {
    return Array.from(this.nodes.values());
  }

  public clear(): void {
    this.nodes.clear();
  }
}
