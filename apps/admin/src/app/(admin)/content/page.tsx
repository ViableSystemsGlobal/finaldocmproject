'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Eye, Trash2, Globe, FileText, Activity, TrendingUp, Users, Video, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { fetchPages, deletePage, isPublished, Page } from '@/services/content'
import { safeFormatDate } from '@/lib/utils'

export default function ContentPages() {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchPages()
      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error('Error loading pages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load pages',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (page: Page) => {
    setPageToDelete(page)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!pageToDelete) return

    try {
      const { error } = await deletePage(pageToDelete.id)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Page deleted successfully',
      })
      
      // Refresh the page list
      loadPages()
    } catch (error) {
      console.error('Error deleting page:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setPageToDelete(null)
    }
  }

  const publishedPages = pages.filter(page => isPublished(page))
  const draftPages = pages.filter(page => !isPublished(page))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Content</h2>
          <p className="text-slate-600">Fetching pages...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-2xl">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Content Management
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Create and manage your website content
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/content/new">
                  <Plus className="mr-2 h-5 w-5" /> New Page
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Pages</p>
                  <p className="text-3xl font-bold">{pages.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">All pages</span>
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
                  <p className="text-3xl font-bold">{publishedPages.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Live pages</span>
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
                  <p className="text-3xl font-bold">{draftPages.length}</p>
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
                  <p className="text-amber-100 text-sm font-medium">Active Rate</p>
                  <p className="text-3xl font-bold">{pages.length > 0 ? Math.round((publishedPages.length / pages.length) * 100) : 0}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Published ratio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Blogs */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Blog Posts</CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Articles & written content
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Create and publish blog posts, articles, and written content for your church community.
              </p>
              <div className="flex gap-2">
                <Button 
                  asChild 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg rounded-lg"
                >
                  <Link href="/content/blogs">
                    <BookOpen className="mr-2 h-4 w-4" /> Manage
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg"
                >
                  <Link href="/content/blogs/new">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sermons */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Sermons</CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Video & audio messages
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Upload and manage sermon videos, audio recordings, and related content for your congregation.
              </p>
              <div className="flex gap-2">
                <Button 
                  asChild 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg rounded-lg"
                >
                  <Link href="/content/sermons">
                    <Video className="mr-2 h-4 w-4" /> Manage
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-lg"
                >
                  <Link href="/content/sermons/new">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Table */}
        <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              All Pages
            </CardTitle>
            <CardDescription>
              Manage your website pages, edit content, and control publication status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur"></div>
                  <div className="relative bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-2xl">
                    <FileText className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No pages found</h3>
                    <p className="text-slate-600 mb-6">
                      Get started by creating your first page.
                    </p>
                    <Button 
                      asChild
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
                    >
                      <Link href="/content/new">
                        <Plus className="mr-2 h-5 w-5" /> Create Page
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
                      <TableHead className="font-semibold text-slate-700">Title</TableHead>
                      <TableHead className="font-semibold text-slate-700">Slug</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Last Updated</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pages.map((page) => (
                      <TableRow key={page.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-800">{page.title}</TableCell>
                        <TableCell className="text-slate-600">/{page.slug}</TableCell>
                        <TableCell>
                          {isPublished(page) ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Published</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">{safeFormatDate(page.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => router.push(`/content/${page.id}`)}
                              className="h-8 w-8 hover:bg-blue-50 hover:border-blue-200 text-slate-600"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(`/preview/${page.slug}`, '_blank')}
                              className="h-8 w-8 hover:bg-purple-50 hover:border-purple-200 text-slate-600"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Preview</span>
                            </Button>
                            {isPublished(page) && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.open(`/${page.slug}`, '_blank')}
                                className="h-8 w-8 hover:bg-emerald-50 hover:border-emerald-200 text-slate-600"
                              >
                                <Globe className="h-4 w-4" />
                                <span className="sr-only">View Live</span>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteClick(page)}
                              className="h-8 w-8 hover:bg-red-50 hover:border-red-200 text-slate-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border border-white/20">
            <DialogHeader>
              <DialogTitle>Delete Page</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{pageToDelete?.title}&quot;? This action cannot be undone.
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