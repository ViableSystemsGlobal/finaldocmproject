'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Globe, 
  Eye,
  PenTool,
  Calendar,
  User,
  Tag,
  FileText,
  Image
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  fetchBlog, 
  deleteBlog, 
  publishBlog, 
  unpublishBlog, 
  archiveBlog 
} from '@/services/blogs'
import type { Blog } from '@/services/blogs'

interface BlogDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadBlog()
  }, [resolvedParams.id])

  const loadBlog = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchBlog(resolvedParams.id)
      if (error) throw error
      setBlog(data)
    } catch (error) {
      console.error('Error loading blog:', error)
      toast({
        title: 'Error',
        description: 'Failed to load blog post',
        variant: 'destructive'
      })
      router.push('/content/blogs')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'published' | 'draft' | 'archived') => {
    if (!blog) return

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
        description: `Blog post ${newStatus === 'published' ? 'published' : newStatus === 'draft' ? 'saved as draft' : 'archived'} successfully`
      })

      loadBlog()
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
    if (!blog) return

    try {
      const { error } = await deleteBlog(blog.id)
      if (error) throw error

      toast({
        title: 'Success',
        description: 'Blog post deleted successfully'
      })

      router.push('/content/blogs')
    } catch (error) {
      console.error('Error deleting blog:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete blog post',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Blog Post</h2>
          <p className="text-slate-600">Fetching blog details...</p>
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <PenTool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Blog post not found</h3>
          <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/content/blogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
              <Link href="/content/blogs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blogs
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <PenTool className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {blog.title}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  {getStatusBadge(blog.status)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/content/blogs/${blog.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              
              {blog.status === 'draft' && (
                <Button onClick={() => handleStatusChange('published')}>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              )}
              
              {blog.status === 'published' && (
                <Button variant="outline" onClick={() => handleStatusChange('draft')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Unpublish
                </Button>
              )}
              
              <Button 
                variant="destructive" 
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured Image */}
            {blog.featured_image && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Image className="h-5 w-5" />
                    </div>
                    Featured Image
                  </h3>
                </div>
                <div className="p-6">
                  <img
                    src={blog.featured_image}
                    alt={blog.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Excerpt */}
            {blog.excerpt && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    Excerpt
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {blog.excerpt}
                  </p>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <PenTool className="h-5 w-5" />
                  </div>
                  Content
                </h3>
              </div>
              <div className="p-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
                    {blog.content}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Blog Details */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Details
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Author</p>
                    <p className="font-medium">{blog.author}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(blog.created_at)}</p>
                  </div>
                </div>

                {blog.published_at && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Published</p>
                      <p className="font-medium">{formatDate(blog.published_at)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Edit className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(blog.updated_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Slug</p>
                    <p className="font-medium font-mono text-sm">{blog.slug}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Tag className="h-5 w-5" />
                    </div>
                    Tags
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEO Information */}
            {blog.seo_meta.description && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Globe className="h-5 w-5" />
                    </div>
                    SEO
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Meta Description</p>
                    <p className="text-gray-700">{blog.seo_meta.description}</p>
                  </div>
                  
                  {blog.seo_meta.keywords && blog.seo_meta.keywords.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {blog.seo_meta.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
              Are you sure you want to delete "{blog.title}"? This action cannot be undone.
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