import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: number
  icon?: React.ReactNode
  loading?: boolean
  className?: string
  formatter?: 'currency' | 'number' | 'percentage'
  trend?: {
    value: number
    label: string
  }
}

export function MetricCard({
  title,
  value,
  icon,
  loading = false,
  className = '',
  formatter = 'currency',
  trend,
}: MetricCardProps) {
  // Format the value based on the formatter type
  const formattedValue = () => {
    if (loading) return '--'
    
    switch (formatter) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value)
      case 'number':
        return new Intl.NumberFormat('en-US').format(value)
      case 'percentage':
        return `${value.toFixed(2)}%`
      default:
        return value.toString()
    }
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div>
              <p className="text-2xl font-bold">{formattedValue()}</p>
              {trend && (
                <div className="mt-1 flex items-center text-xs">
                  <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {trend.value >= 0 ? (
                      <ArrowUpRight className="mr-1 h-3 w-3 inline" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3 w-3 inline" />
                    )}
                    {Math.abs(trend.value).toFixed(1)}%
                  </span>
                  <span className="ml-1 text-muted-foreground">{trend.label}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 