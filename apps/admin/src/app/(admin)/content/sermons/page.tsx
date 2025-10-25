'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Video, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Globe, 
  Play,
  Youtube,
  Upload,
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  Loader2,
  BookOpen,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MetricCard } from '@/components/MetricCard'
import { Pagination } from '@/components/ui/pagination'
import { 
  Sermon, 
  fetchSermons, 
  deleteSermon, 
  publishSermon, 
  unpublishSermon, 
  archiveSermon,
  getSermonMetrics,
  getSermonSeries,
  getYouTubeThumbnail
} from '@/services/sermons'

export default function SermonsPage() {
  // State
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sermonToDelete, setSermonToDelete] = useState<Sermon | null>(null)
  const [sermonSeries, setSermonSeries] = useState<string[]>([])
  const [metrics, setMetrics] = useState({
    totalSermons: 0,
    publishedSermons: 0,
    draftSermons: 0,
    archivedSermons: 0,
    recentSermons: 0,
    totalViews: 0,
    youtubeSermons: 0,
    uploadSermons: 0
  })

  const ITEMS_PER_PAGE = 10

  // Load sermons and metrics
  const loadSermons = async () => {
    setLoading(true)
    try {
      const { data, error, count } = await fetchSermons(
        currentPage,
        ITEMS_PER_PAGE,
        statusFilter,
        searchQuery,
        seriesFilter
      )

      if (error) throw error

      setSermons(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading sermons:', error)
      toast({
        title: 'Error',
        description: 'Failed to load sermons',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const metricsData = await getSermonMetrics()
      setMetrics(metricsData)
    } catch (error) {
      console.error('Error loading sermon metrics:', error)
    }
  }

  const loadSeries = async () => {
    try {
      const series = await getSermonSeries()
      setSermonSeries(series)
    } catch (error) {
      console.error('Error loading sermon series:', error)
    }
  }

  // Effects
  useEffect(() => {
    loadSermons()
  }, [currentPage, statusFilter, seriesFilter, searchQuery])

  useEffect(() => {
    loadMetrics()
    loadSeries()
  }, [])

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadSermons()
  }

  const handleStatusChange = async (sermon: Sermon, newStatus: 'published' | 'draft' | 'archived') => {
    try {
      let error
      switch (newStatus) {
        case 'published':
          ({ error } = await publishSermon(sermon.id))
          break
        case 'draft':
          ({ error } = await unpublishSermon(sermon.id))
          break
        case 'archived':
          ({ error } = await archiveSermon(sermon.id))
          break
      }

      if (error) throw error

      toast({
        title: 'Success',
        description: `Sermon ${newStatus === 'published' ? 'published' : newStatus === 'draft' ? 'saved as draft' : 'archived'} successfully`
      })

      loadSermons()
      loadMetrics()
    } catch (error) {
      console.error('Error updating sermon status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update sermon status',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!sermonToDelete) return

    try {
      const { error } = await deleteSermon(sermonToDelete.id)
      if (error) throw error

      toast({
        title: 'Success',
        description: 'Sermon deleted successfully'
      })

      setDeleteDialogOpen(false)
      setSermonToDelete(null)
      loadSermons()
      loadMetrics()
    } catch (error) {
      console.error('Error deleting sermon:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete sermon',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
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

  const getVideoTypeBadge = (videoType: string) => {
    switch (videoType) {
      case 'youtube':
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            <Youtube className="w-3 h-3 mr-1" />
            YouTube
          </Badge>
        )
      case 'upload':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Badge>
        )
      default:
        return <Badge variant="outline">{videoType}</Badge>
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Sermons</h2>
          <p className="text-slate-600">Fetching sermon library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-2xl">
                  <Video className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Sermon Management
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage sermons with video uploads and YouTube links
                </p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
            >
              <Link href="/content/sermons/new">
                <Plus className="mr-2 h-5 w-5" /> New Sermon
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Video className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-red-100 text-sm font-medium">Total Sermons</p>
                  <p className="text-3xl font-bold">{metrics.totalSermons}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-200" />
                <span className="text-red-100 text-sm font-medium">{metrics.recentSermons} this month</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Globe className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm font-medium">Published</p>
                  <p className="text-3xl font-bold">{metrics.publishedSermons}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-200" />
                <span className="text-green-100 text-sm font-medium">Live sermons</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Eye className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Views</p>
                  <p className="text-3xl font-bold">{metrics.totalViews.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">All time views</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Youtube className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">YouTube vs Upload</p>
                  <p className="text-3xl font-bold">{metrics.youtubeSermons}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">{metrics.uploadSermons} uploads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Filter className="h-5 w-5" />
              </div>
              Filters
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search sermons by title, speaker, or scripture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-12">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={seriesFilter} onValueChange={setSeriesFilter}>
                <SelectTrigger className="w-[160px] h-12">
                  <SelectValue placeholder="Series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Series</SelectItem>
                  {sermonSeries.map((series) => (
                    <SelectItem key={series} value={series}>
                      {series}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="h-12 px-8">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Sermons Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Video className="h-5 w-5" />
              </div>
              Sermons ({totalCount})
            </h3>
            <p className="text-slate-300 mt-1">Manage all your sermons with video uploads and YouTube integration</p>
          </div>
          <div className="p-6">
            {sermons.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sermons found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all' || seriesFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first sermon.'
                  }
                </p>
                <Button asChild>
                  <Link href="/content/sermons/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Sermon
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sermon</TableHead>
                      <TableHead>Speaker</TableHead>
                      <TableHead>Series</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sermons.map((sermon) => (
                      <TableRow key={sermon.id}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {sermon.thumbnail_image ? (
                                <img 
                                  src={sermon.thumbnail_image} 
                                  alt={sermon.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <Play className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{sermon.title}</div>
                              {sermon.scripture_reference && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {sermon.scripture_reference}
                                </div>
                              )}
                              {sermon.duration && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(sermon.duration)}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {sermon.speaker}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sermon.series ? (
                            <Badge variant="outline">{sermon.series}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getVideoTypeBadge(sermon.video_type)}</TableCell>
                        <TableCell>{getStatusBadge(sermon.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {formatDate(sermon.sermon_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Eye className="h-4 w-4" />
                            {sermon.view_count.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/content/sermons/${sermon.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/content/sermons/${sermon.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {sermon.status === 'draft' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(sermon, 'published')}
                                >
                                  <Globe className="mr-2 h-4 w-4" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {sermon.status === 'published' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(sermon, 'draft')}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Unpublish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(sermon, 'archived')}
                              >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setSermonToDelete(sermon)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newSize: number) => {
                      // Since this page uses server-side pagination, we would need to update the API call
                      // For now, just show the UI component - full implementation would require API changes
                      console.log('Page size change to:', newSize)
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sermon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{sermonToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 