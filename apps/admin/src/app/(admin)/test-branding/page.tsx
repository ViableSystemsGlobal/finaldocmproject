'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { updateTenantSettings } from '@/services/settings'
import { useTenantSettings } from '@/hooks/use-tenant-settings'
import { Building2, Image, Sparkles, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function TestBrandingPage() {
  const { churchName, logoUrl, settings } = useTenantSettings()
  const [testName, setTestName] = useState('')
  const [testLogo, setTestLogo] = useState('')
  const [updating, setUpdating] = useState(false)
  const [dbStatus, setDbStatus] = useState<{
    tableExists: boolean | null;
    hasData: boolean | null;
    error: string | null;
  }>({
    tableExists: null,
    hasData: null,
    error: null
  })

  const checkDatabaseStatus = async () => {
    try {
      // Check if table exists and has data
      const { data, error, count } = await supabase
        .from('tenant_settings')
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error('Database check error:', error);
        setDbStatus({
          tableExists: false,
          hasData: false,
          error: error.message
        });
      } else {
        setDbStatus({
          tableExists: true,
          hasData: (count || 0) > 0,
          error: null
        });
      }
    } catch (error) {
      console.error('Database check failed:', error);
      setDbStatus({
        tableExists: false,
        hasData: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  const setupDatabase = async () => {
    try {
      setUpdating(true);
      
      // Try to create a default tenant settings record
      // This will work if the table exists but has no data
      const { data, error } = await supabase
        .from('tenant_settings')
        .insert([{
          name: 'CICS Admin',
          time_zone: 'America/New_York',
          primary_color: '#1A202C',
          secondary_color: '#F6E05E'
        }])
        .select()
        .single();

      if (error) {
        console.error('Setup error:', error);
        toast({
          title: 'Setup Failed',
          description: `Database setup failed: ${error.message}. You may need to run the migration manually in Supabase SQL Editor.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Setup Complete',
          description: 'Database has been set up with default settings. You can now update your church branding.',
        });
        // Refresh the database status
        await checkDatabaseStatus();
      }
    } catch (error) {
      console.error('Setup failed:', error);
      toast({
        title: 'Setup Failed',
        description: 'Failed to set up database. Please run the migration manually.',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  }

  const handleUpdateBranding = async () => {
    if (!testName && !testLogo) {
      toast({
        title: 'No Changes',
        description: 'Please enter a church name or logo URL to test.',
        variant: 'destructive'
      })
      return
    }

    setUpdating(true)
    try {
      const updates: any = {}
      if (testName) updates.name = testName
      if (testLogo) updates.logo_url = testLogo

      const result = await updateTenantSettings(updates)
      if (result.success) {
        toast({
          title: 'Branding Updated',
          description: 'Church branding has been updated. Refresh the page to see changes in the sidebar and header.',
        })
        // Clear form
        setTestName('')
        setTestLogo('')
      } else {
        throw new Error(result.error as string)
      }
    } catch (error) {
      console.error('Error updating branding:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to update church branding. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  const resetToDefault = async () => {
    setUpdating(true)
    try {
      const result = await updateTenantSettings({
        name: 'Mobile App Admin',
        logo_url: ''
      })
      if (result.success) {
        toast({
          title: 'Reset Complete',
          description: 'Branding has been reset to default. Refresh the page to see changes.',
        })
      }
    } catch (error) {
      console.error('Error resetting branding:', error)
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset branding. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Branding Test Page</h1>
          <p className="text-xl text-slate-600">Test church name and logo changes</p>
        </div>

        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
            <CardDescription>
              Check if the tenant_settings table is properly configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Table Status:</span>
              <div className="flex items-center gap-2">
                {dbStatus.tableExists === null ? (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                ) : dbStatus.tableExists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {dbStatus.tableExists === null ? 'Not checked' : 
                   dbStatus.tableExists ? 'Table exists' : 'Table missing'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Has Data:</span>
              <div className="flex items-center gap-2">
                {dbStatus.hasData === null ? (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                ) : dbStatus.hasData ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {dbStatus.hasData === null ? 'Not checked' : 
                   dbStatus.hasData ? 'Has settings' : 'No settings found'}
                </span>
              </div>
            </div>

            {dbStatus.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">Error:</p>
                <p className="text-sm text-red-600">{dbStatus.error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={checkDatabaseStatus} variant="outline" size="sm">
                Check Database Status
              </Button>
              
              {(!dbStatus.tableExists || !dbStatus.hasData) && (
                <Button 
                  onClick={setupDatabase} 
                  variant="default" 
                  size="sm"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? 'Setting up...' : 'Setup Database'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Current Branding
            </CardTitle>
            <CardDescription>
              This shows the current church branding settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Church Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Sparkles className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{churchName}</h3>
                <p className="text-sm text-slate-500">
                  Logo: {logoUrl || 'Using default'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Test Branding Changes
            </CardTitle>
            <CardDescription>
              Make changes here and see them reflected in the sidebar and header
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Church Name
                </label>
                <Input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Enter church name (e.g., Grace Community Church)"
                  className="bg-white"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Logo URL
                </label>
                <Input
                  value={testLogo}
                  onChange={(e) => setTestLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-white"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use a publicly accessible image URL. Recommended size: 256x256px or larger.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleUpdateBranding}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Updating...' : 'Update Branding'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={resetToDefault}
                disabled={updating}
              >
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-600 space-y-2">
              <p>• Enter a church name and/or logo URL above</p>
              <p>• Click "Update Branding" to apply changes</p>
              <p>• Refresh the page to see changes in the sidebar logo and header title</p>
              <p>• The church name will replace "Mobile App Admin" throughout the interface</p>
              <p>• The logo will appear in both the sidebar and header</p>
              <p>• Use "Reset to Default" to restore original branding</p>
            </div>
          </CardContent>
        </Card>

        {/* Sample URLs */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Logo URLs</CardTitle>
            <CardDescription>Click to use these sample logo URLs for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestLogo('https://via.placeholder.com/256x256/3B82F6/FFFFFF?text=CHURCH')}
                className="text-left justify-start"
              >
                Blue Church Logo (Placeholder)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestLogo('https://via.placeholder.com/256x256/10B981/FFFFFF?text=FAITH')}
                className="text-left justify-start"
              >
                Green Faith Logo (Placeholder)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Migration Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Setup Required
            </CardTitle>
            <CardDescription>
              If you're getting errors, you may need to run the database migration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Steps to fix database issues:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Go to your Supabase Dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Copy and paste the migration from <code>migrations/add_tenant_branding.sql</code></li>
                <li>Run the migration</li>
                <li>Come back and test the branding functionality</li>
              </ol>
            </div>
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-medium text-slate-800 mb-2">Migration File Location:</h4>
              <code className="text-sm text-slate-600 bg-white px-2 py-1 rounded border">
                migrations/add_tenant_branding.sql
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 