import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';

interface RequestsChartProps {
  completed: number;
  failed: number;
  active: number;
}

export function RequestsChart({ completed, failed, active }: RequestsChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const total = completed + failed + active;

  const data = [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'Failed', value: failed, color: '#ef4444' },
    { name: 'Active', value: active, color: '#3b82f6' },
  ];

  return (
    <div className="w-full h-full flex flex-col p-4 bg-muted/10 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
      <div className="mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request Breakdown</h3>
        <p className="text-[10px] text-muted-foreground/80">Status of all requests in execution</p>
      </div>
      
      <div className="flex-1 min-h-0 w-full text-[10px] font-mono select-none flex items-center justify-center">
        {!mounted ? (
          <div className="w-full h-full min-h-[180px] bg-muted/20 animate-pulse rounded-xl" />
        ) : total === 0 ? (
          <div className="text-sm text-muted-foreground/60 p-4 text-center">
            No active requests running
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
            <XAxis type="number" stroke="currentColor" className="text-muted-foreground/80" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="currentColor" 
              className="text-muted-foreground/85 font-semibold text-[10px]" 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                fontSize: '11px',
                color: 'var(--foreground)',
              }}
            />
            <Bar isAnimationActive={false} dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
