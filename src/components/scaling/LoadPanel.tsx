import React from 'react';
import { useScalingStore } from '@/store/scalingStore';
import { useCanvasStore } from '@/store/canvasStore';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Activity, Users, Settings2, ShieldCheck, Database, Server } from 'lucide-react';
import { TrafficPatternType } from '@/simulation/load/TrafficPattern';
import { ScalingPolicy, DEFAULT_SCALING_POLICY } from '@/simulation/load/ScalingPolicy';

export function LoadPanel() {
  const { 
    virtualUsers, setVirtualUsers,
    requestsPerVu, setRequestsPerVu,
    trafficPattern, setTrafficPattern,
    loadBalancerAlgo, setLoadBalancerAlgo,
    scalingPolicies, setScalingPolicy
  } = useScalingStore();

  const { activeProjectId, projects } = useCanvasStore();
  const nodes = activeProjectId ? projects[activeProjectId]?.nodes || [] : [];
  
  const [tab, setTab] = React.useState<'load' | 'scaling'>('load');

  // Find scalable nodes (API, DB, Redis, Queue, Kafka)
  const scalableNodes = nodes.filter(n => 
    ['api', 'database', 'redis', 'queue', 'kafka'].includes(n.data?.type as string)
  );

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[480px] bg-background/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl overflow-hidden z-20">
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
          <Activity className="w-4 h-4 text-emerald-500" />
          Load & Scaling Settings
        </div>
        <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5 rounded-lg">
          <button 
            onClick={() => setTab('load')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${tab === 'load' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Load
          </button>
          <button 
            onClick={() => setTab('scaling')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${tab === 'scaling' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Auto-Scaling
          </button>
        </div>
      </div>

      <div className="p-4 max-h-[400px] overflow-y-auto">
        {tab === 'load' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Virtual Users (VUs)
                </label>
                <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                  {virtualUsers}
                </span>
              </div>
              <Slider
                value={[virtualUsers]}
                min={1}
                max={5000}
                step={10}
                onValueChange={(v) => setVirtualUsers(typeof v === 'number' ? v : v[0])}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  Requests per VU
                </label>
                <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                  {requestsPerVu}
                </span>
              </div>
              <Slider
                value={[requestsPerVu]}
                min={1}
                max={100}
                step={1}
                onValueChange={(v) => setRequestsPerVu(typeof v === 'number' ? v : v[0])}
                className="w-full"
              />
              <p className="text-[10px] text-zinc-500">
                Total generated requests: {(virtualUsers * requestsPerVu).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Traffic Pattern</label>
              <div className="grid grid-cols-2 gap-2">
                {(['constant', 'rampUp', 'spike', 'wave'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setTrafficPattern({ ...trafficPattern, type })}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors capitalize
                      ${trafficPattern.type === type 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Load Balancer Algorithm</label>
              <select 
                value={loadBalancerAlgo} 
                onChange={(e) => setLoadBalancerAlgo(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-zinc-200 dark:border-zinc-800 outline-none focus:border-emerald-500"
              >
                <option value="roundRobin">Round Robin</option>
                <option value="leastConnections">Least Connections</option>
                <option value="random">Random</option>
                <option value="weightedRoundRobin">Weighted Round Robin</option>
              </select>
            </div>
          </div>
        )}

        {tab === 'scaling' && (
          <div className="space-y-4">
            {scalableNodes.map(node => {
              const policy = scalingPolicies[node.id] || { ...DEFAULT_SCALING_POLICY, id: node.id };
              
              return (
                <div key={node.id} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold">{node.data?.label || node.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {node.data?.type}
                      </span>
                    </div>
                    <Switch 
                      checked={policy.enabled} 
                      onCheckedChange={(c) => setScalingPolicy(node.id, { ...policy, enabled: !!c })}
                    />
                  </div>
                  
                  {policy.enabled && (
                    <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-zinc-500">Metric</label>
                          <select 
                            value={policy.metric}
                            onChange={(e) => setScalingPolicy(node.id, { ...policy, metric: e.target.value as any })}
                            className="w-full px-2 py-1.5 rounded-md text-xs bg-background border border-zinc-200 dark:border-zinc-800"
                          >
                            <option value="cpu">CPU Utilization %</option>
                            <option value="queue">Queue Depth</option>
                          </select>
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-zinc-500">Threshold</label>
                          <input 
                            type="number" 
                            value={policy.threshold}
                            onChange={(e) => setScalingPolicy(node.id, { ...policy, threshold: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded-md text-xs bg-background border border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-zinc-500">Min Replicas</label>
                          <input 
                            type="number" 
                            value={policy.minReplicas}
                            min={1}
                            onChange={(e) => setScalingPolicy(node.id, { ...policy, minReplicas: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded-md text-xs bg-background border border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-zinc-500">Max Replicas</label>
                          <input 
                            type="number" 
                            value={policy.maxReplicas}
                            min={2}
                            onChange={(e) => setScalingPolicy(node.id, { ...policy, maxReplicas: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded-md text-xs bg-background border border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {scalableNodes.length === 0 && (
              <div className="text-center py-8 text-sm text-zinc-500">
                No scalable nodes found in the current architecture. Add an API or Database.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
