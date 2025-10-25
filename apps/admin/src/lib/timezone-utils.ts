import { getCurrentTenantSettings } from '@/services/settings'

// Cache for tenant timezone to avoid repeated API calls
let cachedTimezone: string | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get the configured timezone from tenant settings
 */
export async function getConfiguredTimezone(): Promise<string> {
  const now = Date.now()
  
  // Return cached timezone if still valid
  if (cachedTimezone && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedTimezone
  }
  
  try {
    const settings = await getCurrentTenantSettings()
    const timezone = settings?.time_zone || 'America/New_York'
    
    // Update cache
    cachedTimezone = timezone
    cacheTimestamp = now
    
    return timezone
  } catch (error) {
    console.error('Failed to get configured timezone:', error)
    return 'America/New_York' // fallback
  }
}

/**
 * Format date using the configured timezone
 */
export async function formatDateWithTimezone(
  date: string | Date, 
  options: Intl.DateTimeFormatOptions = {}
): Promise<string> {
  const timezone = await getConfiguredTimezone()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj)
}

/**
 * Format date using the configured timezone (synchronous version with cached timezone)
 */
export function formatDateWithCachedTimezone(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const timezone = cachedTimezone || 'America/New_York'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj)
}

/**
 * Format date for display (short format)
 */
export async function formatDisplayDate(date: string | Date): Promise<string> {
  return formatDateWithTimezone(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format datetime for display (includes time)
 */
export async function formatDisplayDateTime(date: string | Date): Promise<string> {
  return formatDateWithTimezone(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format full date with weekday (for events)
 */
export async function formatEventDateTime(date: string | Date): Promise<string> {
  return formatDateWithTimezone(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format just the date part (no time)
 */
export async function formatDateOnly(date: string | Date): Promise<string> {
  return formatDateWithTimezone(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format just the time part
 */
export async function formatTimeOnly(date: string | Date): Promise<string> {
  return formatDateWithTimezone(date, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format date for forms (YYYY-MM-DD format in local timezone)
 */
export async function formatDateForInput(date: string | Date): Promise<string> {
  const timezone = await getConfiguredTimezone()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Convert to timezone-aware date
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD format
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  return formatter.format(dateObj)
}

/**
 * Format datetime for forms (YYYY-MM-DDTHH:mm format in local timezone)
 */
export async function formatDateTimeForInput(date: string | Date): Promise<string> {
  const timezone = await getConfiguredTimezone()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Get date part
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  // Get time part
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  const datePart = dateFormatter.format(dateObj)
  const timePart = timeFormatter.format(dateObj)
  
  return `${datePart}T${timePart}`
}

/**
 * Convert a date from the configured timezone to UTC for database storage
 */
export async function convertToUTC(date: Date, timeString?: string): Promise<Date> {
  const timezone = await getConfiguredTimezone()
  
  let dateToConvert = new Date(date)
  
  // If time string is provided, set it
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    dateToConvert.setHours(hours, minutes, 0, 0)
  }
  
  // Create a date in the configured timezone
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(dateToConvert)
  const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0')
  const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1
  const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0')
  const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  
  // Create UTC date
  return new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute))
}

/**
 * Initialize timezone cache - call this in your app startup
 */
export async function initializeTimezoneCache(): Promise<void> {
  await getConfiguredTimezone()
}

/**
 * Synchronous versions using cached timezone (for components that can't use async)
 */
export const syncFormatters = {
  displayDate: (date: string | Date): string => formatDateWithCachedTimezone(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }),
  
  displayDateTime: (date: string | Date): string => formatDateWithCachedTimezone(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }),
  
  eventDateTime: (date: string | Date): string => formatDateWithCachedTimezone(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }),
  
  timeOnly: (date: string | Date): string => formatDateWithCachedTimezone(date, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }),
  
  dateOnly: (date: string | Date): string => formatDateWithCachedTimezone(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
} 