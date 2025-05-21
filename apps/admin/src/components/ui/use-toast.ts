// Simplified toast implementation

interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

// A simple toast function that logs to console since we don't have the full implementation
export function toast(props: ToastProps) {
  console.log(`Toast: ${props.variant || 'default'} - ${props.title || ''} - ${props.description || ''}`)
  
  // In a real implementation, this would show a toast UI component
  // But for now we're just making sure the code compiles
  
  return {
    dismiss: () => {},
    id: Math.random().toString(),
  }
} 