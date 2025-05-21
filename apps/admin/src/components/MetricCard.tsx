import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  loading?: boolean
  className?: string
}

export function MetricCard({
  title,
  value,
  icon,
  loading = false,
  className = ''
}: MetricCardProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="flex items-center mt-2 text-xl">
                <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                <span>Loading...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold mt-2">{value}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 