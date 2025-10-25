'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building, 
  Save, 
  ArrowLeft,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { 
  createCampus,
  type Campus 
} from '@/services/settings'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { MapPreview } from '@/components/ui/map-preview'

const campusSchema = z.object({
  name: z.string().min(1, 'Campus name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  is_main: z.boolean(),
})

type CampusFormData = z.infer<typeof campusSchema>

export default function NewCampusPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat?: number; lng?: number }>({})

  const form = useForm<CampusFormData>({
    resolver: zodResolver(campusSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US',
      phone: '',
      email: '',
      is_main: false,
    },
  })

  // Handle address autocomplete selection
  const handleAddressSelected = (components: any) => {
    form.setValue('address', components.address)
    form.setValue('city', components.city)
    form.setValue('state', components.state)
    form.setValue('zip_code', components.zip_code)
    form.setValue('country', components.country)
    setCoordinates({ lat: components.lat, lng: components.lng })
  }

  async function onSubmit(data: CampusFormData) {
    try {
      setIsLoading(true)
      
      const { success, data: result, error } = await createCampus(data)
      
      if (success) {
        toast({
          title: 'Campus created',
          description: `Campus "${data.name}" has been created successfully.`,
        })
        router.push('/settings/campuses')
      } else {
        console.error('Error creating campus:', error)
        toast({
          title: 'Error',
          description: 'Failed to create campus. Please try again.',
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
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 via-emerald-600/90 to-teal-700/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/settings/campuses">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campuses
              </Link>
            </Button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Building className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Add New Campus
              </h1>
              <p className="text-xl text-green-100 mt-2">
                Create a new campus location for your church
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-green-100">
            <span>• Basic Information</span>
            <span>• Location Details</span>
            <span>• Contact Information</span>
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
                  <Building className="w-5 h-5 text-green-600" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>
                  Essential details about this campus location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campus Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Main Campus, Downtown Campus, West Campus" 
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
                  name="is_main"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>This is the main campus</span>
                        </FormLabel>
                        <FormDescription>
                          Mark this as your primary campus location
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Location Details</span>
                </CardTitle>
                <CardDescription>
                  Physical address and location information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value || ''}
                          onChange={field.onChange}
                          onAddressSelected={handleAddressSelected}
                          placeholder="123 Main Street"
                          className="bg-white/50 border-slate-200/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Map Preview */}
                {(form.watch('address') || coordinates.lat) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Location Preview</label>
                    <MapPreview
                      address={form.watch('address')}
                      lat={coordinates.lat}
                      lng={coordinates.lng}
                      height={250}
                      className="border border-slate-200/50"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="City" 
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
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="State" 
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
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP/Postal Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12345" 
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
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="US" 
                          {...field} 
                          className="bg-white/50 border-slate-200/50"
                        />
                      </FormControl>
                      <FormDescription>
                        Use ISO country code (e.g., US, CA, UK)
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
                  <Phone className="w-5 h-5 text-purple-600" />
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>
                  How people can reach this campus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Phone Number</span>
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

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Email Address</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="campus@yourchurch.org" 
                            {...field} 
                            className="bg-white/50 border-slate-200/50"
                          />
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
                onClick={() => router.push('/settings/campuses')}
                className="bg-white/50 hover:bg-white/80 border-slate-200/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Campus
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