import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CacheChartProps {
  hits: number;
  misses: number;
}

export function CacheChart({ hits, misses }: CacheChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const total = hits + misses;
  const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;

  const data = [
    { name: 'Cache Hit', value: hits, color: '#3b82f6' },
    { name: 'Cache Miss', value: misses, color: '#ef4444' }, // Red-ish/Orange-ish miss indicator
  ];

  return (
    <div className="w-full h-full flex flex-col p-4 bg-muted/10 border border-zinc-200 dark:border-zinc-800 rounded-2xl relative">
      <div className="mb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cache Performance</h3>
        <p className="text-[10px] text-muted-foreground/80">Redis hit vs miss ratio</p>
      </div>
      
      <div className="flex-1 min-h-0 w-full relative flex items-center justify-center text-[10px] font-mono select-none">
        {!mounted ? (
          <div className="w-full h-full min-h-[180px] bg-muted/20 animate-pulse rounded-xl" />
        ) : total === 0 ? (
          <div className="text-sm text-muted-foreground/60 p-4 text-center">
            No cache operations recorded
          </div>
        ) : (
          <>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none mt-[-10px]">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{hitRate}%</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Hit Ratio</span>
            </div>

            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <PieChart>
              <Pie
                isAnimationActive={false}
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: 'var(--foreground)',
                }}
              />
              <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={8} />
            </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
