'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  Mail, 
  ArrowLeft, 
  Edit, 
  Users, 
  Calendar,
  Target,
  Eye,
  Settings,
  Loader2,
  Send,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'

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
  sent_at?: string
  target_audience: string
  subscriber_segments: string[]
  include_unsubscribe: boolean
  track_opens: boolean
  track_clicks: boolean
  total_recipients?: number
  total_opened?: number
  total_clicked?: number
  created_at: string
  newsletter_templates?: {
    name: string
    category: string
    description: string
  }
}

export default function ViewNewsletterPage() {
  const params = useParams()
  const newsletterId = params.id as string

  const [loading, setLoading] = useState(true)
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)

  useEffect(() => {
    fetchNewsletter()
  }, [newsletterId])

  const fetchNewsletter = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/newsletter/newsletters/${newsletterId}`)
      if (response.ok) {
        const data = await response.json()
        setNewsletter(data.newsletter)
      } else {
        toast({
          title: "Error",
          description: "Newsletter not found",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching newsletter:', error)
      toast({
        title: "Error",
        description: "Failed to load newsletter data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'sending':
        return <Badge className="bg-yellow-100 text-yellow-800">Sending</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const calculateOpenRate = (opened: number, recipients: number) => {
    if (recipients === 0) return 0
    return Math.round((opened / recipients) * 100)
  }

  const calculateClickRate = (clicked: number, opened: number) => {
    if (opened === 0) return 0
    return Math.round((clicked / opened) * 100)
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
                    Newsletter Details
                  </h1>
                  <p className="text-xl text-slate-600 mt-2">
                    View newsletter content and performance
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {getStatusBadge(newsletter.status)}
              {newsletter.status === 'draft' && (
                <Button asChild>
                  <Link href={`/comms/newsletter/${newsletter.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Newsletter Content */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Newsletter Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{newsletter.subject}</h3>
                  {newsletter.preheader && (
                    <p className="text-gray-600 mb-4">{newsletter.preheader}</p>
                  )}
                </div>

                <Separator />

                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {newsletter.content}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics (if sent) */}
            {newsletter.status === 'sent' && (
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    How this newsletter performed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {newsletter.total_recipients?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500">Recipients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {newsletter.total_opened?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500">Opens</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {calculateOpenRate(newsletter.total_opened || 0, newsletter.total_recipients || 0)}%
                      </div>
                      <div className="text-sm text-gray-500">Open Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {calculateClickRate(newsletter.total_clicked || 0, newsletter.total_opened || 0)}%
                      </div>
                      <div className="text-sm text-gray-500">Click Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Newsletter Info */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Newsletter Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(newsletter.status)}</div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <div className="mt-1 text-sm">{formatDate(newsletter.created_at)}</div>
                </div>

                {newsletter.sent_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Sent</Label>
                    <div className="mt-1 text-sm">{formatDate(newsletter.sent_at)}</div>
                  </div>
                )}

                {newsletter.scheduled_date && newsletter.status === 'scheduled' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Scheduled</Label>
                    <div className="mt-1 text-sm">{formatDate(newsletter.scheduled_date)}</div>
                  </div>
                )}

                {newsletter.newsletter_templates && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Template</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{newsletter.newsletter_templates.name}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audience Info */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Target Audience</Label>
                  <div className="mt-1 text-sm capitalize">
                    {newsletter.target_audience === 'all' ? 'All Subscribers' : 'Specific Segments'}
                  </div>
                </div>

                {newsletter.subscriber_segments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Segments</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {newsletter.subscriber_segments.map((segment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {segment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sender Info */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Sender Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">From</Label>
                  <div className="mt-1 text-sm">
                    {newsletter.sender_name} &lt;{newsletter.sender_email}&gt;
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Reply To</Label>
                  <div className="mt-1 text-sm">{newsletter.reply_to}</div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Unsubscribe Link</span>
                  <Badge variant={newsletter.include_unsubscribe ? "default" : "secondary"} className="text-xs">
                    {newsletter.include_unsubscribe ? "Included" : "Not Included"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Track Opens</span>
                  <Badge variant={newsletter.track_opens ? "default" : "secondary"} className="text-xs">
                    {newsletter.track_opens ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Track Clicks</span>
                  <Badge variant={newsletter.track_clicks ? "default" : "secondary"} className="text-xs">
                    {newsletter.track_clicks ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
} 