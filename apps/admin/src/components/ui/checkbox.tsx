"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    // Handle internal state if not controlled
    const [internalChecked, setInternalChecked] = React.useState(checked || false)
    const isControlled = checked !== undefined
    const isChecked = isControlled ? checked : internalChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked)
      }
      
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
      
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary opacity-0 absolute",
            className
          )}
          {...props}
        />
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors",
            isChecked ? "bg-primary text-primary-foreground" : "bg-background",
          )}
        >
          {isChecked && <Check className="h-3 w-3" />}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox } 