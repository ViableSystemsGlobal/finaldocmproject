'use client'

import { useState, useEffect } from 'react'
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Settings,
  Check,
  X,
  Eye,
  EyeOff,
  CreditCard,
  Mail,
  MessageCircle,
  Database,
  Globe,
  Shield,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  fetchIntegrations, 
  upsertIntegration,
  type IntegrationSetting 
} from '@/services/settings'

const integrationSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  config: z.record(z.any()),
  is_active: z.boolean(),
})

type IntegrationFormData = z.infer<typeof integrationSchema>

const integrationProviders = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Accept credit card payments and manage subscriptions',
    icon: CreditCard,
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', type: 'text', required: true },
      { key: 'secret_key', label: 'Secret Key', type: 'password', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ]
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    description: 'Accept PayPal payments',
    icon: CreditCard,
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'boolean', required: false },
    ]
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    category: 'email',
    description: 'Email delivery service',
    icon: Mail,
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'domain', label: 'Domain', type: 'text', required: true },
      { key: 'base_url', label: 'Base URL', type: 'text', required: false },
    ]
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'email',
    description: 'Email marketing and delivery',
    icon: Mail,
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'from_email', label: 'From Email', type: 'email', required: true },
      { key: 'from_name', label: 'From Name', type: 'text', required: false },
    ]
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'sms',
    description: 'SMS messaging service',
    icon: MessageCircle,
    fields: [
      { key: 'account_sid', label: 'Account SID', type: 'text', required: true },
      { key: 'auth_token', label: 'Auth Token', type: 'password', required: true },
      { key: 'phone_number', label: 'Phone Number', type: 'text', required: true },
    ]
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    category: 'analytics',
    description: 'Website analytics and tracking',
    icon: Database,
    fields: [
      { key: 'tracking_id', label: 'Tracking ID', type: 'text', required: true },
      { key: 'measurement_id', label: 'Measurement ID', type: 'text', required: false },
    ]
  },
  {
    id: 'google_oauth',
    name: 'Google OAuth',
    category: 'auth',
    description: 'Google authentication',
    icon: Shield,
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { key: 'redirect_uri', label: 'Redirect URI', type: 'text', required: true },
    ]
  },
]

const categoryIcons = {
  payments: CreditCard,
  email: Mail,
  sms: MessageCircle,
  analytics: Database,
  auth: Shield,
  storage: Globe,
}

const categoryColors = {
  payments: 'from-green-500 to-emerald-600',
  email: 'from-blue-500 to-indigo-600',
  sms: 'from-purple-500 to-violet-600',
  analytics: 'from-orange-500 to-red-600',
  auth: 'from-amber-500 to-yellow-600',
  storage: 'from-slate-500 to-gray-600',
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    provider: string | null
  }>({ open: false, provider: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      provider: '',
      config: {},
      is_active: true,
    },
  })

  useEffect(() => {
    loadIntegrations()
  }, [])

  async function loadIntegrations() {
    try {
      setIsLoading(true)
      const { success, data, error } = await fetchIntegrations()
      
      if (success && data) {
        setIntegrations(data)
      } else {
        console.error('Error loading integrations:', error)
        toast({
          title: 'Error',
          description: 'Failed to load integrations. Please try again.',
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

  function openEditDialog(provider: string) {
    const existingIntegration = integrations.find(i => i.provider === provider)
    const providerConfig = integrationProviders.find(p => p.id === provider)
    
    if (existingIntegration) {
      form.reset({
        provider: existingIntegration.provider,
        config: existingIntegration.config || {},
        is_active: existingIntegration.is_active,
      })
    } else {
      // Initialize with empty config for all fields
      const initialConfig: Record<string, any> = {}
      providerConfig?.fields.forEach(field => {
        initialConfig[field.key] = field.type === 'boolean' ? false : ''
      })
      
      form.reset({
        provider,
        config: initialConfig,
        is_active: true,
      })
    }
    setEditDialog({ open: true, provider })
  }

  function toggleSecretVisibility(key: string) {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  async function onSubmit(data: IntegrationFormData) {
    try {
      setIsSubmitting(true)
      
      const { success, error } = await upsertIntegration(data.provider, {
        ...data.config,
        is_active: data.is_active,
      })
      
      if (success) {
        toast({
          title: 'Integration updated',
          description: `${data.provider} integration has been updated successfully.`,
        })
        setEditDialog({ open: false, provider: null })
        loadIntegrations()
      } else {
        console.error('Error saving integration:', error)
        toast({
          title: 'Error',
          description: 'Failed to save integration. Please try again.',
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
      setIsSubmitting(false)
    }
  }

  function updateConfigValue(key: string, value: any) {
    const currentConfig = form.getValues('config')
    form.setValue('config', {
      ...currentConfig,
      [key]: value
    })
  }

  const groupedProviders = integrationProviders.reduce((acc, provider) => {
    if (!acc[provider.category]) {
      acc[provider.category] = []
    }
    acc[provider.category].push(provider)
    return acc
  }, {} as Record<string, typeof integrationProviders>)

  const activeIntegrations = integrations.filter(i => i.is_active)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading integrations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-700/90" />
        
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
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Integration Settings
              </h1>
              <p className="text-xl text-indigo-100 mt-2">
                Connect third-party services to extend functionality
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-indigo-100">
            <span>• Payment Gateways</span>
            <span>• Email Services</span>
            <span>• SMS Providers</span>
            <span>• Analytics</span>
            <span>• Authentication</span>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-2xl font-bold">{activeIntegrations.length}</div>
              <div className="text-indigo-200 text-sm">Active Integrations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-2xl font-bold">{integrationProviders.length}</div>
              <div className="text-indigo-200 text-sm">Available Providers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {Object.entries(groupedProviders).map(([category, providers]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons]
            const colorClass = categoryColors[category as keyof typeof categoryColors]
            
            return (
              <Card key={category} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-200/50">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-gradient-to-br ${colorClass} rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="capitalize">{category} Services</CardTitle>
                      <CardDescription>
                        Manage {category} integrations and configurations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {providers.map((provider) => {
                      const integration = integrations.find(i => i.provider === provider.id)
                      const isConfigured = integration && Object.keys(integration.config || {}).length > 0
                      const isActive = integration?.is_active
                      const ProviderIcon = provider.icon
                      
                      return (
                        <div
                          key={provider.id}
                          className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                            isActive 
                              ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                              : isConfigured
                              ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                          onClick={() => openEditDialog(provider.id)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClass}`}>
                              <ProviderIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex items-center space-x-2">
                              {isActive ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <Check className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : isConfigured ? (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                                  Not Setup
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h3 className="font-semibold text-slate-900 mb-2">{provider.name}</h3>
                            <p className="text-sm text-slate-600">{provider.description}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                              {provider.fields.length} fields required
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs">
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, provider: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <span>Configure Integration</span>
            </DialogTitle>
            <DialogDescription>
              {editDialog.provider && (
                <>
                  Configure {integrationProviders.find(p => p.id === editDialog.provider)?.name} integration settings
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {editDialog.provider && integrationProviders.find(p => p.id === editDialog.provider)?.fields.map((field) => {
                  const currentConfig = form.watch('config') || {}
                  const value = currentConfig[field.key] || ''
                  const isSecret = field.type === 'password'
                  const showSecret = showSecrets[field.key]
                  
                  return (
                    <div key={field.key} className="space-y-2">
                      <label className="text-sm font-medium text-slate-900">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'boolean' ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => updateConfigValue(field.key, checked)}
                          />
                          <span className="text-sm text-slate-600">
                            {value ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            type={isSecret && !showSecret ? 'password' : field.type === 'email' ? 'email' : 'text'}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            value={value}
                            onChange={(e) => updateConfigValue(field.key, e.target.value)}
                            className="pr-10"
                          />
                          {isSecret && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute inset-y-0 right-0 h-full px-3"
                              onClick={() => toggleSecretVisibility(field.key)}
                            >
                              {showSecret ? (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-slate-400" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">Enable Integration</div>
                  <div className="text-sm text-slate-600">
                    Activate this integration for use in your application
                  </div>
                </div>
                <Switch
                  checked={form.watch('is_active')}
                  onCheckedChange={(checked) => form.setValue('is_active', checked)}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setEditDialog({ open: false, provider: null })}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Integration
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 