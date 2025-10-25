'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { canAccessRoute } from '@/lib/permissions'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, requiredPermissions, fallback }: ProtectedRouteProps) {
  const { userPermissions, isLoading, error } = usePermissions()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Redirect to login if no user
    if (!isLoading && !userPermissions.user) {
      router.push('/login')
    }
  }, [userPermissions.user, isLoading, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Permission Error</CardTitle>
            <CardDescription className="text-red-700">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated
  if (!userPermissions.user) {
    return null // Will redirect to login
  }

  // Check route permissions
  const hasAccess = canAccessRoute(userPermissions, pathname)
  
  // Check specific required permissions if provided
  const hasRequiredPermissions = requiredPermissions 
    ? requiredPermissions.some(permission => userPermissions.permissions.includes(permission))
    : true

  if (!hasAccess || !hasRequiredPermissions) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <CardTitle className="text-slate-900">Access Denied</CardTitle>
            <CardDescription className="text-slate-600">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-700">
                <strong>Your Role:</strong> {userPermissions.roles.map(r => r.name).join(', ') || 'No roles assigned'}
              </p>
              {userPermissions.department && (
                <p className="text-sm text-slate-700 mt-1">
                  <strong>Department:</strong> {userPermissions.department}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

// Convenience component for checking specific permissions
export function RequirePermission({ 
  permission, 
  children, 
  fallback 
}: { 
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const { userPermissions, isLoading } = usePermissions()

  if (isLoading) {
    return <div className="animate-pulse bg-slate-200 rounded h-8"></div>
  }

  if (!userPermissions.permissions.includes(permission)) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// Component to hide UI elements based on permissions
export function ConditionalRender({
  condition,
  children,
  fallback
}: {
  condition: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return condition ? <>{children}</> : (fallback ? <>{fallback}</> : null)
} 