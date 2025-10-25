// Adapted from shadcn/ui toast component with modern UI enhancements
// https://ui.shadcn.com/docs/components/toast

import * as React from "react"
import { CheckCircle, AlertTriangle, X } from "lucide-react"

export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
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
    }, props.duration || 4000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 space-y-3 z-50 max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`
                relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-5 
                transition-all duration-500 transform translate-x-0 hover:scale-105 cursor-pointer
                animate-in slide-in-from-right-full
                ${t.variant === "destructive" 
                  ? "border-red-200/50 bg-gradient-to-br from-red-50/90 to-red-100/50" 
                  : t.variant === "success"
                  ? "border-emerald-200/50 bg-gradient-to-br from-emerald-50/90 to-emerald-100/50"
                  : "border-blue-200/50 bg-gradient-to-br from-blue-50/90 to-blue-100/50"
                }
              `}
              onClick={() => removeToast(t.id)}
            >
              {/* Close button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  removeToast(t.id)
                }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500 hover:text-slate-700" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                {/* Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${
                  t.variant === "destructive" 
                    ? "bg-gradient-to-br from-red-500 to-red-600" 
                    : t.variant === "success"
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                    : "bg-gradient-to-br from-blue-500 to-blue-600"
                }`}>
                  {t.variant === "destructive" ? (
                    <AlertTriangle className="h-5 w-5 text-white" />
                  ) : t.variant === "success" ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {t.title && (
                    <div className={`font-semibold text-sm mb-1 ${
                      t.variant === "destructive" 
                        ? "text-red-800" 
                        : t.variant === "success"
                        ? "text-emerald-800"
                        : "text-blue-800"
                    }`}>
                      {t.title}
                    </div>
                  )}
                  {t.description && (
                    <div className={`text-sm leading-relaxed ${
                      t.variant === "destructive" 
                        ? "text-red-700" 
                        : t.variant === "success"
                        ? "text-emerald-700"
                        : "text-blue-700"
                    }`}>
                      {t.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className={`absolute bottom-0 left-0 h-1 rounded-b-2xl transition-all duration-[${t.duration || 4000}ms] ease-linear ${
                t.variant === "destructive" 
                  ? "bg-gradient-to-r from-red-500 to-red-600" 
                  : t.variant === "success"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`} 
              style={{
                width: '100%',
                animation: `toast-progress ${t.duration || 4000}ms ease-linear forwards`
              }} />
            </div>
          ))}
        </div>
      )}
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slide-in-from-right-full {
          from {
            transform: translateX(calc(100% + 1rem));
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-duration: 0.5s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
        }
        
        .slide-in-from-right-full {
          animation-name: slide-in-from-right-full;
        }
      `}</style>
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
  // We'll fallback to a simpler implementation with modern styling
  if (typeof window !== "undefined") {
    // Create a div that will be our toast
    const toastEl = document.createElement("div")
    
    // Apply modern styling
    toastEl.className = `
      fixed bottom-4 right-4 z-50 max-w-sm p-5 rounded-2xl shadow-2xl border transition-all duration-500 transform
      bg-white/90 backdrop-blur-xl border-white/20
      ${props.variant === "destructive" 
        ? "border-red-200/50 bg-gradient-to-br from-red-50/90 to-red-100/50" 
        : props.variant === "success"
        ? "border-emerald-200/50 bg-gradient-to-br from-emerald-50/90 to-emerald-100/50"
        : "border-blue-200/50 bg-gradient-to-br from-blue-50/90 to-blue-100/50"
      }
    `
    
    // Create content structure
    const contentWrapper = document.createElement("div")
    contentWrapper.className = "flex items-start gap-3"
    
    // Create icon
    const iconWrapper = document.createElement("div")
    iconWrapper.className = `flex-shrink-0 p-2 rounded-lg ${
      props.variant === "destructive" 
        ? "bg-gradient-to-br from-red-500 to-red-600" 
        : props.variant === "success"
        ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
        : "bg-gradient-to-br from-blue-500 to-blue-600"
    }`
    
    // Add icon SVG
    iconWrapper.innerHTML = props.variant === "destructive" 
      ? `<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>`
      : `<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`
    
    const textWrapper = document.createElement("div")
    textWrapper.className = "flex-1 min-w-0"
    
    // Create title
    if (props.title) {
      const titleEl = document.createElement("div")
      titleEl.className = `font-semibold text-sm mb-1 ${
        props.variant === "destructive" 
          ? "text-red-800" 
          : props.variant === "success"
          ? "text-emerald-800"
          : "text-blue-800"
      }`
      titleEl.textContent = props.title
      textWrapper.appendChild(titleEl)
    }
    
    // Create description
    if (props.description) {
      const descEl = document.createElement("div")
      descEl.className = `text-sm leading-relaxed ${
        props.variant === "destructive" 
          ? "text-red-700" 
          : props.variant === "success"
          ? "text-emerald-700"
          : "text-blue-700"
      }`
      descEl.textContent = props.description
      textWrapper.appendChild(descEl)
    }
    
    contentWrapper.appendChild(iconWrapper)
    contentWrapper.appendChild(textWrapper)
    toastEl.appendChild(contentWrapper)
    
    // Find the toast container or fallback to body
    const container = document.getElementById('toast-container') || document.body
    container.appendChild(toastEl)
    
    // Animate in
    toastEl.style.transform = "translateX(calc(100% + 1rem))"
    toastEl.style.opacity = "0"
    
    setTimeout(() => {
      toastEl.style.transform = "translateX(0)"
      toastEl.style.opacity = "1"
    }, 10)
    
    // Auto remove
    setTimeout(() => {
      toastEl.style.transform = "translateX(calc(100% + 1rem))"
      toastEl.style.opacity = "0"
      setTimeout(() => {
        if (container.contains(toastEl)) {
          container.removeChild(toastEl)
        }
      }, 500)
    }, props.duration || 4000)
    
    // Click to dismiss
    toastEl.addEventListener("click", () => {
      toastEl.style.transform = "translateX(calc(100% + 1rem))"
      toastEl.style.opacity = "0"
      setTimeout(() => {
        if (container.contains(toastEl)) {
          container.removeChild(toastEl)
        }
      }, 500)
    })
  }
} 