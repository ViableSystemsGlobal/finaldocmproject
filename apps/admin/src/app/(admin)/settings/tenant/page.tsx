'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Save, 
  Upload, 
  Palette, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  ArrowLeft,
  Loader2,
  Sparkles,
  MessageSquare,
  Clock,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
import { 
  fetchTenantSettings, 
  updateTenantSettings, 
  createTenantSettings,
  type TenantSettings 
} from '@/services/settings'
import { useTenantSettings } from '@/hooks/use-tenant-settings'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'

const tenantSettingsSchema = z.object({
  name: z.string().min(1, 'Church name is required'),
  address: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  time_zone: z.string().min(1, 'Time zone is required'),
  logo_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo_white_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo_black_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo_mobile_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo_web_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo_admin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  primary_color: z.string().min(1, 'Primary color is required'),
  secondary_color: z.string().min(1, 'Secondary color is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  // Contact page specific settings
  prayer_line: z.string().optional(),
  response_time: z.string().optional(),
  office_hours_weekdays: z.string().optional(),
  office_hours_weekends: z.string().optional(),
})

type TenantSettingsFormData = z.infer<typeof tenantSettingsSchema>

const timeZones = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC'
]

export default function TenantSettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const { refresh: refreshTenantSettings } = useTenantSettings()

  // Helper function for logo uploads
  const handleLogoUpload = async (field: any, logoType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setIsLoading(true);
          
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: "File Too Large",
              description: "Please select an image smaller than 5MB.",
              variant: "destructive",
            });
            return;
          }
          
          if (!file.type.startsWith('image/')) {
            toast({
              title: "Invalid File Type",
              description: "Please select an image file (PNG, JPG, etc).",
              variant: "destructive",
            });
            return;
          }
          
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/upload-logo', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            toast({
              title: "Upload Failed",
              description: `Server error: ${response.status}. Please try again.`,
              variant: "destructive",
            });
            return;
          }
          
          const result = await response.json();
          
          if (result.success) {
            field.onChange(result.url);
            toast({
              title: `${logoType} Logo Uploaded`,
              description: `Your ${logoType.toLowerCase()} logo has been uploaded successfully!`,
            });
          } else {
            toast({
              title: "Upload Failed",
              description: result.error || "Failed to upload logo. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Logo upload error:', error);
          toast({
            title: "Upload Error",
            description: "An error occurred while uploading. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    input.click();
  }

  const form = useForm<TenantSettingsFormData>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      name: '',
      address: '',
      contact_email: '',
      contact_phone: '',
      time_zone: 'America/New_York',
      logo_url: '',
      logo_white_url: '',
      logo_black_url: '',
      logo_mobile_url: '',
      logo_web_url: '',
      logo_admin_url: '',
      primary_color: '#1A202C',
      secondary_color: '#F6E05E',
      website: '',
      description: '',
      // Contact page specific settings
      prayer_line: '',
      response_time: '',
      office_hours_weekdays: '',
      office_hours_weekends: '',
    },
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setIsInitialLoading(true)
      const { success, data, error } = await fetchTenantSettings()
      
      if (success && data) {
        setSettings(data)
        form.reset({
          name: data.name || '',
          address: data.address || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          time_zone: data.time_zone || 'America/New_York',
          logo_url: data.logo_url || '',
          logo_white_url: data.logo_white_url || '',
          logo_black_url: data.logo_black_url || '',
          logo_mobile_url: data.logo_mobile_url || '',
          logo_web_url: data.logo_web_url || '',
          logo_admin_url: data.logo_admin_url || '',
          primary_color: data.primary_color || '#1A202C',
          secondary_color: data.secondary_color || '#F6E05E',
          website: data.website || '',
          description: data.description || '',
          prayer_line: data.prayer_line || '',
          response_time: data.response_time || '',
          office_hours_weekdays: data.office_hours_weekdays || '',
          office_hours_weekends: data.office_hours_weekends || '',
        })
      } else if (error && (error as any)?.code === 'PGRST116') {
        // No settings found, this is OK for first-time setup
        console.log('No tenant settings found, ready for first-time setup')
      } else if (error) {
        console.error('Error loading tenant settings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load church settings. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsInitialLoading(false)
    }
  }

  async function onSubmit(data: TenantSettingsFormData) {
    try {
      setIsLoading(true)
      console.log('Submitting tenant settings:', data);
      
      // The updateTenantSettings function now handles both create and update scenarios
      const result = await updateTenantSettings(data);
      
      console.log('Result from settings operation:', result);
      
      if (result.success) {
        if (result.data) {
          setSettings(result.data)
        }
        toast({
          title: 'Settings saved',
          description: 'Your church settings have been saved successfully.',
        })
        // Refresh the tenant settings hook to update sidebar immediately
        refreshTenantSettings()
      } else {
        console.error('Settings operation failed:', result.error);
        
        // Show more detailed error message
        let errorMessage = 'Failed to save settings. Please try again.';
        if (result.error && typeof result.error === 'object') {
          const error = result.error as any;
          if (error.message) {
            errorMessage = error.message;
          } else if (error.code === 'PGRST116') {
            errorMessage = 'Table not found. Please run the database migration first.';
          } else if (error.code === '42P01') {
            errorMessage = 'tenant_settings table does not exist. Please run the database migration.';
          }
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      
      let errorMessage = 'Failed to save settings. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-700/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Church Profile
              </h1>
              <p className="text-xl text-blue-100 mt-2">
                Manage your church information and branding
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-blue-100">
            <span>• Basic Information</span>
            <span>• Contact Details</span>
            <span>• Branding & Colors</span>
            <span>• Time Zone Settings</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>
                  Essential details about your church
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Church Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Grace Community Church" 
                            {...field} 
                            className="bg-white/50 border-slate-200/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time_zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Zone *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/50 border-slate-200/50">
                              <SelectValue placeholder="Select time zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeZones.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of your church..."
                          className="bg-white/50 border-slate-200/50 min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This description may be used on your public website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>
                  How people can reach your church
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Contact Email</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="contact@yourchurch.org" 
                            {...field} 
                            className="bg-white/50 border-slate-200/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Contact Phone</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="(555) 123-4567" 
                            {...field} 
                            className="bg-white/50 border-slate-200/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Address</span>
                      </FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value || ''}
                          onChange={(value, location) => {
                            field.onChange(value);
                            // Optionally store location data if needed
                            if (location) {
                              console.log('Selected location:', location);
                            }
                          }}
                          placeholder="123 Main Street, City, State 12345"
                          className="bg-white/50 border-slate-200/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://yourchurch.org" 
                          {...field} 
                          className="bg-white/50 border-slate-200/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Page Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>Contact Page Settings</span>
                </CardTitle>
                <CardDescription>
                  Customize how your contact page displays information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="prayer_line"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Prayer Line</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="(720) 323-0135" 
                            {...field} 
                            className="bg-white/50 border-slate-200/50"
                          />
                        </FormControl>
                        <FormDescription>
                          Phone number for urgent prayer requests
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="response_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Response Time</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="We typically respond within 24 hours" 
                            {...field} 
                            className="bg-white/50 border-slate-200/50"
                          />
                        </FormControl>
                        <FormDescription>
                          Expected response time for contact form submissions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="office_hours_weekdays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Weekday Hours</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Monday - Friday: 9:00 AM - 5:00 PM" 
                            {...field} 
                            className="bg-white/50 border-slate-200/50"
                          />
                        </FormControl>
                        <FormDescription>
                          Office hours during weekdays
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="office_hours_weekends"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Weekend Hours</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Saturday: 10:00 AM - 2:00 PM | Sunday: After Services" 
                            {...field} 
                            className="bg-white/50 border-slate-200/50"
                          />
                        </FormControl>
                        <FormDescription>
                          Office hours during weekends
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <span>Branding & Design</span>
                </CardTitle>
                <CardDescription>
                  Customize your church's visual identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Multiple Logo Upload Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span className="font-medium">Church Logos</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Upload different logo variations for various contexts and platforms.
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Logo Preview */}
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                        {isLoading ? (
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                            <p className="text-xs text-slate-500">Uploading...</p>
                          </div>
                        ) : form.watch('logo_url') ? (
                          <img 
                            src={form.watch('logo_url')} 
                            alt="Church Logo" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback to default if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = '/api/placeholder/logo-default';
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">Default Logo</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name="logo_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <Input 
                                  type="url"
                                  placeholder="https://yourchurch.org/logo.png" 
                                  {...field} 
                                  className="bg-white/50 border-slate-200/50"
                                />
                                
                                {/* File Upload Button */}
                                <div className="flex items-center gap-3">
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    disabled={isLoading}
                                    onClick={() => {
                                      // Create a file input element
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = async (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) {
                                          try {
                                            setIsLoading(true);
                                            
                                            // Validate file size (5MB max)
                                            if (file.size > 5 * 1024 * 1024) {
                                              toast({
                                                title: "File Too Large",
                                                description: "Please select an image smaller than 5MB.",
                                                variant: "destructive",
                                              });
                                              return;
                                            }
                                            
                                            // Validate file type
                                            if (!file.type.startsWith('image/')) {
                                              toast({
                                                title: "Invalid File Type",
                                                description: "Please select an image file (PNG, JPG, etc).",
                                                variant: "destructive",
                                              });
                                              return;
                                            }
                                            
                                            // Create form data
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            
                                            // Upload to our logo upload API
                                            const response = await fetch('/api/upload-logo', {
                                              method: 'POST',
                                              body: formData,
                                            });
                                            
                                            // Check if response is ok first
                                            if (!response.ok) {
                                              const errorText = await response.text();
                                              console.error('Upload API error:', {
                                                status: response.status,
                                                statusText: response.statusText,
                                                body: errorText
                                              });
                                              toast({
                                                title: "Upload Failed",
                                                description: `Server error: ${response.status}. Please check the console for details.`,
                                                variant: "destructive",
                                              });
                                              return;
                                            }
                                            
                                            const responseText = await response.text();
                                            console.log('Raw response:', responseText);
                                            
                                            let result;
                                            try {
                                              result = JSON.parse(responseText);
                                            } catch (parseError) {
                                              console.error('JSON parse error:', parseError);
                                              console.error('Response was:', responseText);
                                              toast({
                                                title: "Upload Error",
                                                description: "Invalid response from server. Please check the console for details.",
                                                variant: "destructive",
                                              });
                                              return;
                                            }
                                            
                                            if (result.success) {
                                              // Update the form with the new logo URL
                                              field.onChange(result.url);
                                              toast({
                                                title: "Logo Uploaded",
                                                description: "Your church logo has been uploaded successfully!",
                                              });
                                            } else {
                                              toast({
                                                title: "Upload Failed",
                                                description: result.error || "Failed to upload logo. Please try again.",
                                                variant: "destructive",
                                              });
                                            }
                                          } catch (error) {
                                            console.error('Logo upload error:', error);
                                            toast({
                                              title: "Upload Error",
                                              description: "An error occurred while uploading. Please try again.",
                                              variant: "destructive",
                                            });
                                          } finally {
                                            setIsLoading(false);
                                          }
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="bg-white/50 hover:bg-white/80 border-slate-200/50"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {isLoading ? 'Uploading...' : 'Upload Logo'}
                                  </Button>
                                  
                                  {field.value && (
                                    <Button 
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        field.onChange('');
                                        toast({
                                          title: "Logo Reset",
                                          description: "Logo has been reset to default.",
                                        });
                                      }}
                                      className="text-slate-500 hover:text-slate-700"
                                    >
                                      Reset to Default
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Upload your church logo or provide a direct URL. Recommended size: 256x256px or larger, PNG/JPG format.
                              The logo will appear in the sidebar and header throughout the admin interface.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Logo Variations */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <span className="font-medium">Logo Variations</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Upload logo variations for different contexts (white for dark backgrounds, black for light backgrounds, etc.)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* White Logo */}
                    <FormField
                      control={form.control}
                      name="logo_white_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>White Logo (Dark Backgrounds)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                type="url"
                                placeholder="https://yourchurch.org/logo-white.png" 
                                {...field} 
                                className="bg-white/50 border-slate-200/50"
                              />
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      try {
                                        setIsLoading(true);
                                        
                                        if (file.size > 5 * 1024 * 1024) {
                                          toast({
                                            title: "File Too Large",
                                            description: "Please select an image smaller than 5MB.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        
                                        if (!file.type.startsWith('image/')) {
                                          toast({
                                            title: "Invalid File Type",
                                            description: "Please select an image file (PNG, JPG, etc).",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        
                                        const response = await fetch('/api/upload-logo', {
                                          method: 'POST',
                                          body: formData,
                                        });
                                        
                                        if (!response.ok) {
                                          toast({
                                            title: "Upload Failed",
                                            description: `Server error: ${response.status}. Please try again.`,
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        
                                        const result = await response.json();
                                        
                                        if (result.success) {
                                          field.onChange(result.url);
                                          toast({
                                            title: "White Logo Uploaded",
                                            description: "Your white logo has been uploaded successfully!",
                                          });
                                        } else {
                                          toast({
                                            title: "Upload Failed",
                                            description: result.error || "Failed to upload logo. Please try again.",
                                            variant: "destructive",
                                          });
                                        }
                                      } catch (error) {
                                        console.error('Logo upload error:', error);
                                        toast({
                                          title: "Upload Error",
                                          description: "An error occurred while uploading. Please try again.",
                                          variant: "destructive",
                                        });
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    }
                                  };
                                  input.click();
                                }}
                                className="w-full bg-white/50 hover:bg-white/80 border-slate-200/50"
                              >
                                <Upload className="w-3 h-3 mr-2" />
                                {isLoading ? 'Uploading...' : 'Upload White Logo'}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            For mobile app dark mode and dark website themes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Black Logo */}
                    <FormField
                      control={form.control}
                      name="logo_black_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Black Logo (Light Backgrounds)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                type="url"
                                placeholder="https://yourchurch.org/logo-black.png" 
                                {...field} 
                                className="bg-white/50 border-slate-200/50"
                              />
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      try {
                                        setIsLoading(true);
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        const response = await fetch('/api/upload-logo', { method: 'POST', body: formData });
                                        const result = await response.json();
                                        if (result.success) {
                                          field.onChange(result.url);
                                          toast({ title: "Black Logo Uploaded", description: "Success!" });
                                        }
                                      } catch (error) {
                                        toast({ title: "Upload Error", variant: "destructive" });
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    }
                                  };
                                  input.click();
                                }}
                                className="w-full bg-white/50 hover:bg-white/80 border-slate-200/50"
                              >
                                <Upload className="w-3 h-3 mr-2" />
                                Upload Black Logo
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            For printed materials and light website themes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mobile Logo */}
                    <FormField
                      control={form.control}
                      name="logo_mobile_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile App Logo</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                type="url"
                                placeholder="https://yourchurch.org/logo-mobile.png" 
                                {...field} 
                                className="bg-white/50 border-slate-200/50"
                              />
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      try {
                                        setIsLoading(true);
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        const response = await fetch('/api/upload-logo', { method: 'POST', body: formData });
                                        const result = await response.json();
                                        if (result.success) {
                                          field.onChange(result.url);
                                          toast({ title: "Mobile Logo Uploaded", description: "Success!" });
                                        }
                                      } catch (error) {
                                        toast({ title: "Upload Error", variant: "destructive" });
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    }
                                  };
                                  input.click();
                                }}
                                className="w-full bg-white/50 hover:bg-white/80 border-slate-200/50"
                              >
                                <Upload className="w-3 h-3 mr-2" />
                                Upload Mobile Logo
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Optimized for mobile app icon and splash screens
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Web Logo */}
                    <FormField
                      control={form.control}
                      name="logo_web_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website Logo</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                type="url"
                                placeholder="https://yourchurch.org/logo-web.png" 
                                {...field} 
                                className="bg-white/50 border-slate-200/50"
                              />
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      try {
                                        setIsLoading(true);
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        const response = await fetch('/api/upload-logo', { method: 'POST', body: formData });
                                        const result = await response.json();
                                        if (result.success) {
                                          field.onChange(result.url);
                                          toast({ title: "Website Logo Uploaded", description: "Success!" });
                                        }
                                      } catch (error) {
                                        toast({ title: "Upload Error", variant: "destructive" });
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    }
                                  };
                                  input.click();
                                }}
                                className="w-full bg-white/50 hover:bg-white/80 border-slate-200/50"
                              >
                                <Upload className="w-3 h-3 mr-2" />
                                Upload Website Logo
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            For website headers and promotional materials
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Admin Logo */}
                    <FormField
                      control={form.control}
                      name="logo_admin_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Panel Logo</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                type="url"
                                placeholder="https://yourchurch.org/logo-admin.png" 
                                {...field} 
                                className="bg-white/50 border-slate-200/50"
                              />
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      try {
                                        setIsLoading(true);
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        const response = await fetch('/api/upload-logo', { method: 'POST', body: formData });
                                        const result = await response.json();
                                        if (result.success) {
                                          field.onChange(result.url);
                                          toast({ title: "Admin Logo Uploaded", description: "Success!" });
                                        }
                                      } catch (error) {
                                        toast({ title: "Upload Error", variant: "destructive" });
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    }
                                  };
                                  input.click();
                                }}
                                className="w-full bg-white/50 hover:bg-white/80 border-slate-200/50"
                              >
                                <Upload className="w-3 h-3 mr-2" />
                                Upload Admin Logo
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Used throughout this admin interface
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="primary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            <Input 
                              type="color"
                              {...field} 
                              className="w-16 h-10 p-1 bg-white/50 border-slate-200/50"
                            />
                            <Input 
                              type="text"
                              {...field} 
                              className="bg-white/50 border-slate-200/50"
                              placeholder="#1A202C"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            <Input 
                              type="color"
                              {...field} 
                              className="w-16 h-10 p-1 bg-white/50 border-slate-200/50"
                            />
                            <Input 
                              type="text"
                              {...field} 
                              className="bg-white/50 border-slate-200/50"
                              placeholder="#F6E05E"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/settings')}
                className="bg-white/50 hover:bg-white/80 border-slate-200/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 