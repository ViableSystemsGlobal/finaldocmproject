'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function NewNewsletterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  
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
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
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

  const handlePreview = async () => {
    if (!formData.content) {
      toast({
        title: "Error",
        description: "Please add some content to preview",
        variant: "destructive"
      })
      return
    }

    setPreviewLoading(true)
    try {
      const response = await fetch('/api/newsletter/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formData.content,
          template_id: formData.template_id,
          subject: formData.subject,
          preheader: formData.preheader
        }),
      })

      if (response.ok) {
        const { html_content } = await response.json()
        setPreviewHtml(html_content)
        setIsPreviewMode(true)
      } else {
        toast({
          title: "Error",
          description: "Failed to generate preview",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive"
      })
    } finally {
      setPreviewLoading(false)
    }
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

    setSaving(true)
    try {
      const newsletterData = {
        ...formData,
        status: type === 'draft' ? 'draft' : type === 'send' ? 'sent' : 'scheduled',
        scheduled_date: type === 'schedule' ? formData.scheduled_date?.toISOString() : undefined
      }

      const response = await fetch('/api/newsletter/newsletters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletterData),
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
          description: errorData.error || "Failed to save newsletter",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save newsletter",
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
          <span className="text-lg font-medium">Loading newsletter editor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/comms/newsletter">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Newsletters
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
                    Create Newsletter
                  </h1>
                  <p className="text-xl text-slate-600 mt-2">
                    Design and send engaging newsletters to your community
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={isPreviewMode ? () => setIsPreviewMode(false) : handlePreview}
                disabled={previewLoading}
                className="rounded-xl"
              >
                {previewLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                {isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="rounded-xl"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Draft
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Mode */}
        {isPreviewMode && previewHtml && (
          <div className="mb-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-emerald-600" />
                  Newsletter Preview
                </CardTitle>
                <CardDescription>
                  This is how your newsletter will appear to recipients.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-emerald-600" />
                  Newsletter Details
                </CardTitle>
                <CardDescription>
                  Configure the basic information for your newsletter.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Enter your newsletter subject..."
                    className="rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preheader">Preheader Text (Optional)</Label>
                  <Input
                    id="preheader"
                    value={formData.preheader}
                    onChange={(e) => handleInputChange('preheader', e.target.value)}
                    placeholder="Preview text that appears in email clients..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Newsletter Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write your newsletter content here..."
                    className="min-h-[200px] rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-emerald-600" />
                  Choose Template
                </CardTitle>
                <CardDescription>
                  Select a template to style your newsletter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedTemplate?.id === template.id
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                          <Layout className="h-6 w-6 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800">{template.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Audience Targeting */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  Audience
                </CardTitle>
                <CardDescription>
                  Choose who will receive this newsletter.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="all-subscribers"
                      name="audience"
                      checked={formData.target_audience === 'all'}
                      onChange={() => handleInputChange('target_audience', 'all')}
                      className="text-emerald-600"
                    />
                    <Label htmlFor="all-subscribers" className="font-medium">
                      All Subscribers
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="segments"
                      name="audience"
                      checked={formData.target_audience === 'segment'}
                      onChange={() => handleInputChange('target_audience', 'segment')}
                      className="text-emerald-600"
                    />
                    <Label htmlFor="segments" className="font-medium">
                      Specific Segments
                    </Label>
                  </div>
                </div>

                {formData.target_audience === 'segment' && (
                  <div className="mt-4 space-y-2">
                    <Label>Select Segments</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {segments.filter(s => s.name !== 'All Subscribers').map((segment) => (
                        <div key={segment.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`segment-${segment.id}`}
                            checked={formData.subscriber_segments.includes(segment.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange('subscriber_segments', [...formData.subscriber_segments, segment.id])
                              } else {
                                handleInputChange('subscriber_segments', formData.subscriber_segments.filter(id => id !== segment.id))
                              }
                            }}
                            className="text-emerald-600"
                          />
                          <Label htmlFor={`segment-${segment.id}`} className="text-sm">
                            {segment.name} ({segment.subscriber_count})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">
                      Recipients: {getAudienceCount().toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Schedule
                </CardTitle>
                <CardDescription>
                  Choose when to send your newsletter.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="send-now"
                      name="schedule"
                      checked={formData.schedule_type === 'now'}
                      onChange={() => handleInputChange('schedule_type', 'now')}
                      className="text-emerald-600"
                    />
                    <Label htmlFor="send-now" className="font-medium">
                      Send Immediately
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="schedule-later"
                      name="schedule"
                      checked={formData.schedule_type === 'scheduled'}
                      onChange={() => handleInputChange('schedule_type', 'scheduled')}
                      className="text-emerald-600"
                    />
                    <Label htmlFor="schedule-later" className="font-medium">
                      Schedule for Later
                    </Label>
                  </div>
                </div>

                {formData.schedule_type === 'scheduled' && (
                  <div className="mt-4">
                    <Label>Select Date & Time</Label>
                    <DatePicker
                      setDate={(date) => handleInputChange('scheduled_date', date)}
                      className="w-full mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-600" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="track-opens">Track Opens</Label>
                  <Switch
                    id="track-opens"
                    checked={formData.track_opens}
                    onCheckedChange={(checked) => handleInputChange('track_opens', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="track-clicks">Track Clicks</Label>
                  <Switch
                    id="track-clicks"
                    checked={formData.track_clicks}
                    onCheckedChange={(checked) => handleInputChange('track_clicks', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-unsubscribe">Include Unsubscribe</Label>
                  <Switch
                    id="include-unsubscribe"
                    checked={formData.include_unsubscribe}
                    onCheckedChange={(checked) => handleInputChange('include_unsubscribe', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="save-template">Save as Template</Label>
                  <Switch
                    id="save-template"
                    checked={formData.save_as_template}
                    onCheckedChange={(checked) => handleInputChange('save_as_template', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Send Actions */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {formData.schedule_type === 'now' ? (
                    <Button 
                      onClick={() => handleSave('send')} 
                      disabled={saving}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12"
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send Newsletter Now
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSave('schedule')} 
                      disabled={saving}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12"
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                      Schedule Newsletter
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleSave('draft')} 
                    disabled={saving}
                    className="w-full rounded-xl h-12"
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 