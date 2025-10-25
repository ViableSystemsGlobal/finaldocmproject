'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Upload, Copy, Trash2, ImageIcon, FileIcon, Video, Image, Activity, TrendingUp, ChevronLeft, ChevronRight, Play, Clock, Eye, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'
import { fetchMedia, deleteMedia, uploadmedia, MediaItem } from '@/services/media'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

// VideoThumbnail component to generate thumbnails from video URLs
const VideoThumbnail = ({ src, alt, className }: { src: string; alt?: string; className?: string }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateThumbnail = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      if (!video || !canvas) return

      const context = canvas.getContext('2d')
      if (!context) return

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 240

      // Draw the current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to data URL
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
      setThumbnail(thumbnailUrl)
      setLoading(false)
    }

    const handleLoadedMetadata = () => {
      const video = videoRef.current
      if (!video) return

      // Seek to 2 seconds or 10% of duration, whichever is smaller
      const seekTime = Math.min(2, video.duration * 0.1)
      video.currentTime = seekTime
    }

    const handleSeeked = () => {
      // Small delay to ensure frame is rendered
      setTimeout(generateThumbnail, 100)
    }

    const handleError = () => {
      setError(true)
      setLoading(false)
    }

    const video = videoRef.current
    if (video) {
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('seeked', handleSeeked)
      video.addEventListener('error', handleError)
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('seeked', handleSeeked)
        video.removeEventListener('error', handleError)
      }
    }
  }, [src])

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 relative">
        <Video className="h-12 w-12 text-slate-500 mb-2" />
        <span className="text-xs text-slate-600 font-medium">Video File</span>
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
          VIDEO
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative">
      {/* Hidden video element for thumbnail generation */}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        muted
        className="hidden"
        crossOrigin="anonymous"
      />
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />
      
      {loading ? (
        <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 relative">
          <div className="animate-pulse">
            <Video className="h-12 w-12 text-slate-400 mb-2" />
          </div>
          <span className="text-xs text-slate-600 font-medium">Loading...</span>
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            VIDEO
          </div>
        </div>
      ) : thumbnail ? (
        <div className="h-full w-full relative">
          <img 
            src={thumbnail} 
            alt={alt || 'Video thumbnail'} 
            className={`h-full w-full object-cover ${className || ''}`}
          />
          {/* Video overlay indicators */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            VIDEO
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Video</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function MediaLibraryPage() {
  const router = useRouter()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null)
  
  // Media viewer states
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerItem, setViewerItem] = useState<MediaItem | null>(null)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12) // 12 items per page for nice grid layout
  
  // Upload states
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [altText, setAltText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Collection fields
  const [collectionName, setCollectionName] = useState('')
  const [collectionCategory, setCollectionCategory] = useState('')
  const [collectionDate, setCollectionDate] = useState('')
  const [description, setDescription] = useState('')

  const categories = [
    'Sunday Service',
    'Youth Ministry',
    'Prayer Meeting',
    'Bible Study',
    'Community Outreach',
    'Special Events',
    'Baptisms',
    'Fellowship',
    'Worship Night',
    'Missions',
    'Kids Ministry',
    'Mens Ministry',
    'Womens Ministry'
  ]
  
  // Load media on mount
  useEffect(() => {
    loadMedia()
  }, [])
  
  // Filter media when tab or search changes
  useEffect(() => {
    filterMedia()
  }, [mediaItems, activeTab, searchQuery])
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredItems.length, searchQuery, activeTab])

  // Calculate pagination data
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageItems = filteredItems.slice(startIndex, endIndex)
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const loadMedia = async () => {
    try {
      setLoading(true)
      
      // Direct fetch from the upload-media endpoint which we know works
      const response = await fetch('/api/upload-media', {
        method: 'GET'
      })
      
      if (!response.ok) {
        // Fallback: Use empty array for now until API routes are working
        console.log('API not responding, showing empty media library')
        setMediaItems([])
        return
      }

      const result = await response.json()
      setMediaItems(result.data || [])
    } catch (error) {
      console.error('Error loading media:', error)
      // Show empty state instead of error for better UX
      setMediaItems([])
      toast({
        title: 'Media Library',
        description: 'Loading media library...',
        variant: 'default'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const filterMedia = () => {
    let items = [...mediaItems]
    
    // Filter by type
    if (activeTab !== 'all') {
      items = items.filter(item => item.type === activeTab)
    }
    
    // Filter by search
    if (searchQuery) {
      items = items.filter(item => 
        item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.alt_text && item.alt_text.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    setFilteredItems(items)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      const validFiles: File[] = []
      
      for (const file of files) {
        // Check file size (100MB limit)
        const maxSize = 100 * 1024 * 1024 // 100MB in bytes
        if (file.size > maxSize) {
          toast({
            title: 'File too large',
            description: `${file.name} is too large. Max size: 100MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
            variant: 'destructive',
          })
          continue
        }
        
        // Check file type
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'
        ]
        
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: 'File type not supported',
            description: `${file.name} is not supported. Type: ${file.type}`,
            variant: 'destructive',
          })
          continue
        }
        
        validFiles.push(file)
      }
      
      if (validFiles.length > 0) {
        setUploadFiles(validFiles)
        toast({
          title: 'Files Selected',
          description: `${validFiles.length} file(s) ready for upload`,
        })
      }
    }
  }
  
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return
    
    setUploading(true)
    let successCount = 0
    let errorCount = 0
    
    try {
      for (const file of uploadFiles) {
        try {
          console.log('Uploading file:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
          })
          
          const { data, error } = await uploadmedia(file, altText || `${collectionName} - ${file.name}`, {
            collectionName: collectionName || undefined,
            collectionCategory: collectionCategory || undefined,
            collectionDate: collectionDate || undefined,
            description: description || undefined
          })
          
          if (error) {
            console.error('Upload error for', file.name, ':', error)
            errorCount++
          } else {
            successCount++
          }
        } catch (fileError) {
          console.error('Error uploading', file.name, ':', fileError)
          errorCount++
        }
      }
      
      // Show results
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: 'Success!',
          description: `All ${successCount} files uploaded to "${collectionName}" collection`,
        })
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: 'Partially Complete',
          description: `${successCount} files uploaded, ${errorCount} failed`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${errorCount} files`,
          variant: 'destructive',
        })
      }
      
      // Reset form
      setUploadFiles([])
      setAltText('')
      setCollectionName('')
      setCollectionCategory('')
      setCollectionDate('')
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Reload media list
      console.log('🔄 Reloading media list after upload...')
      await loadMedia()
      console.log('✅ Media list reloaded')
    } catch (error) {
      console.error('Error during upload process:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }
  
  const handleDelete = (item: MediaItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = async () => {
    if (!itemToDelete) return
    
    try {
      const { error } = await deleteMedia(itemToDelete.id)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Media deleted successfully',
      })
      
      // Reload media list
      loadMedia()
    } catch (error) {
      console.error('Error deleting media:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete media',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard',
    })
  }

  const imageItems = mediaItems.filter(item => item.type === 'image')
  const videoItems = mediaItems.filter(item => item.type === 'video')
  const fileItems = mediaItems.filter(item => item.type === 'application')

  const handleViewMedia = (item: MediaItem) => {
    setViewerItem(item)
    setViewerOpen(true)
  }

  const closeViewer = () => {
    setViewerOpen(false)
    setViewerItem(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Media Library</h2>
          <p className="text-slate-600">Fetching media files...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                  <Image className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Media Library
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage your images, videos, and files
                </p>
              </div>
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
                  <ImageIcon className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Files</p>
                  <p className="text-3xl font-bold">{mediaItems.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">All media files</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Image className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Images</p>
                  <p className="text-3xl font-bold">{imageItems.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Image files</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Video className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Videos</p>
                  <p className="text-3xl font-bold">{videoItems.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Video files</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FileIcon className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Documents</p>
                  <p className="text-3xl font-bold">{fileItems.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Document files</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-500" />
                  Browse Media
                </CardTitle>
                <CardDescription>
                  View and manage your media files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search media..."
                        className="pl-8 bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Tabs 
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full sm:w-auto"
                    >
                      <TabsList className="bg-white/50 border border-white/20 rounded-xl p-1">
                        <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                        <TabsTrigger value="image" className="rounded-lg">Images</TabsTrigger>
                        <TabsTrigger value="video" className="rounded-lg">Videos</TabsTrigger>
                        <TabsTrigger value="application" className="rounded-lg">Files</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur"></div>
                        <div className="relative bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl">
                          <ImageIcon className="mx-auto h-16 w-16 text-purple-500 mb-4" />
                          <h3 className="text-xl font-semibold text-slate-800 mb-2">No media items found</h3>
                          {searchQuery ? (
                            <div className="space-y-4">
                              <p className="text-slate-600">No files match your search criteria.</p>
                              <Button 
                                variant="outline"
                                onClick={() => setSearchQuery('')}
                                className="border-2 border-purple-200 hover:bg-purple-50"
                              >
                                Clear Search
                              </Button>
                            </div>
                          ) : (
                            <p className="text-slate-600">Upload your first media file to get started.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {currentPageItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="border border-white/20 rounded-xl overflow-hidden group bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300 cursor-pointer"
                          onClick={() => handleViewMedia(item)}
                        >
                          <div className="aspect-square relative">
                            {item.type === 'image' ? (
                              <img 
                                src={item.url} 
                                alt={item.alt_text || ''} 
                                className="h-full w-full object-cover"
                              />
                            ) : item.type === 'video' ? (
                              <VideoThumbnail
                                src={item.url}
                                alt={item.alt_text || 'Video thumbnail'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-slate-100">
                                <FileIcon className="h-12 w-12 text-slate-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewMedia(item)
                                  }}
                                  className="bg-white/90 hover:bg-white"
                                  title="View media"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(item.url)
                                  }}
                                  className="bg-white/90 hover:bg-white"
                                  title="Copy URL"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(item)
                                  }}
                                  className="bg-red-500/90 hover:bg-red-500"
                                  title="Delete media"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="text-sm truncate font-medium text-slate-800">
                              {item.alt_text || item.url.split('/').pop() || 'Untitled'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(item.uploaded_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Pagination Controls */}
                  {filteredItems.length > itemsPerPage && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      totalItems={filteredItems.length}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={(newSize) => setItemsPerPage(newSize)}
                      className="bg-white/20 border-white/20"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-500" />
                  Upload Media Collection
                </CardTitle>
                <CardDescription>
                  Upload multiple files from a service or event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Collection Info Section */}
                  <div className="space-y-4 p-4 bg-blue-50/80 border border-blue-200 rounded-xl">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      📂 Collection Information
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="collection-name">Collection Name</Label>
                        <Input
                          id="collection-name"
                          value={collectionName}
                          onChange={(e) => setCollectionName(e.target.value)}
                          placeholder="e.g. Sunday Service March 2024"
                          className="bg-white/80 border-2 border-blue-200"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="collection-category">Service/Program</Label>
                          <select
                            id="collection-category"
                            value={collectionCategory}
                            onChange={(e) => setCollectionCategory(e.target.value)}
                            className="flex h-10 w-full rounded-md border-2 border-blue-200 bg-white/80 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select category...</option>
                            {categories.map(category => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="collection-date">Event Date</Label>
                          <Input
                            id="collection-date"
                            type="date"
                            value={collectionDate}
                            onChange={(e) => setCollectionDate(e.target.value)}
                            className="bg-white/80 border-2 border-blue-200"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description of the event"
                          className="bg-white/80 border-2 border-blue-200"
                        />
                      </div>
                    </div>

                    <div className="text-sm text-blue-700 bg-blue-100/50 p-3 rounded-lg">
                      <p><strong>💡 How to Upload Collections:</strong></p>
                      <p>• Fill in collection info above</p>
                      <p>• Select multiple files from your service/event</p>
                      <p>• All files will be organized under this collection</p>
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Select Files</Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50">
                      {uploadFiles.length > 0 ? (
                        <div className="space-y-4">
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                            <p className="font-medium text-slate-800">{uploadFiles.length} Files Selected</p>
                            <p className="text-sm text-slate-500">Ready for upload to collection</p>
                          </div>
                          
                          {/* File Preview Grid */}
                          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                            {uploadFiles.slice(0, 6).map((file, index) => (
                              <div key={index} className="relative h-16 w-16 rounded-lg overflow-hidden mx-auto">
                                {file.type.startsWith('image/') ? (
                                  <img 
                                    src={URL.createObjectURL(file)} 
                                    alt={file.name} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : file.type.startsWith('video/') ? (
                                  <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                    <Video className="h-6 w-6 text-slate-600" />
                                  </div>
                                ) : (
                                  <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                    <FileIcon className="h-6 w-6 text-slate-600" />
                                  </div>
                                )}
                              </div>
                            ))}
                            {uploadFiles.length > 6 && (
                              <div className="h-16 w-16 rounded-lg bg-slate-200 flex items-center justify-center mx-auto">
                                <span className="text-xs font-medium text-slate-600">
                                  +{uploadFiles.length - 6}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* File List */}
                          <div className="text-left bg-white/50 rounded-lg p-3 max-h-24 overflow-y-auto">
                            {uploadFiles.map((file, index) => (
                              <div key={index} className="flex justify-between items-center text-xs mb-1">
                                <span className="truncate text-slate-700">{file.name}</span>
                                <span className="text-slate-500 ml-2">
                                  {(file.size / 1024 / 1024).toFixed(1)}MB
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setUploadFiles([])}
                            className="text-slate-600 hover:text-slate-800"
                          >
                            Clear Selection
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="mx-auto h-12 w-12 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-600 mb-2">
                              Select multiple photos/videos from your service
                            </p>
                            <p className="text-xs text-slate-500 mb-4">
                              You can select multiple files at once (Ctrl/Cmd + click)
                            </p>
                          </div>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,video/*"
                            multiple
                          />
                          <div className="space-y-2">
                            <Button 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-slate-200 hover:bg-slate-50"
                            >
                              Select Files from Service
                            </Button>
                            <p className="text-xs text-slate-500">
                              Images, videos up to 100MB each
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {uploadFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="alt-text">Description for Accessibility</Label>
                      <Input
                        id="alt-text"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Describe these photos/videos"
                        className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl"
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleUpload}
                    disabled={uploadFiles.length === 0 || uploading || !collectionName || !collectionCategory}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg rounded-xl"
                  >
                    {uploading ? 'Uploading Collection...' : 'Upload to Collection'}
                  </Button>

                  {(!collectionName || !collectionCategory) && (
                    <p className="text-sm text-orange-600 text-center">
                      Please fill in Collection Name and Service/Program to upload
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border border-white/20">
            <DialogHeader>
              <DialogTitle>Delete Media</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this media file? This action cannot be undone.
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

        {/* Media Viewer Modal */}
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>
                {viewerItem?.alt_text || viewerItem?.url.split('/').pop() || 'Media Viewer'}
              </DialogTitle>
            </DialogHeader>
            <div className="relative h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-white/95 backdrop-blur-sm">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {viewerItem?.alt_text || viewerItem?.url.split('/').pop() || 'Media Viewer'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {viewerItem?.type === 'image' ? 'Image' : viewerItem?.type === 'video' ? 'Video' : 'File'} • 
                    {viewerItem && new Date(viewerItem.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewerItem && copyToClipboard(viewerItem.url)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewerItem && window.open(viewerItem.url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeViewer}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center bg-slate-50 relative overflow-hidden">
                {viewerItem && viewerItem.type === 'image' ? (
                  <div className="relative max-w-full max-h-full p-4">
                    <img 
                      src={viewerItem.url} 
                      alt={viewerItem.alt_text || 'Image'} 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : viewerItem && viewerItem.type === 'video' ? (
                  <div className="relative w-full h-full p-4">
                    <video 
                      src={viewerItem.url}
                      controls
                      className="w-full h-full object-contain rounded-lg shadow-lg"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : viewerItem ? (
                  <div className="flex flex-col items-center justify-center text-slate-500 p-8">
                    <FileIcon className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium mb-2">File Preview Not Available</p>
                    <p className="text-sm text-center mb-4">
                      This file type cannot be previewed in the browser.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => viewerItem && window.open(viewerItem.url, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Open in New Tab
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Footer with metadata */}
              {viewerItem && (
                <div className="p-4 border-t bg-white/95 backdrop-blur-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-600">Type:</span>
                      <p className="text-slate-800 capitalize">{viewerItem.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Uploaded:</span>
                      <p className="text-slate-800">{new Date(viewerItem.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Collection:</span>
                      <p className="text-slate-800">{viewerItem.collection_name || 'None'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Description:</span>
                      <p className="text-slate-800">{viewerItem.description || viewerItem.alt_text || 'No description'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 