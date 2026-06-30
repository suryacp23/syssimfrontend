import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesDataPoint } from '@/store/metricsStore';

interface LatencyChartProps {
  data: TimeSeriesDataPoint[];
}

export function LatencyChart({ data }: LatencyChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const formatXAxis = (tick: number) => {
    return `${tick}s`;
  };

  return (
    <div className="w-full h-full flex flex-col p-4 bg-muted/10 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
      <div className="mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Latency Timeline</h3>
        <p className="text-[10px] text-muted-foreground/80">Average & percentiles (Avg, P95, P99) in milliseconds</p>
      </div>
      <div className="flex-1 min-h-0 w-full text-[10px] font-mono select-none flex items-center justify-center">
        {!mounted ? (
          <div className="w-full h-full min-h-[200px] bg-muted/20 animate-pulse rounded-xl" />
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-foreground/60 p-4 text-center">
            No active latency metrics available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={240}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorP95" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxis} 
              stroke="currentColor" 
              className="text-muted-foreground/80" 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="currentColor" 
              className="text-muted-foreground/80" 
              tickLine={false} 
              axisLine={false} 
              unit="ms"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                fontSize: '11px',
                color: 'var(--foreground)',
              }}
              labelFormatter={(label) => `Virtual Time: ${label}s`}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
            <Area 
              isAnimationActive={false}
              name="Avg Latency"
              type="monotone" 
              dataKey="avgLatency" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorAvg)" 
            />
            <Area 
              isAnimationActive={false}
              name="P95 Latency"
              type="monotone" 
              dataKey="p95Latency" 
              stroke="#f97316" 
              strokeWidth={1.5}
              strokeDasharray="4 2"
              fillOpacity={1} 
              fill="url(#colorP95)" 
            />
            <Area 
              isAnimationActive={false}
              name="P99 Latency"
              type="monotone" 
              dataKey="p99Latency" 
              stroke="#ef4444" 
              strokeWidth={1.5}
              fill="none" 
            />
          </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
