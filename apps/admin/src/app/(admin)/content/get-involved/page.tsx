'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  Edit, 
  Trash2, 
  Eye, 
  Globe,
  Users,
  Heart,
  Activity,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { 
  fetchGetInvolvedTemplates, 
  deleteGetInvolvedTemplate, 
  publishGetInvolvedTemplate,
  unpublishGetInvolvedTemplate,
  archiveGetInvolvedTemplate,
  getGetInvolvedMetrics,
  getTemplateCategories,
  GetInvolvedTemplate 
} from '@/services/getInvolved'
import { safeFormatDate } from '@/lib/utils'

export default function GetInvolvedPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<GetInvolvedTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<GetInvolvedTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<GetInvolvedTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [metrics, setMetrics] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
    publishRate: 0,
    loading: true
  })

  const categories = getTemplateCategories()

  useEffect(() => {
    loadTemplates()
    loadMetrics()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [templates, searchQuery, categoryFilter, statusFilter])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchGetInvolvedTemplates()
      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load Get Involved templates',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const { data, error } = await getGetInvolvedMetrics()
      if (error) throw error
      
      setMetrics({
        ...data,
        loading: false
      })
    } catch (error) {
      console.error('Error loading metrics:', error)
      setMetrics(prev => ({ ...prev, loading: false }))
    }
  }

  const applyFilters = () => {
    let filtered = [...templates]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      )
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter)
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(template => template.status === statusFilter)
    }
    
    setFilteredTemplates(filtered)
  }

  const handleDeleteClick = (template: GetInvolvedTemplate) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    try {
      const { error } = await deleteGetInvolvedTemplate(templateToDelete.id)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      })
      
      loadTemplates()
      loadMetrics()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    }
  }

  const handleStatusChange = async (template: GetInvolvedTemplate, newStatus: 'published' | 'draft' | 'archived') => {
    try {
      let error
      switch (newStatus) {
        case 'published':
          ({ error } = await publishGetInvolvedTemplate(template.id))
          break
        case 'draft':
          ({ error } = await unpublishGetInvolvedTemplate(template.id))
          break
        case 'archived':
          ({ error } = await archiveGetInvolvedTemplate(template.id))
          break
      }

      if (error) throw error

      toast({
        title: 'Success',
        description: `Template ${newStatus === 'published' ? 'published' : newStatus === 'draft' ? 'saved as draft' : 'archived'} successfully`
      })

      loadTemplates()
      loadMetrics()
    } catch (error) {
      console.error('Error updating template status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryInfo = (category: string) => {
    const info = categories.find(c => c.value === category)
    return info || { label: category, icon: '⭐' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Templates</h2>
          <p className="text-slate-600">Fetching Get Involved templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
              <Link href="/content">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Content
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Get Involved Templates
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage ministry opportunities and community engagement
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                asChild
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/content/get-involved/new">
                  <Plus className="mr-2 h-5 w-5" /> New Template
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Templates</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.total
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">All templates</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Globe className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Published</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.published
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Live opportunities</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Edit className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Drafts</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.drafts
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Work in progress</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Publish Rate</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${metrics.publishRate}%`
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Published ratio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Templates Table */}
        <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Get Involved Templates
            </CardTitle>
            <CardDescription>
              Manage opportunities for community engagement and ministry involvement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur"></div>
                  <div className="relative bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl">
                    <Users className="mx-auto h-16 w-16 text-purple-500 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' 
                        ? 'No templates match your filters' 
                        : 'No templates found'
                      }
                    </h3>
                    <p className="text-slate-600 mb-6">
                      {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your search criteria.'
                        : 'Get started by creating your first Get Involved template.'
                      }
                    </p>
                    <Button 
                      asChild
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
                    >
                      <Link href="/content/get-involved/new">
                        <Plus className="mr-2 h-5 w-5" /> Create Template
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200/50">
                      <TableHead className="font-semibold text-slate-700">Template</TableHead>
                      <TableHead className="font-semibold text-slate-700">Category</TableHead>
                      <TableHead className="font-semibold text-slate-700">Ministry</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Last Updated</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => {
                      const categoryInfo = getCategoryInfo(template.category)
                      return (
                        <TableRow key={template.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{template.icon_emoji || '🤝'}</div>
                              <div>
                                <div className="font-medium text-slate-800">{template.title}</div>
                                <div className="text-sm text-slate-500 truncate max-w-xs">{template.excerpt}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{categoryInfo.icon}</span>
                              <span className="text-slate-600">{categoryInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {template.ministry_group?.name || 'No ministry linked'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(template.status)}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {safeFormatDate(template.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.push(`/content/get-involved/${template.id}`)}
                                className="h-8 w-8 hover:bg-blue-50 hover:border-blue-200 text-slate-600"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.push(`/content/get-involved/${template.id}/edit`)}
                                className="h-8 w-8 hover:bg-purple-50 hover:border-purple-200 text-slate-600"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              {template.status === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleStatusChange(template, 'published')}
                                  className="h-8 w-8 hover:bg-emerald-50 hover:border-emerald-200 text-slate-600"
                                >
                                  <Globe className="h-4 w-4" />
                                  <span className="sr-only">Publish</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteClick(template)}
                                className="h-8 w-8 hover:bg-red-50 hover:border-red-200 text-slate-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border border-white/20">
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{templateToDelete?.title}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 