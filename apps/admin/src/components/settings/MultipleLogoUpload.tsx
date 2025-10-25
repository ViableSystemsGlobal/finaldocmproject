'use client'

import { useState } from 'react'
import { Upload, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'
import { UseFormReturn } from 'react-hook-form'

interface LogoVariant {
  id: string
  name: string
  description: string
  fieldName: 'logo_url' | 'logo_white_url' | 'logo_black_url' | 'logo_mobile_url' | 'logo_web_url' | 'logo_admin_url'
  background: string
  colorIndicator: string
  placeholder: string
}

const logoVariants: LogoVariant[] = [
  {
    id: 'primary',
    name: 'Primary Logo',
    description: 'Main church logo (fallback)',
    fieldName: 'logo_url',
    background: 'bg-slate-50',
    colorIndicator: 'bg-blue-500',
    placeholder: 'Default'
  },
  {
    id: 'white',
    name: 'White Logo',
    description: 'For dark backgrounds',
    fieldName: 'logo_white_url',
    background: 'bg-slate-800',
    colorIndicator: 'bg-white border border-slate-300',
    placeholder: 'Dark backgrounds'
  },
  {
    id: 'black',
    name: 'Black Logo',
    description: 'For light backgrounds',
    fieldName: 'logo_black_url',
    background: 'bg-white',
    colorIndicator: 'bg-black',
    placeholder: 'Light backgrounds'
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    description: 'Optimized for mobile app',
    fieldName: 'logo_mobile_url',
    background: 'bg-gradient-to-br from-green-50 to-blue-50',
    colorIndicator: 'bg-green-500',
    placeholder: 'Mobile optimized'
  },
  {
    id: 'web',
    name: 'Website',
    description: 'For website header',
    fieldName: 'logo_web_url',
    background: 'bg-gradient-to-br from-purple-50 to-pink-50',
    colorIndicator: 'bg-purple-500',
    placeholder: 'Website header'
  },
  {
    id: 'admin',
    name: 'Admin Panel',
    description: 'For admin interface',
    fieldName: 'logo_admin_url',
    background: 'bg-gradient-to-br from-orange-50 to-yellow-50',
    colorIndicator: 'bg-orange-500',
    placeholder: 'Admin interface'
  }
]

interface MultipleLogoUploadProps {
  form: UseFormReturn<any>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function MultipleLogoUpload({ form, isLoading, setIsLoading }: MultipleLogoUploadProps) {
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const handleFileUpload = async (fieldName: string, field: any) => {
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          setIsLoading(true)
          setUploadingField(fieldName)
          
          // Validate file size (5MB max)
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: "File Too Large",
              description: "Please select an image smaller than 5MB.",
              variant: "destructive",
            })
            return
          }
          
          // Validate file type
          if (!file.type.startsWith('image/')) {
            toast({
              title: "Invalid File Type",
              description: "Please select an image file (PNG, JPG, etc).",
              variant: "destructive",
            })
            return
          }
          
          // Create form data
          const formData = new FormData()
          formData.append('file', file)
          
          // Upload to our logo upload API
          const response = await fetch('/api/upload-logo', {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Upload API error:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            })
            toast({
              title: "Upload Failed",
              description: `Server error: ${response.status}. Please try again.`,
              variant: "destructive",
            })
            return
          }
          
          const result = await response.json()
          
          if (result.success) {
            // Update the form with the new logo URL
            field.onChange(result.url)
            const variant = logoVariants.find(v => v.fieldName === fieldName)
            toast({
              title: "Logo Uploaded",
              description: `${variant?.name} has been uploaded successfully!`,
            })
          } else {
            toast({
              title: "Upload Failed",
              description: result.error || "Failed to upload logo. Please try again.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('Logo upload error:', error)
          toast({
            title: "Upload Error",
            description: "An error occurred while uploading. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
          setUploadingField(null)
        }
      }
    }
    
    input.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Upload className="w-4 h-4" />
        <span className="font-medium">Church Logos</span>
      </div>
      <p className="text-sm text-slate-600">
        Upload different logo variations for various contexts and platforms. Each logo serves a specific purpose and will be used in different parts of your church's digital presence.
      </p>
      
      {/* Logo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {logoVariants.map((variant) => (
          <div key={variant.id} className="space-y-3">
            {/* Variant Header */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${variant.colorIndicator}`}></div>
              <div>
                <span className="font-medium text-sm">{variant.name}</span>
                <p className="text-xs text-slate-500">{variant.description}</p>
              </div>
            </div>
            
            {/* Logo Preview */}
            <div className={`relative w-full h-32 border-2 border-dashed border-slate-300 rounded-xl ${variant.background} flex items-center justify-center overflow-hidden`}>
              {uploadingField === variant.fieldName ? (
                <div className="text-center">
                  <Loader2 className="w-6 h-6 text-blue-500 mx-auto mb-1 animate-spin" />
                  <p className="text-xs text-slate-500">Uploading...</p>
                </div>
              ) : form.watch(variant.fieldName) ? (
                <img 
                  src={form.watch(variant.fieldName)} 
                  alt={`${variant.name}`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center">
                  <Sparkles className={`w-6 h-6 mx-auto mb-1 ${variant.background.includes('slate-8') ? 'text-slate-400' : 'text-slate-400'}`} />
                  <p className={`text-xs ${variant.background.includes('slate-8') ? 'text-slate-400' : 'text-slate-500'}`}>{variant.placeholder}</p>
                </div>
              )}
            </div>
            
            {/* Form Field */}
            <FormField
              control={form.control}
              name={variant.fieldName}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-2">
                      <Input 
                        type="url"
                        placeholder={`https://yourchurch.org/${variant.id}-logo.png`}
                        {...field} 
                        className="bg-white/50 border-slate-200/50 text-sm"
                      />
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleFileUpload(variant.fieldName, field)}
                          className="bg-white/50 hover:bg-white/80 border-slate-200/50 text-xs"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {uploadingField === variant.fieldName ? 'Uploading...' : 'Upload'}
                        </Button>
                        
                        {field.value && (
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              field.onChange('')
                              toast({
                                title: "Logo Reset",
                                description: `${variant.name} has been reset.`,
                              })
                            }}
                            className="text-slate-500 hover:text-slate-700 text-xs"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Logo Usage Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Primary Logo:</strong> Used as fallback when specific variants aren't available</li>
          <li>• <strong>White Logo:</strong> Used on dark backgrounds (mobile app dark mode, dark website themes)</li>
          <li>• <strong>Black Logo:</strong> Used on light backgrounds (printed materials, light website themes)</li>
          <li>• <strong>Mobile App:</strong> Optimized for mobile app icon and splash screens</li>
          <li>• <strong>Website:</strong> Used in website headers and promotional materials</li>
          <li>• <strong>Admin Panel:</strong> Used throughout this admin interface</li>
        </ul>
        <p className="text-sm text-blue-700 mt-3">
          <strong>Recommended:</strong> 512x512px or larger, PNG format with transparency
        </p>
      </div>
    </div>
  )
} 