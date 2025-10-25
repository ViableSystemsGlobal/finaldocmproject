'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Database, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Shield,
  Smartphone,
  Monitor,
  Settings
} from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

interface MigrationResult {
  success: boolean
  message: string
  migrated_users?: number
  details?: string
}

export default function MigrationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Migration Completed",
          description: "Multi-app user management system has been set up successfully",
        })
      } else {
        toast({
          title: "Migration Failed",
          description: data.details || "An error occurred during migration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Migration error:', error)
      setResult({
        success: false,
        message: 'Failed to run migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      toast({
        title: "Migration Failed",
        description: "Failed to communicate with the server",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const runSimpleMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/migrate-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Simple Migration Completed",
          description: "Basic multi-app user management system has been set up successfully",
        })
      } else {
        toast({
          title: "Migration Failed",
          description: data.details || "An error occurred during migration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Simple migration error:', error)
      setResult({
        success: false,
        message: 'Failed to run simple migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      toast({
        title: "Migration Failed",
        description: "Failed to communicate with the server",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: 'Enhanced User Profiles',
      description: 'Extended user profiles with personal, admin, and mobile user information'
    },
    {
      icon: Shield,
      title: 'Multi-App Access Control',
      description: 'Users can have access to mobile app, admin system, or both'
    },
    {
      icon: Smartphone,
      title: 'Mobile User Management',
      description: 'Dedicated mobile user creation and management with member linking'
    },
    {
      icon: Monitor,
      title: 'Admin Staff Management',
      description: 'Enhanced admin user management with departments, job titles, and employee IDs'
    },
    {
      icon: Settings,
      title: 'Hybrid Users',
      description: 'Support for users who need both mobile and admin access'
    }
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Database className="w-8 h-8" />
          Multi-App User Management Migration
        </h1>
        <p className="text-muted-foreground">
          Set up the enhanced user management system for mobile and admin users
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Overview</CardTitle>
          <CardDescription>
            This migration will enhance your user management system to support both mobile app users and admin staff with proper access controls and user types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Icon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Migration Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What This Migration Does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <div>
              <p className="font-medium">Creates user_profiles table</p>
              <p className="text-sm text-muted-foreground">Extended user information with user types and app access</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <div>
              <p className="font-medium">Sets up database indexes and security</p>
              <p className="text-sm text-muted-foreground">Optimized queries and Row Level Security policies</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <div>
              <p className="font-medium">Creates helper functions</p>
              <p className="text-sm text-muted-foreground">Database functions for permission checking and user management</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">4</Badge>
            <div>
              <p className="font-medium">Migrates existing users</p>
              <p className="text-sm text-muted-foreground">Creates profiles for existing users as admin staff</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Action */}
      <Card>
        <CardHeader>
          <CardTitle>Run Migration</CardTitle>
          <CardDescription>
            Click the button below to run the database migration. This is safe to run multiple times.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This migration will create new database tables and functions. Make sure you have a backup of your database before proceeding.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={runMigration} 
              disabled={isRunning}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Migration...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Full Migration
                </>
              )}
            </Button>
            
            <Button 
              onClick={runSimpleMigration} 
              disabled={isRunning}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Migration...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Simple Migration
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground text-center mt-2">
            <p><strong>Full Migration:</strong> Includes triggers and advanced features</p>
            <p><strong>Simple Migration:</strong> Basic functionality without triggers (recommended if you're getting SQL errors)</p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Migration Completed Successfully
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Migration Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>
                {result.message}
                {result.migrated_users !== undefined && (
                  <span className="block mt-2 font-medium">
                    Migrated {result.migrated_users} existing users
                  </span>
                )}
                {result.details && (
                  <span className="block mt-2 text-sm text-muted-foreground">
                    Details: {result.details}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {result.success && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Next Steps:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Visit <strong>Settings → Users</strong> to manage your users</li>
                  <li>• Create mobile users for app access</li>
                  <li>• Grant admin access to mobile users as needed</li>
                  <li>• Set up departments and job titles for admin staff</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post-Migration Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Types</CardTitle>
          <CardDescription>
            After migration, you'll be able to manage these user types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">Mobile Users</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Church members with mobile app access only
              </p>
              <Badge className="mt-2 bg-blue-100 text-blue-800">mobile</Badge>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium">Admin Staff</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Staff members with admin system access only
              </p>
              <Badge className="mt-2 bg-purple-100 text-purple-800">admin</Badge>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Monitor className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">Hybrid Users</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Users with both mobile and admin access
              </p>
              <Badge className="mt-2 bg-green-100 text-green-800">hybrid</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 