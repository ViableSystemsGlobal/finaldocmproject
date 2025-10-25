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
  Play,
  Youtube,
  Upload,
  Calendar,
  User,
  BookOpen,
  Clock,
  Tag,
  Video,
  Share
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
  fetchSermon, 
  deleteSermon, 
  publishSermon, 
  unpublishSermon, 
  archiveSermon 
} from '@/services/sermons'
import type { Sermon } from '@/services/sermons'

interface SermonDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function SermonDetailPage({ params }: SermonDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [sermon, setSermon] = useState<Sermon | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadSermon()
  }, [resolvedParams.id])

  const loadSermon = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchSermon(resolvedParams.id)
      if (error) throw error
      setSermon(data)
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

  const handleStatusChange = async (newStatus: 'published' | 'draft' | 'archived') => {
    if (!sermon) return

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

      loadSermon()
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
    if (!sermon) return

    try {
      const { error } = await deleteSermon(sermon.id)
      if (error) throw error

      toast({
        title: 'Success',
        description: 'Sermon deleted successfully'
      })

      router.push('/content/sermons')
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
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown'
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
              <Link href="/content/sermons">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sermons
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-2xl">
                  <Video className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {sermon.title}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  {getStatusBadge(sermon.status)}
                  {getVideoTypeBadge(sermon.video_type)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/content/sermons/${sermon.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              
              {sermon.status === 'draft' && (
                <Button onClick={() => handleStatusChange('published')}>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              )}
              
              {sermon.status === 'published' && (
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
            {/* Video Section */}
            {(sermon.video_url || sermon.youtube_url) && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Play className="h-5 w-5" />
                    </div>
                    Video
                  </h3>
                </div>
                <div className="p-6">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    {sermon.video_type === 'youtube' && sermon.youtube_id ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${sermon.youtube_id}`}
                        title={sermon.title}
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : sermon.video_url ? (
                      <video
                        src={sermon.video_url}
                        controls
                        className="w-full h-full rounded-lg"
                        poster={sermon.thumbnail_image}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="text-center">
                        <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Video not available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  Description
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  {sermon.description}
                </p>
              </div>
            </div>

            {/* Notes & Transcript */}
            {(sermon.notes || sermon.transcript) && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    Additional Content
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {sermon.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Sermon Notes</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                          {sermon.notes}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {sermon.transcript && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Transcript</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                          {sermon.transcript}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sermon Details */}
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
                    <p className="text-sm text-gray-500">Speaker</p>
                    <p className="font-medium">{sermon.speaker}</p>
                  </div>
                </div>

                {sermon.series && (
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Series</p>
                      <p className="font-medium">{sermon.series}</p>
                    </div>
                  </div>
                )}

                {sermon.scripture_reference && (
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Scripture</p>
                      <p className="font-medium">{sermon.scripture_reference}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(sermon.sermon_date)}</p>
                  </div>
                </div>

                {sermon.duration && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">{formatDuration(sermon.duration)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Views</p>
                    <p className="font-medium">{sermon.view_count.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {sermon.tags.length > 0 && (
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
                    {sermon.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEO Information */}
            {sermon.seo_meta.description && (
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
                    <p className="text-gray-700">{sermon.seo_meta.description}</p>
                  </div>
                  
                  {sermon.seo_meta.keywords && sermon.seo_meta.keywords.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {sermon.seo_meta.keywords.map((keyword, index) => (
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
            <DialogTitle>Delete Sermon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{sermon.title}"? This action cannot be undone.
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