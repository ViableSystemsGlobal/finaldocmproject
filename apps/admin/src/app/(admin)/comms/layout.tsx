'use client'

interface CommsLayoutProps {
  children: React.ReactNode
}

export default function CommsLayout({ children }: CommsLayoutProps) {
  return (
    <div>
      {children}
    </div>
  )
} 