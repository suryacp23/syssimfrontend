import React from 'react';
import { useFailureStore } from '@/store/failureStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Activity, ServerCrash, Database, Box, Server, Skull, ShieldAlert, Cpu } from 'lucide-react';

export function FailurePanel() {
  const { config, setConfig } = useFailureStore();

  return (
    <div className="bg-background/95 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl w-[280px] flex flex-col backdrop-blur-md">
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <Activity className="w-4 h-4 text-rose-500" />
        <h3 className="font-bold text-sm">Failure Controls</h3>
      </div>
      
      <div className="p-4 flex flex-col gap-5 overflow-y-auto max-h-[60vh] scrollbar-thin">
        
        {/* Component Failures */}
        <div className="flex flex-col gap-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Component Outages</Label>
          <div className="flex items-center justify-between">
            <Label htmlFor="serverCrash" className="flex items-center gap-2 text-sm cursor-pointer">
              <ServerCrash className="w-4 h-4 text-rose-500" /> Crash API Server
            </Label>
            <Switch 
              id="serverCrash" 
              checked={config.serverCrash} 
              onCheckedChange={(v: boolean) => setConfig({ serverCrash: v })} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="dbDown" className="flex items-center gap-2 text-sm cursor-pointer">
              <Database className="w-4 h-4 text-indigo-500" /> Database Down
            </Label>
            <Switch 
              id="dbDown" 
              checked={config.databaseDown} 
              onCheckedChange={(v: boolean) => setConfig({ databaseDown: v })} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="redisDown" className="flex items-center gap-2 text-sm cursor-pointer">
              <Box className="w-4 h-4 text-red-500" /> Redis Down
            </Label>
            <Switch 
              id="redisDown" 
              checked={config.redisDown} 
              onCheckedChange={(v: boolean) => setConfig({ redisDown: v })} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="queueFail" className="flex items-center gap-2 text-sm cursor-pointer">
              <Server className="w-4 h-4 text-orange-500" /> Queue Failure
            </Label>
            <Switch 
              id="queueFail" 
              checked={config.queueFailure} 
              onCheckedChange={(v: boolean) => setConfig({ queueFailure: v })} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="kafkaFail" className="flex items-center gap-2 text-sm cursor-pointer">
              <Activity className="w-4 h-4 text-green-500" /> Kafka Failure
            </Label>
            <Switch 
              id="kafkaFail" 
              checked={config.kafkaFailure} 
              onCheckedChange={(v: boolean) => setConfig({ kafkaFailure: v })} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cpuOverload" className="flex items-center gap-2 text-sm cursor-pointer">
              <Cpu className="w-4 h-4 text-yellow-500" /> CPU Overload
            </Label>
            <Switch 
              id="cpuOverload" 
              checked={config.cpuOverload} 
              onCheckedChange={(v: boolean) => setConfig({ cpuOverload: v })} 
            />
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* Network Failures */}
        <div className="flex flex-col gap-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Network & Chaos</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Network Delay</Label>
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{config.networkDelay}ms</span>
            </div>
            <Slider 
              value={[config.networkDelay]} 
              max={1000} 
              step={50} 
              onValueChange={(v: number | readonly number[]) => setConfig({ networkDelay: Array.isArray(v) ? v[0] : (v as number) })} 
            />
          </div>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-muted-foreground" /> Packet Loss
              </Label>
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{config.packetLoss}%</span>
            </div>
            <Slider 
              value={[config.packetLoss]} 
              max={100} 
              step={5} 
              onValueChange={(v: number | readonly number[]) => setConfig({ packetLoss: Array.isArray(v) ? v[0] : (v as number) })} 
            />
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* Resilience Policies */}
        <div className="flex flex-col gap-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resilience Policies</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="circuitBreaker" className="flex items-center gap-2 text-sm cursor-pointer">
              <ShieldAlert className="w-4 h-4 text-emerald-500" /> Circuit Breaker
            </Label>
            <Switch 
              id="circuitBreaker" 
              checked={config.circuitBreakerEnabled} 
              onCheckedChange={(v: boolean) => setConfig({ circuitBreakerEnabled: v })} 
            />
          </div>

          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Timeout</Label>
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{config.timeout}ms</span>
            </div>
            <Slider 
              value={[config.timeout]} 
              max={5000} 
              step={100} 
              onValueChange={(v: number | readonly number[]) => setConfig({ timeout: Array.isArray(v) ? v[0] : (v as number) })} 
            />
          </div>

          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Retries (w/ Backoff)</Label>
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{config.retryCount}</span>
            </div>
            <Slider 
              value={[config.retryCount]} 
              max={5} 
              step={1} 
              onValueChange={(v: number | readonly number[]) => setConfig({ retryCount: Array.isArray(v) ? v[0] : (v as number) })} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}
