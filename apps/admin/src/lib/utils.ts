import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function to safely format dates with the same output on server and client
export function safeFormatDate(dateString: string): string {
  try {
    // Use a fixed ISO string format that will be consistent between server and client
    const date = new Date(dateString);
    // Use YYYY-MM-DD format which is consistent
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

// Get date range based on selected period
export function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date()
  const endDate = new Date(now)
  let startDate = new Date(now)

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      startDate = new Date(now.getFullYear(), 0, 1) // Default to year
  }

  return { startDate, endDate }
}

// CSV export utility function
export function exportToCSV(filename: string, data: any[]) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get all unique keys from the data
  const keys = Array.from(new Set(data.flatMap(item => Object.keys(item))))
  
  // Create CSV header
  const csvHeader = keys.join(',')
  
  // Create CSV rows
  const csvRows = data.map(item => {
    return keys.map(key => {
      const value = item[key]
      // Handle null, undefined, and special characters
      if (value === null || value === undefined) {
        return ''
      }
      // Convert to string and escape quotes
      const stringValue = String(value).replace(/"/g, '""')
      // Wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue}"`
      }
      return stringValue
    }).join(',')
  })
  
  // Combine header and rows
  const csvContent = [csvHeader, ...csvRows].join('\n')
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format date for display
export function formatDisplayDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj)
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

// Get period display name
export function getPeriodDisplayName(period: string): string {
  switch (period) {
    case 'week':
      return 'This Week'
    case 'month':
      return 'This Month'
    case 'quarter':
      return 'This Quarter'
    case 'year':
      return 'This Year'
    default:
      return 'This Year'
  }
}
