import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesDataPoint } from '@/store/metricsStore';

interface ThroughputChartProps {
  data: TimeSeriesDataPoint[];
}

export function ThroughputChart({ data }: ThroughputChartProps) {
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Throughput Timeline</h3>
        <p className="text-[10px] text-muted-foreground/80">Requests completed per second (rps)</p>
      </div>
      <div className="flex-1 min-h-0 w-full text-[10px] font-mono select-none flex items-center justify-center">
        {!mounted ? (
          <div className="w-full h-full min-h-[200px] bg-muted/20 animate-pulse rounded-xl" />
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-foreground/60 p-4 text-center">
            No active throughput metrics available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={240}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
              unit=" rps"
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
              name="Throughput"
              type="monotone" 
              dataKey="throughput" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTput)" 
            />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
