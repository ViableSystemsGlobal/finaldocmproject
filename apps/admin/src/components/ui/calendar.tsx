import React, { useState, useContext } from 'react'

interface CalendarProps {
  mode?: 'single' | 'range' | 'multiple'
  selected?: Date | Date[] | undefined
  onSelect?: ((date: Date | undefined) => void) | undefined
  onSelectDate?: (date: Date) => void
  initialFocus?: boolean
  disableFutureDates?: boolean
  className?: string
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  onSelectDate,
  initialFocus,
  disableFutureDates = false,
  className,
  ...props
}: CalendarProps & React.HTMLAttributes<HTMLDivElement>) {
  // Use state to track the displayed month and year instead of current date
  const [viewDate, setViewDate] = useState(() => {
    // Initialize with the selected date's month/year if available, otherwise current date
    return selected instanceof Date ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  })
  
  const currentMonth = viewDate.getMonth()
  const currentYear = viewDate.getFullYear()
  
  // Get today's date for comparison
  const today = new Date()
  const isFutureMonth = disableFutureDates && (
    currentYear > today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth > today.getMonth())
  )
  
  // Year dropdown state
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  
  // Helper function to determine if a day is selected
  const isSelected = (day: number) => {
    if (!selected) return false
    
    if (mode === 'single' && selected instanceof Date) {
      return selected.getDate() === day && 
             selected.getMonth() === currentMonth &&
             selected.getFullYear() === currentYear
    }
    
    return false
  }
  
  // Helper function to check if a date is in the future
  const isFutureDate = (day: number): boolean => {
    if (!disableFutureDates) return false
    
    const checkDate = new Date(currentYear, currentMonth, day)
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    
    return checkDate.getTime() > todayTime
  }
  
  // Navigation functions
  const goToPreviousMonth = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    setViewDate(new Date(currentYear, currentMonth - 1, 1))
  }
  
  const goToNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    // Don't allow navigation to future months if future dates are disabled
    if (disableFutureDates) {
      const nextMonth = new Date(currentYear, currentMonth + 1, 1)
      if (nextMonth.getFullYear() > today.getFullYear() || 
          (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() > today.getMonth())) {
        return
      }
    }
    setViewDate(new Date(currentYear, currentMonth + 1, 1))
  }
  
  const handleYearClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    setShowYearDropdown(!showYearDropdown)
  }
  
  const selectYear = (year: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    // If disabling future dates, don't allow selecting future years
    if (disableFutureDates && year > today.getFullYear()) {
      return
    }
    
    // If selecting current year and current month is after today's month, reset to today's month
    let newMonth = currentMonth
    if (disableFutureDates && year === today.getFullYear() && currentMonth > today.getMonth()) {
      newMonth = today.getMonth()
    }
    
    setViewDate(new Date(year, newMonth, 1))
    setShowYearDropdown(false)
  }
  
  // Get first day of month for proper calendar grid alignment
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start (0 = Monday)
  
  // Generate days array for the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  
  // Create blank cells for days before the first day of the month
  const blanks = Array.from({ length: adjustedFirstDay }, (_, i) => i)
  
  // Month names for display
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  // Generate a list of years from 1900 to 20 years in the future
  const currentSystemYear = new Date().getFullYear()
  // If disabling future dates, don't show future years
  const maxYear = disableFutureDates ? currentSystemYear : currentSystemYear + 20
  const years = Array.from(
    { length: maxYear - 1900 + 1 }, 
    (_, i) => 1900 + i
  )
  
  // Handler for day selection
  const handleDayClick = (day: number, e?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    if (e) e.preventDefault();
    
    // Don't allow selecting future dates if disabled
    if (isFutureDate(day)) return;
    
    // Create a proper date object with the displayed month and year
    const date = new Date(currentYear, currentMonth, day);
    
    // Call onSelect if provided (standard React DayPicker API)
    if (onSelect) {
      onSelect(date);
    }
    
    // Call onSelectDate if provided (legacy API)
    if (onSelectDate) {
      onSelectDate(date);
    }
    
    // Auto-close popover by dispatching an escape key event
    setTimeout(() => {
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true
      });
      document.dispatchEvent(escapeEvent);
    }, 100);
  }
  
  return (
    <div className={className} {...props}>
      <div className="p-3 w-full min-w-[280px]">
        {/* Month and Year Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button 
              type="button"
              onClick={goToPreviousMonth}
              className="p-1.5 rounded-md hover:bg-gray-100"
              aria-label="Previous month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="mx-2 font-medium">
              {monthNames[currentMonth]}
            </div>
            <button 
              type="button"
              onClick={goToNextMonth}
              className={`p-1.5 rounded-md ${isFutureMonth ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              aria-label="Next month"
              disabled={isFutureMonth}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          
          <div className="relative">
            <button 
              type="button"
              onClick={handleYearClick}
              className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 font-medium"
            >
              {currentYear}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d={showYearDropdown ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>
            
            {showYearDropdown && (
              <div className="absolute right-0 mt-1 py-1 bg-white border rounded-md shadow-md z-10 max-h-60 overflow-y-auto">
                {years.map((year) => (
                  <button
                    key={year}
                    className={`block w-full px-4 py-1 text-left 
                      ${year === currentYear ? 'font-bold bg-gray-50' : ''}
                      ${disableFutureDates && year > today.getFullYear() ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    onClick={(e) => selectYear(year, e)}
                    disabled={disableFutureDates && year > today.getFullYear()}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday headers */}
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 h-8 flex items-center justify-center">
              {day}
            </div>
          ))}
          
          {/* Blank cells before the first day */}
          {blanks.map((blank) => (
            <div key={`blank-${blank}`} className="h-8 w-8" />
          ))}
          
          {/* Calendar days */}
          {days.map((day) => {
            const isDisabled = isFutureDate(day)
            return (
              <button
                key={day}
                type="button"
                disabled={isDisabled}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors
                  ${isSelected(day) 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100'
                  }
                `}
                onClick={(e) => handleDayClick(day, e)}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
} 