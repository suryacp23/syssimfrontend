import { NodeMetricsSummary, AggregateMetrics } from '@/store/metricsStore';

export interface PerformanceRecommendation {
  nodeId: string;
  nodeName: string;
  issue: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
}

export class PerformanceAnalyzer {
  public analyze(nodeMetrics: Record<string, NodeMetricsSummary>, metrics: AggregateMetrics): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Generate recommendations for Queue Drops (Bottlenecks)
    Object.values(nodeMetrics).forEach((data) => {
      if (data.dropped > 0) {
        recommendations.push({
          nodeId: data.nodeId,
          nodeName: data.nodeName,
          issue: `Queue overflow: ${data.dropped} requests dropped due to resource saturation.`,
          recommendation: `This node is a severe bottleneck. Consider Vertically Scaling to a 'Large' instance, or enabling Auto-Scaling to handle traffic spikes.`,
          severity: 'high'
        });
      }
    });

    // Check hit rate if cache exists
    if (metrics.cacheHitRatio < 40 && metrics.cacheHitRatio > 0) {
      recommendations.push({
        nodeId: 'cache',
        nodeName: 'Global Cache',
        issue: `Low Cache Hit Ratio (${metrics.cacheHitRatio}%).`,
        recommendation: `A low cache hit rate means your database is still taking most of the load. Consider optimizing cache keys or increasing TTL.`,
        severity: 'low'
      });
    }

    return recommendations;
  }
}

export const performanceAnalyzerInstance = new PerformanceAnalyzer();
