'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { 
  Loader2, 
  Upload, 
  RefreshCw,
  X,
  Check,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

export default function TestUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [buckets, setBuckets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Add a log message
  const addLog = (message: string) => {
    setLogs(prev => [message, ...prev])
    console.log(message)
  }

  // Check storage
  const checkStorage = async () => {
    setLoading(true)
    addLog('Checking storage buckets...')
    
    try {
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        addLog(`Error: ${error.message}`)
        throw error
      }
      
      setBuckets(data || [])
      addLog(`Found ${data?.length || 0} buckets: ${data?.map(b => b.name).join(', ') || 'none'}`)
      
      // Check event-images bucket
      const eventImagesBucket = data?.find(b => b.name === 'event-images')
      if (eventImagesBucket) {
        addLog(`event-images bucket exists, public: ${eventImagesBucket.public}`)
      } else {
        addLog('event-images bucket not found')
      }
    } catch (err) {
      addLog(`Failed to check storage: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Create bucket
  const createBucket = async () => {
    setLoading(true)
    addLog('Creating event-images bucket...')
    
    try {
      const { data, error } = await supabase.storage.createBucket('event-images', {
        public: true
      })
      
      if (error) {
        if (error.message.includes('already exists')) {
          addLog('Bucket already exists, trying to update...')
          
          const { error: updateError } = await supabase.storage.updateBucket('event-images', {
            public: true
          })
          
          if (updateError) {
            addLog(`Error updating bucket: ${updateError.message}`)
          } else {
            addLog('Successfully updated bucket to be public')
          }
        } else {
          addLog(`Error: ${error.message}`)
          throw error
        }
      } else {
        addLog('Successfully created event-images bucket')
      }
      
      // Refresh bucket list
      await checkStorage()
    } catch (err) {
      addLog(`Failed to create bucket: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      addLog(`Selected file: ${file.name} (${file.type}, ${Math.round(file.size / 1024)} KB)`)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Clear selected image
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    addLog('Cleared selected image')
  }

  // Upload image
  const handleUpload = async () => {
    if (!imageFile) {
      addLog('No file selected')
      return
    }
    
    setUploading(true)
    addLog('Starting upload...')
    
    try {
      // Create a unique filename
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `test-${Date.now()}.${fileExt}`
      addLog(`Generated filename: ${fileName}`)
      
      // Upload to storage
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (error) {
        addLog(`Upload error: ${error.message}`)
        throw error
      }
      
      addLog('Upload successful')
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName)
      
      if (!urlData?.publicUrl) {
        addLog('Failed to get public URL')
      } else {
        const publicUrl = urlData.publicUrl
        addLog(`Public URL: ${publicUrl}`)
        setUploadedUrl(publicUrl)
        
        // Try to insert into event_images table
        const { data: insertData, error: insertError } = await supabase
          .from('event_images')
          .insert({
            event_id: '00000000-0000-0000-0000-000000000000', // dummy ID
            url: publicUrl,
            alt_text: imageFile.name,
            sort_order: 0
          })
          .select()
        
        if (insertError) {
          addLog(`Database insert error: ${insertError.message}`)
        } else {
          addLog('Successfully recorded in database')
        }
      }
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      })
    } catch (err) {
      addLog(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload image'
      })
    } finally {
      setUploading(false)
    }
  }

  // Load bucket info on mount
  useState(() => {
    checkStorage()
  })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Storage Upload Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={checkStorage}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Storage
            </Button>
            
            <Button
              onClick={createBucket}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Create/Fix Bucket
            </Button>
          </div>
          
          {buckets.length > 0 && (
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Buckets</h3>
              <ul className="space-y-2">
                {buckets.map((bucket) => (
                  <li key={bucket.id} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{bucket.name}</span>
                      <span className="ml-2 text-muted-foreground text-sm">
                        {bucket.public ? 'public' : 'private'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="image">Test Image Upload</Label>
            <div className="flex flex-col space-y-2">
              <input
                type="file"
                id="image"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {!imagePreview ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 flex flex-col items-center justify-center border-dashed"
                >
                  <Upload className="h-8 w-8 mb-2" />
                  <span>Select Image</span>
                </Button>
              ) : (
                <div className="relative w-full h-48">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {imagePreview && (
                <Button 
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {uploadedUrl && (
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Uploaded Image</h3>
              <div className="relative w-full h-48 mb-4">
                <Image
                  src={uploadedUrl}
                  alt="Uploaded"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="flex justify-between items-center">
                <Input 
                  value={uploadedUrl} 
                  readOnly 
                  className="mr-2"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(uploadedUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Logs</h3>
          <div className="border rounded-md p-4 h-[500px] overflow-y-auto bg-muted">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet</p>
            ) : (
              <ul className="space-y-1">
                {logs.map((log, i) => (
                  <li key={i} className="text-sm font-mono">
                    {log}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Diagnostic Links</h2>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => window.open('/api/debug-db', '_blank')}
          >
            Run Database Diagnostics
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/api/debug-storage', '_blank')}
          >
            Run Storage Diagnostics
          </Button>
        </div>
      </div>
    </div>
  )
} 