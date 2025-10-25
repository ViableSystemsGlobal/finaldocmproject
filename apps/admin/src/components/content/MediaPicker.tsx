'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Upload, Image as ImageIcon, File, X, Video, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'
import { fetchMedia, uploadmedia, MediaItem } from '@/services/media'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface MediaPickerProps {
  selectedUrl?: string
  onSelect: (url: string) => void
  type?: 'all' | 'image' | 'video' | 'document'
  buttonText?: string
}

export function MediaPicker({ 
  selectedUrl, 
  onSelect, 
  type = 'all',
  buttonText = 'Select Media'
}: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9) // 9 items per page for 3x3 grid
  
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

  // Load media when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadMedia()
    }
  }, [isOpen])
  
  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const loadMedia = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchMedia()
      if (error) throw error
      
      // Filter by type if needed
      let filteredData = data || []
      if (type !== 'all') {
        filteredData = filteredData.filter((item: MediaItem) => item.type === type)
      }
      
      setMediaItems(filteredData)
    } catch (error) {
      console.error('Error loading media:', error)
      toast({
        title: 'Error',
        description: 'Failed to load media library',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }
  
  const handleUpload = async () => {
    if (!uploadFile) return
    
    setUploading(true)
    try {
      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Auth status before upload:', session ? 'Authenticated' : 'Not authenticated')
      
      const { data, error } = await uploadmedia(uploadFile, altText, {
        collectionName: collectionName || undefined,
        collectionCategory: collectionCategory || undefined,
        collectionDate: collectionDate || undefined,
        description: description || undefined
      })
      if (error) {
        console.error('Upload error details:', error)
        throw error
      }
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      })
      
      // Reset form
      setUploadFile(null)
      setAltText('')
      setCollectionName('')
      setCollectionCategory('')
      setCollectionDate('')
      setDescription('')
      
      // Reload media list
      loadMedia()
    } catch (error) {
      console.error('Error uploading file:', error)
      
      // More detailed error message
      let errorMessage = 'Failed to upload file'
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }
  
  const handleSelect = (url: string) => {
    onSelect(url)
    setIsOpen(false)
  }
  
  const filteredItems = searchQuery 
    ? mediaItems.filter(item => 
        item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.alt_text && item.alt_text.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : mediaItems

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

  // Helper function to determine if a URL is a video
  const isVideoUrl = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|avi|mov|wmv)(\?.*)?$/i)
  }
  
  return (
    <>
      <div className="space-y-2">
        {/* Always show the selection container for consistent layout */}
        <div className="border rounded-md p-2 min-h-[48px] flex items-center gap-2">
          {selectedUrl ? (
            <>
              {isVideoUrl(selectedUrl) ? (
                <div className="relative h-8 w-8 rounded-sm bg-slate-100 flex items-center justify-center shrink-0">
                  <Video className="h-4 w-4 text-slate-600" />
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-xs font-bold">
                    V
                  </div>
                </div>
              ) : selectedUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) ? (
                <img 
                  src={selectedUrl} 
                  alt="Selected media" 
                  className="h-8 w-8 object-cover rounded-sm shrink-0"
                />
              ) : (
                <File className="h-8 w-8 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 truncate text-sm text-gray-600">
                {selectedUrl.split('/').pop() || 'Selected media'}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onSelect('')}
                className="shrink-0 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <div className="flex-1 text-sm text-gray-500 italic">
              No media selected
            </div>
          )}
        </div>
        
        {/* Button always in the same position */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              {buttonText}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Media Library</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="browse">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse">Browse</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="browse" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search media..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No media items found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {currentPageItems.map((item) => (
                      <div 
                        key={item.id}
                        className={`border rounded-md overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                          selectedUrl === item.url ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleSelect(item.url)}
                      >
                        {item.type === 'image' ? (
                          <div className="aspect-square">
                            <img 
                              src={item.url} 
                              alt={item.alt_text || ''} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : item.type === 'video' ? (
                          <div className="aspect-square relative bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <Video className="h-12 w-12 text-slate-500" />
                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                              VIDEO
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                              <Play className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square flex items-center justify-center bg-muted">
                            <File className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2 text-xs truncate">
                          {item.alt_text || item.url.split('/').pop() || 'Untitled'}
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
                    onItemsPerPageChange={() => {}}
                    showItemsPerPage={false}
                    showFirstLast={false}
                    className="pt-4 border-t"
                  />
                )}
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">File</Label>
                    <div className="border-2 border-dashed rounded-md p-6 text-center">
                      {uploadFile ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            {uploadFile.type.startsWith('image/') ? (
                              <img 
                                src={URL.createObjectURL(uploadFile)} 
                                alt="Preview" 
                                className="h-16 w-16 object-cover rounded-md"
                              />
                            ) : uploadFile.type.startsWith('video/') ? (
                              <div className="relative h-16 w-16 rounded-md bg-slate-100 flex items-center justify-center">
                                <Video className="h-8 w-8 text-slate-600" />
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                  V
                                </div>
                              </div>
                            ) : (
                              <File className="h-16 w-16 text-muted-foreground" />
                            )}
                            <div className="text-left">
                              <p className="font-medium">{uploadFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(uploadFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setUploadFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="text-sm">
                            Drag and drop or click to upload
                          </p>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*,video/*,.pdf,.doc,.docx"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            Select File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {uploadFile && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="alt-text">Alt Text</Label>
                        <Input
                          id="alt-text"
                          value={altText}
                          onChange={(e) => setAltText(e.target.value)}
                          placeholder="Describe this media (for accessibility)"
                        />
                      </div>
                      
                      {/* Collection Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="collection-name">Collection Name</Label>
                          <Input
                            id="collection-name"
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)}
                            placeholder="e.g. Sunday Service March 2024"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="collection-category">Category</Label>
                          <select
                            id="collection-category"
                            value={collectionCategory}
                            onChange={(e) => setCollectionCategory(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                          >
                            <option value="">Select category...</option>
                            {categories.map(category => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="collection-date">Event Date</Label>
                          <Input
                            id="collection-date"
                            type="date"
                            value={collectionDate}
                            onChange={(e) => setCollectionDate(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the event"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={handleUpload} 
                    disabled={!uploadFile || uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
} 