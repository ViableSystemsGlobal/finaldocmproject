'use client'

import { useEffect, useState } from 'react'
import { syncFormatters } from '@/lib/timezone-utils'

interface EventDateTimeDisplayProps {
  eventDate: string
  className?: string
  showTime?: boolean
  format?: 'full' | 'short' | 'time-only' | 'date-only'
}

export function EventDateTimeDisplay({ 
  eventDate, 
  className = "text-slate-600",
  showTime = true,
  format = 'full'
}: EventDateTimeDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const formatDate = () => {
      try {
        let formatted = ''
        
        switch (format) {
          case 'full':
            formatted = syncFormatters.eventDateTime(eventDate)
            break
          case 'short':
            formatted = showTime ? syncFormatters.displayDateTime(eventDate) : syncFormatters.displayDate(eventDate)
            break
          case 'time-only':
            formatted = syncFormatters.timeOnly(eventDate)
            break
          case 'date-only':
            formatted = syncFormatters.dateOnly(eventDate)
            break
          default:
            formatted = syncFormatters.eventDateTime(eventDate)
        }
        
        setFormattedDate(formatted)
      } catch (error) {
        console.error('Error formatting date:', error)
        setFormattedDate('Invalid date')
      } finally {
        setIsLoading(false)
      }
    }

    formatDate()
  }, [eventDate, showTime, format])

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    )
  }

  return (
    <p className={className}>
      {formattedDate}
    </p>
  )
} 