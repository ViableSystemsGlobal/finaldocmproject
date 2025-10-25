'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Info, Users, ArrowLeft, Plus, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { createGroup, fetchCampuses } from '@/services/groups'
import { supabase } from '@/lib/supabase'

type Campus = {
  id: string;
  name: string;
};

export default function NewGroupPage() {
  const router = useRouter()
  
  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('ministry')
  const [campusId, setCampusId] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [customFields, setCustomFields] = useState<Record<string, string>>({})
  
  // Custom field inputs
  const [customFieldName, setCustomFieldName] = useState('')
  const [customFieldValue, setCustomFieldValue] = useState('')
  
  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Load campuses
  useEffect(() => {
    const loadCampuses = async () => {
      try {
        const { data, error } = await fetchCampuses()
        
        if (error) {
          throw new Error(error.message || 'Failed to load campuses')
        }
        
        setCampuses(data || [])
        
        // Set default campus if available
        if (data && data.length > 0) {
          setCampusId(data[0].id)
        }
      } catch (err) {
        console.error('Failed to load campuses:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load campuses'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadCampuses()
  }, [])
  
  const handleAddCustomField = () => {
    if (!customFieldName.trim()) return
    
    setCustomFields(prev => ({
      ...prev,
      [customFieldName]: customFieldValue
    }))
    
    // Reset inputs
    setCustomFieldName('')
    setCustomFieldValue('')
  }
  
  const handleRemoveCustomField = (fieldName: string) => {
    const newFields = { ...customFields };
    delete newFields[fieldName];
    setCustomFields(newFields);
  };
  
  // Image upload handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url);
    setImageFile(null); // Clear file if URL is provided
  };

  const clearImage = () => {
    setImageUrl('');
    setImageFile(null);
    setImagePreview(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !type || !campusId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields'
      })
      return
    }
    
    setSubmitting(true)
    
    try {
      // Determine the image URL to use
      let finalImageUrl = ''
      
      if (imageFile) {
        // Upload the file to Supabase Storage
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `groups/${fileName}`
        
        console.log('Uploading file to storage:', filePath)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)
        
        finalImageUrl = urlData.publicUrl
        console.log('File uploaded successfully:', finalImageUrl)
        
      } else if (imageUrl) {
        finalImageUrl = imageUrl
      }

      const { error } = await createGroup({
        name,
        type,
        campus_id: campusId,
        status: isActive ? 'active' : 'inactive',
        custom_fields: {
          description,
          ...customFields
        },
        image_url: finalImageUrl || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Group created successfully'
      })
      
      // Redirect to groups list
      router.push('/people/groups')
    } catch (err) {
      console.error('Failed to create group:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create group'
      })
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Campuses</h2>
          <p className="text-slate-600">Preparing group creation form...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/people/groups')}
              className="hover:bg-white/50 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-emerald-500 to-blue-500 p-4 rounded-2xl">
                <Plus className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Create New Group
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Add a new ministry, small group, or discipleship group
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Group Information</h2>
                <p className="text-slate-300">Fill in the details for your new group</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Group Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name"
                  className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold text-slate-700">
                    Group Type <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={type} 
                    onValueChange={setType}
                  >
                    <SelectTrigger id="type" className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                      <SelectValue placeholder="Select group type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ministry">Ministry</SelectItem>
                      <SelectItem value="small_group">Small Group</SelectItem>
                      <SelectItem value="discipleship">Discipleship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="campus" className="text-sm font-semibold text-slate-700">
                    Campus <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={campusId}
                    onValueChange={setCampusId}
                  >
                    <SelectTrigger id="campus" className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.length > 0 ? (
                        campuses.map(campus => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No campuses available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter group description"
                  className="border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  rows={4}
                />
              </div>

              {/* Image Upload Section */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Group Image</h3>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">
                  Add an image to represent this group. You can upload a file or provide a URL.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="text-sm font-semibold text-slate-700">
                      Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      placeholder="https://example.com/image.jpg"
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="imageFile" className="text-sm font-semibold text-slate-700">
                      Upload Image File
                    </Label>
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Preview</Label>
                    <div className="flex items-center gap-4">
                      <img 
                        src={imagePreview} 
                        alt="Group image preview"
                        className="w-20 h-20 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearImage}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor="active_status" className="text-sm font-semibold text-slate-700">Active Status</Label>
                  <div className="flex items-center space-x-3">
                    <Switch 
                      id="active_status" 
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="active_status" className="text-sm font-medium cursor-pointer text-slate-700">
                      {isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Inactive groups won't appear in active group lists
                </p>
              </div>
              
              {/* Custom Fields Section */}
              <div className="bg-white/70 backdrop-blur-lg border-2 border-slate-200 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Custom Fields</h3>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600">
                  Add any additional fields you need to track for this group
                </p>
                
                {/* Custom fields input */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      placeholder="Field name"
                      value={customFieldName}
                      onChange={(e) => setCustomFieldName(e.target.value)}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Field value"
                      value={customFieldValue}
                      onChange={(e) => setCustomFieldValue(e.target.value)}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Button 
                      type="button" 
                      onClick={handleAddCustomField}
                      disabled={!customFieldName.trim()}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </div>
                </div>
                
                {/* Custom fields display */}
                {Object.keys(customFields).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700">Added Fields:</h4>
                    <div className="bg-white/70 backdrop-blur-lg border border-slate-200 rounded-xl overflow-hidden">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Field Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {Object.entries(customFields).map(([key, value]) => (
                            <tr key={key} className="hover:bg-white/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-slate-800">{key}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">{value as string}</td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCustomField(key)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-8 py-6">
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/people/groups')}
                  disabled={submitting}
                  className="px-8 py-3 h-12 border-2 border-slate-300 rounded-xl hover:bg-white/80"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !name || !type || !campusId}
                  className="px-8 py-3 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-xl shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Group...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Group
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 