import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-slate-300">404</h1>
          <h2 className="text-3xl font-semibold text-slate-700">Page Not Found</h2>
          <p className="text-slate-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" className="space-x-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="space-x-2">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 