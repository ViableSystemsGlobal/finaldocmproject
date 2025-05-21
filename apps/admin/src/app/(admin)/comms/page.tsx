'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CommsIndexPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to templates page
    router.push('/comms/templates')
  }, [router])
  
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Redirecting to Communications...</p>
    </div>
  )
} 