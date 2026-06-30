import { AdjacencyList } from '../engine/GraphBuilder';
import { useScalingStore } from '@/store/scalingStore';
import { SystemNodeData } from '@/types/node';

const COMPONENT_COSTS: Record<string, number> = {
  client: 0,
  loadBalancer: 15,
  api: 20,
  redis: 15,
  queue: 10,
  database: 40,
  kafka: 50,
  cdn: 5,
};

export class CostCalculator {
  public calculateMonthlyCost(graph: AdjacencyList): number {
    const store = useScalingStore.getState();
    const replicas = store.nodeReplicas;
    
    let totalCost = 0;
    
    Object.values(graph).forEach(({ node }) => {
      const type = node.data?.type as string;
      const baseCost = COMPONENT_COSTS[type] || 0;
      
      const replicaCount = replicas[node.id] || 1;
      const instanceSize = (node.data?.instanceSize as string) || 'small';
      
      const sizeMultiplier = instanceSize === 'large' ? 4 : instanceSize === 'medium' ? 2 : 1;
      
      totalCost += baseCost * replicaCount * sizeMultiplier;
    });
    
    return totalCost;
  }
}

export const costCalculatorInstance = new CostCalculator();
