"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, UserPlus, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface MemberImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

interface ImportResult {
  imported: number
  skipped: number
  total: number
  message: string
}

interface SyncResult {
  synced: number
  message: string
  wouldSync?: number
  members?: Array<{ id: string; name: string; email: string }>
}

export function MemberImportDialog({ open, onOpenChange, onImportComplete }: MemberImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [includeVisitors, setIncludeVisitors] = useState(true)
  const [autoSync, setAutoSync] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [syncPreview, setSyncPreview] = useState<SyncResult | null>(null)

  const handleBulkImport = async () => {
    setLoading(true)
    setImportResult(null)
    
    try {
      const response = await fetch('/api/newsletter/members/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeVisitors,
          skipDuplicates
        })
      })

      const result = await response.json()

      if (result.success) {
        setImportResult(result)
        toast({
          title: "Import Complete",
          description: result.message,
        })
        onImportComplete()
      } else {
        toast({
          title: "Import Failed",
          description: result.error || 'Failed to import contacts',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Import Failed",
        description: 'An unexpected error occurred',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncPreview = async () => {
    setSyncLoading(true)
    setSyncPreview(null)
    
    try {
      const response = await fetch('/api/newsletter/members/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncDirection: 'member_to_newsletter',
          autoSegments: ['Members'],
          dryRun: true
        })
      })

      const result = await response.json()

      if (result.success) {
        setSyncPreview(result)
      } else {
        toast({
          title: "Sync Preview Failed",
          description: result.error || 'Failed to get sync preview',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Sync preview error:', error)
      toast({
        title: "Sync Preview Failed",
        description: 'An unexpected error occurred',
        variant: "destructive",
      })
    } finally {
      setSyncLoading(false)
    }
  }

  const handleAutoSync = async () => {
    setSyncLoading(true)
    
    try {
      const response = await fetch('/api/newsletter/members/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncDirection: 'member_to_newsletter',
          autoSegments: ['Members'],
          dryRun: false
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Auto-Sync Complete",
          description: result.message,
        })
        setSyncPreview(null)
        onImportComplete()
      } else {
        toast({
          title: "Auto-Sync Failed",
          description: result.error || 'Failed to sync members',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Auto-sync error:', error)
      toast({
        title: "Auto-Sync Failed",
        description: 'An unexpected error occurred',
        variant: "destructive",
      })
    } finally {
      setSyncLoading(false)
    }
  }

  const handleClose = () => {
    setImportResult(null)
    setSyncPreview(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Church Contacts
          </DialogTitle>
          <DialogDescription>
            Import church contacts as newsletter subscribers with automatic segmentation by member status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bulk Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5" />
                Bulk Import
              </CardTitle>
              <CardDescription>
                Import all church contacts with email addresses. Automatically segments into Members, Visitors, and Leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeVisitors" 
                  checked={includeVisitors}
                  onCheckedChange={setIncludeVisitors}
                />
                <Label htmlFor="includeVisitors">Include visitors and leads (recommended)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="skipDuplicates" 
                  checked={skipDuplicates}
                  onCheckedChange={setSkipDuplicates}
                />
                <Label htmlFor="skipDuplicates">Skip existing subscribers</Label>
              </div>

              {importResult && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Import Complete</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
                    <p>{importResult.message}</p>
                    <div className="flex gap-4">
                      <Badge variant="secondary">
                        Imported: {importResult.imported}
                      </Badge>
                      <Badge variant="outline">
                        Skipped: {importResult.skipped}
                      </Badge>
                      <Badge variant="outline">
                        Total: {importResult.total}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBulkImport} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing Contacts...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Import All Contacts
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Auto-Sync Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5" />
                Auto-Sync Setup
              </CardTitle>
              <CardDescription>
                Automatically sync new contacts to newsletter subscribers going forward
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="autoSync" 
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
                <Label htmlFor="autoSync">Enable automatic syncing of new contacts</Label>
              </div>

              {syncPreview && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Sync Preview</span>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 space-y-2">
                    <p>Would sync {syncPreview.wouldSync || 0} new contacts to newsletter</p>
                    {syncPreview.members && syncPreview.members.length > 0 && (
                      <div className="max-h-32 overflow-y-auto">
                        <p className="font-medium mb-1">Contacts to sync:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {syncPreview.members.slice(0, 5).map((member) => (
                            <li key={member.id} className="text-xs">
                              {member.name} ({member.email}) - {(member as any).status}
                            </li>
                          ))}
                          {syncPreview.members.length > 5 && (
                            <li className="text-xs text-blue-500">
                              ...and {syncPreview.members.length - 5} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleSyncPreview} 
                  disabled={syncLoading}
                  className="flex-1"
                >
                  {syncLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  Preview Sync
                </Button>

                {syncPreview && (
                  <Button 
                    onClick={handleAutoSync} 
                    disabled={syncLoading}
                    className="flex-1"
                  >
                    {syncLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Run Sync
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 