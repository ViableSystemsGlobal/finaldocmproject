'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowLeft,
  Loader2,
  Eye,
  Download,
  Calendar,
  User,
  Activity,
  Shield,
  Database,
  Edit,
  Trash2,
  Plus,
  Settings,
  Mail,
  MessageCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Pagination } from '@/components/ui/pagination'
import { usePagination } from '@/hooks/usePagination'
import { 
  fetchAuditLogs,
  type AuditLog 
} from '@/services/settings'

const actionIcons = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  login: User,
  logout: User,
  settings: Settings,
  send_email: Mail,
  send_sms: MessageCircle,
  export: Download,
}

const actionColors = {
  create: 'bg-green-100 text-green-800 border-green-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  view: 'bg-slate-100 text-slate-800 border-slate-200',
  login: 'bg-purple-100 text-purple-800 border-purple-200',
  logout: 'bg-orange-100 text-orange-800 border-orange-200',
  settings: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  send_email: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  send_sms: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  export: 'bg-amber-100 text-amber-800 border-amber-200',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean
    log: AuditLog | null
  }>({ open: false, log: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_id && log.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase() === actionFilter.toLowerCase()
    const matchesEntity = entityFilter === 'all' || log.entity.toLowerCase() === entityFilter.toLowerCase()
    
    return matchesSearch && matchesAction && matchesEntity
  })

  const pagination = usePagination(filteredLogs, {
    initialPageSize: 50,
    totalItems: filteredLogs.length
  })

  useEffect(() => {
    loadAuditLogs()
  }, [])

  async function loadAuditLogs() {
    try {
      setIsLoading(true)
      const { success, data, error } = await fetchAuditLogs(100, 0)
      
      if (success && data) {
        setLogs(data)
      } else {
        console.error('Error loading audit logs:', error)
        toast({
          title: 'Error',
          description: 'Failed to load audit logs. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function getActionIcon(action: string) {
    const lowerAction = action.toLowerCase()
    return actionIcons[lowerAction as keyof typeof actionIcons] || Activity
  }

  function getActionColor(action: string) {
    const lowerAction = action.toLowerCase()
    return actionColors[lowerAction as keyof typeof actionColors] || 'bg-slate-100 text-slate-800 border-slate-200'
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString()
  }

  function exportLogs() {
    const csvData = logs.map(log => ({
      'Date': formatDate(log.created_at),
      'User ID': log.user_id || 'System',
      'Action': log.action,
      'Entity': log.entity,
      'Entity ID': log.entity_id || '',
      'IP Address': log.ip_address || '',
      'User Agent': log.user_agent || '',
    }))
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: 'Export successful',
      description: 'Audit logs have been exported to CSV.',
    })
  }

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)))
  const uniqueEntities = Array.from(new Set(logs.map(log => log.entity)))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading audit logs...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-600/90 via-gray-700/90 to-slate-800/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Audit Logs
                </h1>
                <p className="text-xl text-slate-300 mt-2">
                  Track system activity and security events
                </p>
              </div>
            </div>
            
            <Button 
              onClick={exportLogs}
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-300 mt-4">
            <span>• User Activity</span>
            <span>• Data Changes</span>
            <span>• Security Events</span>
            <span>• System Actions</span>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-2xl font-bold">{logs.length}</div>
              <div className="text-slate-300 text-sm">Total Events</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-2xl font-bold">{uniqueActions.length}</div>
              <div className="text-slate-300 text-sm">Action Types</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-2xl font-bold">{uniqueEntities.length}</div>
              <div className="text-slate-300 text-sm">Entity Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/50">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <span>Filter Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search actions, entities, users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Action</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const Icon = getActionIcon(action)
                            return <Icon className="w-4 h-4" />
                          })()}
                          <span className="capitalize">{action.replace('_', ' ')}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Entity</label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    {uniqueEntities.map((entity) => (
                      <SelectItem key={entity} value={entity}>
                        <span className="capitalize">{entity.replace('_', ' ')}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="quarter">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || dateFilter !== 'all') && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50">
                <div className="text-sm text-slate-600">
                  Showing {filteredLogs.length} of {logs.length} events
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setActionFilter('all')
                    setEntityFilter('all')
                    setDateFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <span>Activity Log</span>
                </CardTitle>
                <CardDescription>
                  System activity and security events
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                {filteredLogs.length} Events
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">No Events Found</h3>
                <p className="text-slate-600 text-center max-w-md">
                  {searchTerm || actionFilter || entityFilter ? 
                    'No events match your current filters. Try adjusting your search criteria.' :
                    'No audit events have been recorded yet.'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginatedData.map((log) => {
                    const ActionIcon = getActionIcon(log.action)
                    const actionColor = getActionColor(log.action)
                    
                    return (
                      <TableRow key={log.id} className="border-slate-200/50">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-sm font-medium">
                                {formatDate(log.created_at)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColor}>
                            <ActionIcon className="w-3 h-3 mr-1" />
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-sm font-medium capitalize">
                                {log.entity.replace('_', ' ')}
                              </div>
                              {log.entity_id && (
                                <div className="text-xs text-slate-500">
                                  ID: {log.entity_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm">
                              {log.user_id || 'System'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {log.ip_address || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDetailDialog({ open: true, log })}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            
            {/* Pagination */}
            {filteredLogs.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.pageSize}
                onPageChange={pagination.setCurrentPage}
                onItemsPerPageChange={pagination.setPageSize}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, log: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-slate-600" />
              <span>Event Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this audit event
            </DialogDescription>
          </DialogHeader>
          
          {detailDialog.log && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Timestamp</label>
                  <div className="text-sm text-slate-900 mt-1">
                    {formatDate(detailDialog.log.created_at)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Action</label>
                  <div className="mt-1">
                    {(() => {
                      const ActionIcon = getActionIcon(detailDialog.log.action)
                      const actionColor = getActionColor(detailDialog.log.action)
                      return (
                        <Badge className={actionColor}>
                          <ActionIcon className="w-3 h-3 mr-1" />
                          {detailDialog.log.action.replace('_', ' ')}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Entity</label>
                  <div className="text-sm text-slate-900 mt-1 capitalize">
                    {detailDialog.log.entity.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Entity ID</label>
                  <div className="text-sm text-slate-900 mt-1">
                    {detailDialog.log.entity_id || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">User ID</label>
                  <div className="text-sm text-slate-900 mt-1">
                    {detailDialog.log.user_id || 'System'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">IP Address</label>
                  <div className="text-sm text-slate-900 mt-1">
                    {detailDialog.log.ip_address || 'N/A'}
                  </div>
                </div>
              </div>

              {/* User Agent */}
              {detailDialog.log.user_agent && (
                <div>
                  <label className="text-sm font-medium text-slate-700">User Agent</label>
                  <div className="text-sm text-slate-900 mt-1 p-3 bg-slate-50 rounded-lg">
                    {detailDialog.log.user_agent}
                  </div>
                </div>
              )}

              {/* Changes */}
              {(detailDialog.log.old_values || detailDialog.log.new_values) && (
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900">Data Changes</h3>
                  
                  {detailDialog.log.old_values && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">Previous Values</label>
                      <pre className="text-xs text-slate-900 mt-1 p-3 bg-red-50 rounded-lg overflow-auto">
                        {JSON.stringify(detailDialog.log.old_values, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {detailDialog.log.new_values && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">New Values</label>
                      <pre className="text-xs text-slate-900 mt-1 p-3 bg-green-50 rounded-lg overflow-auto">
                        {JSON.stringify(detailDialog.log.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDetailDialog({ open: false, log: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 