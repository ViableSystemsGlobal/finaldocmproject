import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Simple context without complex ref types
type PopoverContextType = {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextType>({
  open: false,
  setOpen: () => {}
})

const Popover = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  
  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return
    
    const handleClickOutside = (event: MouseEvent) => {
      // This is a simplified approach without using refs
      const target = event.target as HTMLElement
      if (!target.closest('.popover-content') && !target.closest('.popover-trigger')) {
        setOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = ({ 
  asChild, 
  children 
}: { 
  asChild?: boolean;
  children: React.ReactNode 
}) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  
  return (
    <div 
      className="popover-trigger inline-block cursor-pointer" 
      onClick={() => setOpen(!open)}
    >
      {children}
    </div>
  )
}

const PopoverContent = ({ 
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = React.useContext(PopoverContext)
  
  if (!open) return null
  
  return (
    <div 
      className={cn(
        "popover-content absolute left-0 top-full z-50 mt-2 w-auto min-w-[240px] rounded-md border bg-white p-2 shadow-md outline-none",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Popover, PopoverTrigger, PopoverContent } 