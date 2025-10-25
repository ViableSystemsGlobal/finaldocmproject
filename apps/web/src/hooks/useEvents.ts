import { useState, useEffect } from 'react'

interface EventData {
  id: string
  name: string
  event_date: string
  location: string
  description: string
  capacity: number | null
  primary_image: {
    url: string
    alt_text: string | null
  } | null
  gradient: string
  type: string
}

interface EventsResponse {
  events: EventData[]
  source: 'database' | 'default'
  message: string
}

// Default events data - SAME pattern as homepage/navigation
const defaultEvents: EventData[] = [
  {
    id: 'default-1',
    name: "Sunday Worship Experience",
    event_date: "2024-01-28T09:00:00",
    location: "Main Sanctuary",
    description: "Join us for an inspiring worship experience with contemporary music and biblical teaching.",
    capacity: 200,
    primary_image: null,
    gradient: "from-blue-800 to-indigo-900",
    type: "worship"
  },
  {
    id: 'default-2',
    name: "Midweek Connection",
    event_date: "2024-01-31T19:00:00",
    location: "Fellowship Hall",
    description: "Dive deeper into God's word through interactive Bible study and fellowship.",
    capacity: 50,
    primary_image: null,
    gradient: "from-purple-800 to-pink-900",
    type: "study"
  },
  {
    id: 'default-3',
    name: "Youth Ignite Night",
    event_date: "2024-02-02T19:00:00",
    location: "Youth Center",
    description: "High-energy youth service with games, worship, and relevant messages for teens.",
    capacity: 100,
    primary_image: null,
    gradient: "from-green-800 to-teal-900",
    type: "youth"
  },
  {
    id: 'default-4',
    name: "Community Outreach",
    event_date: "2024-02-05T10:00:00",
    location: "Community Center",
    description: "Join us as we serve our community with love and compassion through various outreach programs.",
    capacity: 150,
    primary_image: null,
    gradient: "from-orange-800 to-red-900",
    type: "outreach"
  }
]

export function useEvents() {
  // Start with empty array - no fallback defaults
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'default' | 'database'>('database')
  const [message, setMessage] = useState<string>('Loading events...')

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      
      try {
        const response = await fetch('/api/events', {
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data: EventsResponse = await response.json()
        
        if (data.source === 'database') {
          // From database - use actual events (could be empty array)
          setEvents(data.events || [])
          setSource('database')
          setMessage(data.events && data.events.length > 0 ? 
            `Loaded ${data.events.length} events from database` : 
            'No upcoming events from database')
          setError(null)
          
          console.log(`📅 Events Source: DATABASE - ${data.events?.length || 0} events`)
        } else {
          // Database error - show empty instead of defaults
          console.log('📅 Events: Database error, showing no events')
          setEvents([])
          setSource('database')
          setMessage('No upcoming events available')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load events'
        setError(errorMessage)
        console.log('Events fetch failed:', errorMessage)
        
        // On error, show empty instead of defaults
        setEvents([])
        setSource('database')
        setMessage('No upcoming events available')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return { events, loading, error, source, message }
} 