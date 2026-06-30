"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  glowColor?: 'blue' | 'green' | 'red' | 'purple' | 'amber';
}

export function MetricsCard({
  title,
  value,
  unit,
  description,
  icon,
  trend,
  className,
  glowColor = 'blue',
}: MetricsCardProps) {
  const glowClasses = {
    blue: 'border-blue-200 dark:border-blue-900/30 bg-blue-50/10 dark:bg-blue-950/5 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    green: 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/10 dark:bg-emerald-950/5 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    red: 'border-rose-200 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    purple: 'border-purple-200 dark:border-purple-900/30 bg-purple-50/10 dark:bg-purple-950/5 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    amber: 'border-amber-200 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-950/5 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  };

  return (
    <div
      className={cn(
        "p-4 border rounded-2xl flex flex-col justify-between transition-all duration-300",
        glowClasses[glowColor],
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {icon && <div className="text-muted-foreground/80 shrink-0">{icon}</div>}
      </div>

      <div className="mt-2.5 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tracking-tight text-foreground select-all">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-muted-foreground">{unit}</span>}
      </div>

      {(description || trend) && (
        <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground/80">
          <span>{description}</span>
          {trend && (
            <span
              className={cn(
                "font-bold",
                trend.direction === 'up' && "text-emerald-600 dark:text-emerald-400",
                trend.direction === 'down' && "text-rose-600 dark:text-rose-400",
                trend.direction === 'neutral' && "text-muted-foreground"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
