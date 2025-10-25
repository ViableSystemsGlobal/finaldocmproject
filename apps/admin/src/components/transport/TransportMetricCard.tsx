'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TransportMetricCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  className?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export function TransportMetricCard({
  title,
  value,
  icon,
  description,
  className,
  trend,
}: TransportMetricCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="mt-1 flex items-center text-xs">
              <span 
                className={
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-1 text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 