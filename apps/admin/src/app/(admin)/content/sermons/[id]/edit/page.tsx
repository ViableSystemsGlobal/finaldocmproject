'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'
import { 
  ArrowLeft, 
  Save, 
  Video, 
  Youtube, 
  Upload, 
  Calendar,
  User,
  BookOpen,
  Clock,
  Tag,
  Globe,
  FileText
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  fetchSermon, 
  updateSermon, 
  generateSlug, 
  extractYouTubeId 
} from '@/services/sermons'
import type { Sermon } from '@/services/sermons'

interface EditSermonPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditSermonPage({ params }: EditSermonPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sermon, setSermon] = useState<Sermon | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    speaker: '',
    series: '',
    scripture_reference: '',
    sermon_date: '',
    duration: '',
    video_type: 'upload' as 'upload' | 'youtube',
    video_url: '',
    youtube_url: '',
    audio_url: '',
    thumbnail_image: '',
    transcript: '',
    notes: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    seo_meta: {
      title: '',
      description: '',
      keywords: [] as string[]
    }
  })
  const [newTag, setNewTag] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  useEffect(() => {
    loadSermon()
  }, [resolvedParams.id])

  const loadSermon = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchSermon(resolvedParams.id)
      if (error) throw error
      
      if (!data) throw new Error('Sermon not found')
      
      setSermon(data)
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        description: data.description || '',
        speaker: data.speaker || '',
        series: data.series || '',
        scripture_reference: data.scripture_reference || '',
        sermon_date: data.sermon_date?.split('T')[0] || '',
        duration: data.duration?.toString() || '',
        video_type: data.video_type || 'upload',
        video_url: data.video_url || '',
        youtube_url: data.youtube_url || '',
        audio_url: data.audio_url || '',
        thumbnail_image: data.thumbnail_image || '',
        transcript: data.transcript || '',
        notes: data.notes || '',
        tags: data.tags || [],
        status: data.status || 'draft',
        seo_meta: {
          title: data.seo_meta?.title || '',
          description: data.seo_meta?.description || '',
          keywords: data.seo_meta?.keywords || []
        }
      })
    } catch (error) {
      console.error('Error loading sermon:', error)
      toast({
        title: 'Error',
        description: 'Failed to load sermon',
        variant: 'destructive'
      })
      router.push('/content/sermons')
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug === generateSlug(prev.title) ? generateSlug(value) : prev.slug,
      seo_meta: {
        ...prev.seo_meta,
        title: value || ''
      }
    }))
  }

  // Handle YouTube URL and extract metadata
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false)
  
  const handleYouTubeUrlChange = async (value: string) => {
    setFormData(prev => ({
      ...prev,
      youtube_url: value
    }))
    
    if (value && (value.includes('youtube.com/watch') || value.includes('youtu.be/'))) {
      setIsLoadingYouTube(true)
      
      try {
        const response = await fetch('/api/youtube/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: value })
        })
        
        const result = await response.json()
        
        if (result.success && result.data) {
          const data = result.data
          
          // Ask user if they want to auto-fill since this is edit mode
          const shouldFill = confirm(
            'YouTube video information found! Do you want to auto-fill empty fields?\n\n' +
            `Title: ${data.title}\n` +
            `Description: ${data.description ? data.description.substring(0, 100) + '...' : 'None'}\n` +
            `Duration: ${data.duration || 'None'}\n` +
            `Channel: ${data.channelTitle || 'None'}`
          )
          
          if (shouldFill) {
            // Auto-fill form data if fields are empty
            setFormData(prev => ({
              ...prev,
              title: prev.title || data.title,
              slug: (!prev.title && !prev.slug) ? generateSlug(data.title) : prev.slug,
              description: prev.description || data.description,
              thumbnail_image: prev.thumbnail_image || data.thumbnail,
              duration: prev.duration || data.duration,
              speaker: prev.speaker || data.channelTitle,
              seo_meta: {
                ...prev.seo_meta,
                title: prev.seo_meta.title || data.title,
                description: prev.seo_meta.description || data.description,
              },
              tags: prev.tags.length === 0 ? data.tags.slice(0, 5) : prev.tags
            }))
            
            toast({
              title: 'Success',
              description: 'YouTube video information loaded successfully!'
            })
          } else {
            // Just update thumbnail if empty
            if (!formData.thumbnail_image && data.thumbnail) {
              setFormData(prev => ({
                ...prev,
                thumbnail_image: data.thumbnail
              }))
            }
          }
        } else {
          toast({
            title: 'Warning',
            description: result.error || 'Could not extract video information',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Error fetching YouTube metadata:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch video information',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingYouTube(false)
      }
    }
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
    setSaving(true)

    try {
      // Validation
      if (!formData.title.trim()) throw new Error('Title is required')
      if (!formData.description.trim()) throw new Error('Description is required')
      if (!formData.speaker.trim()) throw new Error('Speaker is required')
      if (!formData.sermon_date) throw new Error('Sermon date is required')

      // Prepare data for submission
      const submitData = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        published_at: formData.status === 'published' && sermon?.status !== 'published' 
          ? new Date().toISOString() 
          : formData.status !== 'published' 
          ? null 
          : sermon?.published_at
      }

      const { data, error } = await updateSermon(resolvedParams.id, submitData)
      
      if (error) throw error

      toast({
        title: 'Success',
        description: `Sermon updated successfully`
      })

      router.push(`/content/sermons/${resolvedParams.id}`)
    } catch (error: any) {
      console.error('Error updating sermon:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update sermon',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Sermon</h2>
          <p className="text-slate-600">Fetching sermon details...</p>
        </div>
      </div>
    )
  }

  if (!sermon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sermon not found</h3>
          <p className="text-gray-500 mb-6">The sermon you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/content/sermons">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sermons
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
              <Link href={`/content/sermons/${resolvedParams.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sermon
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-2xl">
                <Video className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Edit Sermon
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Update sermon details and content
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
                      <Label htmlFor="title">Sermon Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Enter sermon title"
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
                        placeholder="sermon-url-slug"
                        className="mt-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">Auto-generated from title</p>
                    </div>

                    <div>
                      <Label htmlFor="speaker">Speaker *</Label>
                      <Input
                        id="speaker"
                        value={formData.speaker}
                        onChange={(e) => setFormData(prev => ({ ...prev, speaker: e.target.value }))}
                        placeholder="Pastor John Smith"
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="series">Series</Label>
                      <Input
                        id="series"
                        value={formData.series}
                        onChange={(e) => setFormData(prev => ({ ...prev, series: e.target.value }))}
                        placeholder="Faith in Action"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="scripture">Scripture Reference</Label>
                      <Input
                        id="scripture"
                        value={formData.scripture_reference}
                        onChange={(e) => setFormData(prev => ({ ...prev, scripture_reference: e.target.value }))}
                        placeholder="Romans 5:3-5"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="date">Sermon Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.sermon_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, sermon_date: e.target.value }))}
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="45"
                        className="mt-2"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter sermon description..."
                      className="mt-2"
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Video Content */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Video className="h-5 w-5" />
                    </div>
                    Video Content
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <Label>Video Type</Label>
                    <Select 
                      value={formData.video_type} 
                      onValueChange={(value: 'upload' | 'youtube') => 
                        setFormData(prev => ({ ...prev, video_type: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upload">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload Video File
                          </div>
                        </SelectItem>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4" />
                            YouTube Link
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.video_type === 'upload' && (
                    <div>
                      <Label htmlFor="video_url">Video File URL</Label>
                      <Input
                        id="video_url"
                        value={formData.video_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                        placeholder="https://example.com/video.mp4"
                        className="mt-2"
                      />
                    </div>
                  )}

                  {formData.video_type === 'youtube' && (
                    <div>
                      <Label htmlFor="youtube_url" className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" />
                        YouTube URL
                        {isLoadingYouTube && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                            <span className="text-xs">Loading...</span>
                          </div>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="youtube_url"
                          value={formData.youtube_url}
                          onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... (Auto-fills form fields)"
                          className="mt-2"
                          disabled={isLoadingYouTube}
                        />
                        {isLoadingYouTube && (
                          <div className="absolute right-3 top-4">
                            <div className="animate-spin rounded-full h-4 w-4 border border-blue-600 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                        <span>✨</span>
                        Automatically extracts title, description, thumbnail, and duration
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="audio_url">Audio URL (Optional)</Label>
                    <Input
                      id="audio_url"
                      value={formData.audio_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, audio_url: e.target.value }))}
                      placeholder="https://example.com/audio.mp3"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="thumbnail">Thumbnail Image URL</Label>
                    <Input
                      id="thumbnail"
                      value={formData.thumbnail_image}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_image: e.target.value }))}
                      placeholder="https://example.com/thumbnail.jpg"
                      className="mt-2"
                    />
                    {formData.video_type === 'youtube' && (
                      <p className="text-sm text-gray-500 mt-1">Auto-generated from YouTube URL</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Content */}
              <Tabs defaultValue="notes" className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <TabsList className="bg-white/20">
                    <TabsTrigger value="notes" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-800">
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="transcript" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-800">
                      Transcript
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="notes" className="p-6">
                  <div>
                    <Label htmlFor="notes">Sermon Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add sermon notes, outline, or additional content..."
                      className="mt-2"
                      rows={8}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="transcript" className="p-6">
                  <div>
                    <Label htmlFor="transcript">Sermon Transcript</Label>
                    <Textarea
                      id="transcript"
                      value={formData.transcript}
                      onChange={(e) => setFormData(prev => ({ ...prev, transcript: e.target.value }))}
                      placeholder="Add the full sermon transcript..."
                      className="mt-2"
                      rows={8}
                    />
                  </div>
                </TabsContent>
              </Tabs>
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
                    Status
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <Label>Publication Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: 'draft' | 'published' | 'archived') => 
                        setFormData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Update Sermon'}
                </Button>
                
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href={`/content/sermons/${resolvedParams.id}`}>
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