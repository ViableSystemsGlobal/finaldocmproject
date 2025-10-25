'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  PenTool, 
  User,
  Calendar,
  Tag,
  Globe,
  FileText,
  Image
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createBlog, generateSlug } from '@/services/blogs'

export default function NewBlogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    author: '',
    status: 'draft' as 'draft' | 'published',
    tags: [] as string[],
    seo_meta: {
      title: '',
      description: '',
      keywords: [] as string[]
    }
  })
  const [newTag, setNewTag] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: generateSlug(value),
      seo_meta: {
        ...prev.seo_meta,
        title: value || ''
      }
    }))
  }

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Add SEO keyword
  const addKeyword = () => {
    if (newKeyword.trim() && !formData.seo_meta.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        seo_meta: {
          ...prev.seo_meta,
          keywords: [...prev.seo_meta.keywords, newKeyword.trim()]
        }
      }))
      setNewKeyword('')
    }
  }

  // Remove SEO keyword
  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      seo_meta: {
        ...prev.seo_meta,
        keywords: prev.seo_meta.keywords.filter(keyword => keyword !== keywordToRemove)
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.title.trim()) throw new Error('Title is required')
      if (!formData.content.trim()) throw new Error('Content is required')
      if (!formData.author.trim()) throw new Error('Author is required')

      // Prepare data for submission
      const submitData = {
        ...formData,
        published_at: formData.status === 'published' ? new Date().toISOString() : null
      }

      const { data, error } = await createBlog(submitData)
      
      if (error) throw error

      toast({
        title: 'Success',
        description: `Blog post ${formData.status === 'published' ? 'published' : 'saved as draft'} successfully`
      })

      router.push('/content/blogs')
    } catch (error: any) {
      console.error('Error creating blog:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create blog post',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
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
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                <PenTool className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Create New Blog Post
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Write and publish a new blog post for your community
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    Basic Information
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="title">Blog Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Enter blog post title"
                        className="mt-2"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="blog-post-url-slug"
                        className="mt-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">Auto-generated from title</p>
                    </div>

                    <div>
                      <Label htmlFor="author">Author *</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="John Smith"
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="featured_image">Featured Image URL</Label>
                      <Input
                        id="featured_image"
                        value={formData.featured_image}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief summary of the blog post..."
                      className="mt-2"
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">Brief description shown in blog listings</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <PenTool className="h-5 w-5" />
                    </div>
                    Content *
                  </h3>
                </div>
                <div className="p-6">
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your blog post content here..."
                    className="min-h-[400px]"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Write your full blog post content. You can include paragraphs, lists, and other formatting.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Settings */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Globe className="h-5 w-5" />
                    </div>
                    Publish Settings
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="publish">Publish immediately</Label>
                    <Switch
                      id="publish"
                      checked={formData.status === 'published'}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          status: checked ? 'published' : 'draft' 
                        }))
                      }
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {formData.status === 'published' 
                      ? 'Blog post will be published immediately' 
                      : 'Blog post will be saved as draft'
                    }
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Tag className="h-5 w-5" />
                    </div>
                    Tags
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Globe className="h-5 w-5" />
                    </div>
                    SEO Settings
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="seo_description">Meta Description</Label>
                    <Textarea
                      id="seo_description"
                      value={formData.seo_meta.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo_meta: { ...prev.seo_meta, description: e.target.value }
                      }))}
                      placeholder="SEO description for search engines"
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Keywords</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Add keyword"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      />
                      <Button type="button" onClick={addKeyword}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.seo_meta.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : formData.status === 'published' ? 'Publish Blog Post' : 'Save Draft'}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/content/blogs">
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 