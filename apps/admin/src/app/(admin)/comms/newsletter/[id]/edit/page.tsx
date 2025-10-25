'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { 
  Mail, 
  ArrowLeft, 
  Save, 
  Send, 
  Clock, 
  Users, 
  Image, 
  Type,
  Layout,
  Calendar,
  Target,
  Eye,
  Settings,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from '@/components/ui/use-toast'

interface NewsletterTemplate {
  id: string
  name: string
  description: string
  html_content: string
  category: string
}

interface Segment {
  id: string
  name: string
  subscriber_count: number
}

interface Newsletter {
  id: string
  subject: string
  preheader?: string
  content: string
  template_id?: string
  sender_name: string
  sender_email: string
  reply_to: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduled_date?: string
  target_audience: string
  subscriber_segments: string[]
  include_unsubscribe: boolean
  track_opens: boolean
  track_clicks: boolean
  newsletter_templates?: NewsletterTemplate
}

export default function EditNewsletterPage() {
  const router = useRouter()
  const params = useParams()
  const newsletterId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  
  const [formData, setFormData] = useState({
    subject: '',
    preheader: '',
    content: '',
    template_id: '',
    sender_name: 'DOCM Church',
    sender_email: 'newsletter@docmchurch.org',
    reply_to: 'admin@docmchurch.org',
    schedule_type: 'now', // 'now' | 'scheduled'
    scheduled_date: undefined as Date | undefined,
    target_audience: 'all', // 'all' | 'segment' | 'custom'
    subscriber_segments: [] as string[],
    include_unsubscribe: true,
    track_opens: true,
    track_clicks: true,
    save_as_template: false
  })

  const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    fetchData()
  }, [newsletterId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch newsletter data
      const newsletterResponse = await fetch(`/api/newsletter/newsletters/${newsletterId}`)
      if (newsletterResponse.ok) {
        const newsletterData = await newsletterResponse.json()
        const fetchedNewsletter = newsletterData.newsletter
        setNewsletter(fetchedNewsletter)
        
        // Populate form with existing data
        setFormData({
          subject: fetchedNewsletter.subject || '',
          preheader: fetchedNewsletter.preheader || '',
          content: fetchedNewsletter.content || '',
          template_id: fetchedNewsletter.template_id || '',
          sender_name: fetchedNewsletter.sender_name || 'DOCM Church',
          sender_email: fetchedNewsletter.sender_email || 'newsletter@docmchurch.org',
          reply_to: fetchedNewsletter.reply_to || 'admin@docmchurch.org',
          schedule_type: fetchedNewsletter.scheduled_date ? 'scheduled' : 'now',
          scheduled_date: fetchedNewsletter.scheduled_date ? new Date(fetchedNewsletter.scheduled_date) : undefined,
          target_audience: fetchedNewsletter.target_audience || 'all',
          subscriber_segments: fetchedNewsletter.subscriber_segments || [],
          include_unsubscribe: fetchedNewsletter.include_unsubscribe ?? true,
          track_opens: fetchedNewsletter.track_opens ?? true,
          track_clicks: fetchedNewsletter.track_clicks ?? true,
          save_as_template: false
        })

        // Set selected template if one exists
        if (fetchedNewsletter.newsletter_templates) {
          setSelectedTemplate(fetchedNewsletter.newsletter_templates)
        }
      } else {
        toast({
          title: "Error",
          description: "Newsletter not found",
          variant: "destructive"
        })
        router.push('/comms/newsletter')
        return
      }

      // Fetch templates
      const templatesResponse = await fetch('/api/newsletter/templates')
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setTemplates(templatesData.templates || [])
      }

      // Fetch segments
      const segmentsResponse = await fetch('/api/newsletter/segments')
      if (segmentsResponse.ok) {
        const segmentsData = await segmentsResponse.json()
        setSegments(segmentsData.segments || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load newsletter data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTemplateSelect = (template: NewsletterTemplate) => {
    setSelectedTemplate(template)
    handleInputChange('template_id', template.id)
  }

  const handleSave = async (type: 'draft' | 'send' | 'schedule') => {
    if (!formData.subject || !formData.content) {
      toast({
        title: "Error",
        description: "Subject and content are required",
        variant: "destructive"
      })
      return
    }

    if (type === 'schedule' && !formData.scheduled_date) {
      toast({
        title: "Error",
        description: "Scheduled date is required",
        variant: "destructive"
      })
      return
    }

    // Check if newsletter is already sent
    if (newsletter?.status === 'sent') {
      toast({
        title: "Error",
        description: "Cannot edit a newsletter that has already been sent",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const updateData = {
        ...formData,
        status: type === 'draft' ? 'draft' : type === 'send' ? 'sent' : 'scheduled',
        scheduled_date: type === 'schedule' ? formData.scheduled_date?.toISOString() : undefined
      }

      const response = await fetch(`/api/newsletter/newsletters/${newsletterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const { newsletter } = await response.json()
        toast({
          title: "Success",
          description: `Newsletter ${type === 'draft' ? 'saved as draft' : type === 'send' ? 'sent' : 'scheduled'} successfully!`,
        })
        router.push('/comms/newsletter')
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update newsletter",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update newsletter",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getAudienceCount = () => {
    if (formData.target_audience === 'all') {
      const allSegment = segments.find(s => s.name === 'All Subscribers')
      return allSegment?.subscriber_count || 0
    }
    
    if (formData.target_audience === 'segment') {
      return formData.subscriber_segments.reduce((total, segmentId) => {
        const segment = segments.find(s => s.id === segmentId)
        return total + (segment?.subscriber_count || 0)
      }, 0)
    }
    
    return 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading newsletter...</span>
        </div>
      </div>
    )
  }

  if (!newsletter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Newsletter not found</h2>
          <p className="text-gray-600 mb-4">The newsletter you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/comms/newsletter">Back to Newsletter</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Prevent editing if newsletter is already sent
  const isReadOnly = newsletter.status === 'sent'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/comms/newsletter">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Newsletter
                </Link>
              </Button>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-2xl">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {isReadOnly ? 'View Newsletter' : 'Edit Newsletter'}
                  </h1>
                  <p className="text-xl text-slate-600 mt-2">
                    {isReadOnly ? 'Review sent newsletter' : 'Modify your newsletter content and settings'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <Badge 
                variant={newsletter.status === 'sent' ? 'default' : newsletter.status === 'draft' ? 'secondary' : 'outline'}
                className={`px-3 py-1 text-sm ${
                  newsletter.status === 'sent' ? 'bg-green-100 text-green-800' :
                  newsletter.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  newsletter.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''
                }`}
              >
                {newsletter.status.charAt(0).toUpperCase() + newsletter.status.slice(1)}
              </Badge>
            </div>
          </div>

          {isReadOnly && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-600" />
                <p className="text-amber-800 font-medium">
                  This newsletter has already been sent and cannot be edited.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Newsletter Content
                </CardTitle>
                <CardDescription>
                  Create engaging content for your subscribers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Enter a compelling subject line..."
                    disabled={isReadOnly}
                    className="text-lg font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preheader">Preheader Text</Label>
                  <Input
                    id="preheader"
                    value={formData.preheader}
                    onChange={(e) => handleInputChange('preheader', e.target.value)}
                    placeholder="Preview text that appears in email clients..."
                    disabled={isReadOnly}
                  />
                  <p className="text-sm text-gray-500">
                    This text appears next to the subject line in most email clients
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Newsletter Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write your newsletter content here..."
                    disabled={isReadOnly}
                    rows={12}
                    className="min-h-[300px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            {!isReadOnly && (
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Template Selection
                  </CardTitle>
                  <CardDescription>
                    Choose a template to style your newsletter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            {!isReadOnly && (
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                    variant="outline"
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Draft
                  </Button>

                  {formData.schedule_type === 'now' ? (
                    <Button
                      onClick={() => handleSave('send')}
                      disabled={saving}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Now
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSave('schedule')}
                      disabled={saving || !formData.scheduled_date}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Clock className="mr-2 h-4 w-4" />
                      )}
                      Schedule Send
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Audience Targeting */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Audience Targeting
                </CardTitle>
                <CardDescription>
                  Choose who will receive this newsletter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select 
                    value={formData.target_audience} 
                    onValueChange={(value) => handleInputChange('target_audience', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subscribers</SelectItem>
                      <SelectItem value="segment">Specific Segments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target_audience === 'segment' && (
                  <div className="space-y-2">
                    <Label>Select Segments</Label>
                    <div className="space-y-2">
                      {segments.filter(s => s.name !== 'All Subscribers').map((segment) => (
                        <div key={segment.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`segment-${segment.id}`}
                            checked={formData.subscriber_segments.includes(segment.id)}
                            onChange={(e) => {
                              const segments = e.target.checked
                                ? [...formData.subscriber_segments, segment.id]
                                : formData.subscriber_segments.filter(id => id !== segment.id)
                              handleInputChange('subscriber_segments', segments)
                            }}
                            disabled={isReadOnly}
                            className="rounded"
                          />
                          <Label htmlFor={`segment-${segment.id}`} className="text-sm flex-1">
                            {segment.name}
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            {segment.subscriber_count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />
                
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Recipients</span>
                    <Badge variant="default" className="bg-emerald-100 text-emerald-800">
                      {getAudienceCount().toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sender Information */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Sender Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sender_name">From Name</Label>
                  <Input
                    id="sender_name"
                    value={formData.sender_name}
                    onChange={(e) => handleInputChange('sender_name', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_email">From Email</Label>
                  <Input
                    id="sender_email"
                    type="email"
                    value={formData.sender_email}
                    onChange={(e) => handleInputChange('sender_email', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reply_to">Reply To</Label>
                  <Input
                    id="reply_to"
                    type="email"
                    value={formData.reply_to}
                    onChange={(e) => handleInputChange('reply_to', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
            {!isReadOnly && (
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Send Time</Label>
                    <Select 
                      value={formData.schedule_type} 
                      onValueChange={(value) => handleInputChange('schedule_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Send Immediately</SelectItem>
                        <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.schedule_type === 'scheduled' && (
                    <div className="space-y-2">
                      <Label>Scheduled Date & Time</Label>
                      <DatePicker
                        date={formData.scheduled_date}
                        setDate={(date: Date) => handleInputChange('scheduled_date', date)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Newsletter Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Unsubscribe Link</Label>
                    <p className="text-sm text-gray-500">Required by law</p>
                  </div>
                  <Switch
                    checked={formData.include_unsubscribe}
                    onCheckedChange={(checked) => handleInputChange('include_unsubscribe', checked)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Track Opens</Label>
                    <p className="text-sm text-gray-500">Monitor email opens</p>
                  </div>
                  <Switch
                    checked={formData.track_opens}
                    onCheckedChange={(checked) => handleInputChange('track_opens', checked)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Track Clicks</Label>
                    <p className="text-sm text-gray-500">Monitor link clicks</p>
                  </div>
                  <Switch
                    checked={formData.track_clicks}
                    onCheckedChange={(checked) => handleInputChange('track_clicks', checked)}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 