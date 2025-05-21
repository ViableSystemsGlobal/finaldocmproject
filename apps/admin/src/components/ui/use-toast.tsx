// Adapted from shadcn/ui toast component
// https://ui.shadcn.com/docs/components/toast

import * as React from "react"

export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

interface ToastContextValue {
  toast: (props: ToastProps) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, props.duration || 3000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-md shadow-lg p-4 transition-all transform translate-y-0 
                ${t.variant === "destructive" ? "bg-red-500 text-white" : "bg-white"}`}
              onClick={() => removeToast(t.id)}
            >
              {t.title && <div className="font-medium">{t.title}</div>}
              {t.description && <div className="text-sm">{t.description}</div>}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  
  return context
}

// Re-export as a simple function for easier usage
export const toast = (props: ToastProps) => {
  // For client-side components that can't use the hook
  // We'll fallback to a simpler implementation
  if (typeof window !== "undefined") {
    // Create a div that will be our toast
    const toastEl = document.createElement("div")
    toastEl.className = `rounded-md shadow-lg p-4 z-50 transition-all transform translate-y-0 
      ${props.variant === "destructive" ? "bg-red-500 text-white" : "bg-white"}`
    
    // Create content
    if (props.title) {
      const titleEl = document.createElement("div")
      titleEl.className = "font-medium"
      titleEl.textContent = props.title
      toastEl.appendChild(titleEl)
    }
    
    if (props.description) {
      const descEl = document.createElement("div")
      descEl.className = "text-sm"
      descEl.textContent = props.description
      toastEl.appendChild(descEl)
    }
    
    // Find the toast container or fallback to body
    const container = document.getElementById('toast-container') || document.body
    container.appendChild(toastEl)
    
    // Auto remove
    setTimeout(() => {
      toastEl.classList.add("opacity-0")
      setTimeout(() => {
        if (container.contains(toastEl)) {
          container.removeChild(toastEl)
        }
      }, 300)
    }, props.duration || 3000)
    
    // Click to dismiss
    toastEl.addEventListener("click", () => {
      toastEl.classList.add("opacity-0")
      setTimeout(() => {
        if (container.contains(toastEl)) {
          container.removeChild(toastEl)
        }
      }, 300)
    })
  }
} 