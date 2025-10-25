'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PenTool, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Globe, 
  FileText,
  Tag,
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  Loader2
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
import { Pagination } from '@/components/ui/pagination'
import { 
  Blog, 
  fetchBlogs, 
  deleteBlog, 
  publishBlog, 
  unpublishBlog, 
  archiveBlog,
  getBlogMetrics 
} from '@/services/blogs'

export default function BlogsPage() {
  // State
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null)
  const [metrics, setMetrics] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    archivedBlogs: 0,
    recentBlogs: 0
  })

  const ITEMS_PER_PAGE = 10

  // Load blogs and metrics
  const loadBlogs = async () => {
    setLoading(true)
    try {
      const { data, error, count } = await fetchBlogs(
        currentPage,
        ITEMS_PER_PAGE,
        statusFilter,
        searchQuery
      )

      if (error) throw error

      setBlogs(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading blogs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load blogs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const metricsData = await getBlogMetrics()
      setMetrics(metricsData)
    } catch (error) {
      console.error('Error loading blog metrics:', error)
    }
  }

  // Effects
  useEffect(() => {
    loadBlogs()
  }, [currentPage, statusFilter, searchQuery])

  useEffect(() => {
    loadMetrics()
  }, [])

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadBlogs()
  }

  const handleStatusChange = async (blog: Blog, newStatus: 'published' | 'draft' | 'archived') => {
    try {
      let error
      switch (newStatus) {
        case 'published':
          ({ error } = await publishBlog(blog.id))
          break
        case 'draft':
          ({ error } = await unpublishBlog(blog.id))
          break
        case 'archived':
          ({ error } = await archiveBlog(blog.id))
          break
      }

      if (error) throw error

      toast({
        title: 'Success',
        description: `Blog ${newStatus === 'published' ? 'published' : newStatus === 'draft' ? 'saved as draft' : 'archived'} successfully`
      })

      loadBlogs()
      loadMetrics()
    } catch (error) {
      console.error('Error updating blog status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update blog status',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!blogToDelete) return

    try {
      const { error } = await deleteBlog(blogToDelete.id)
      if (error) throw error

      toast({
        title: 'Success',
        description: 'Blog deleted successfully'
      })

      setDeleteDialogOpen(false)
      setBlogToDelete(null)
      loadBlogs()
      loadMetrics()
    } catch (error) {
      console.error('Error deleting blog:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete blog',
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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Blogs</h2>
          <p className="text-slate-600">Fetching blog posts...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <PenTool className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Blog Management
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Create and manage blog posts
                </p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
            >
              <Link href="/content/blogs/new">
                <Plus className="mr-2 h-5 w-5" /> New Blog Post
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Blogs</p>
                  <p className="text-3xl font-bold">{metrics.totalBlogs}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">{metrics.recentBlogs} this month</span>
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
                  <p className="text-3xl font-bold">{metrics.publishedBlogs}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-200" />
                <span className="text-green-100 text-sm font-medium">Live posts</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Edit className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-yellow-100 text-sm font-medium">Drafts</p>
                  <p className="text-3xl font-bold">{metrics.draftBlogs}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-yellow-200" />
                <span className="text-yellow-100 text-sm font-medium">In progress</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Tag className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-gray-100 text-sm font-medium">Archived</p>
                  <p className="text-3xl font-bold">{metrics.archivedBlogs}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-200" />
                <span className="text-gray-100 text-sm font-medium">Not active</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">This Month</p>
                  <p className="text-3xl font-bold">{metrics.recentBlogs}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Recent activity</span>
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
                  placeholder="Search blogs by title, content, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-12">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="h-12 px-8">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Blogs Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              Blog Posts ({totalCount})
            </h3>
            <p className="text-slate-300 mt-1">Manage all your blog posts from this central location</p>
          </div>
          <div className="p-6">
            {blogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first blog post.'
                  }
                </p>
                <Button asChild>
                  <Link href="/content/blogs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Blog
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogs.map((blog) => (
                      <TableRow key={blog.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{blog.title}</div>
                            {blog.excerpt && (
                              <div className="text-sm text-gray-500 max-w-[300px] truncate">
                                {blog.excerpt}
                              </div>
                            )}
                            {blog.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {blog.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {blog.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{blog.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {blog.author}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(blog.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {formatDate(blog.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {blog.published_at ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              {formatDate(blog.published_at)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
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
                                <Link href={`/content/blogs/${blog.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/content/blogs/${blog.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {blog.status === 'draft' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(blog, 'published')}
                                >
                                  <Globe className="mr-2 h-4 w-4" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {blog.status === 'published' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(blog, 'draft')}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Unpublish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(blog, 'archived')}
                              >
                                <Tag className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setBlogToDelete(blog)
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
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{blogToDelete?.title}"? This action cannot be undone.
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