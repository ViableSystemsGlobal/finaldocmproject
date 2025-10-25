'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  Phone,
  User,
  Calendar,
  CheckCircle,
  Archive,
  AlertTriangle,
  Clock,
  Loader2,
  Edit,
  Trash2,
  Reply
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import {
  WebsiteMessage,
  fetchWebsiteMessageById,
  deleteWebsiteMessage,
  markMessageAsRead,
  markMessageAsResponded,
  archiveMessage
} from '@/services/websiteMessages'

export default function WebsiteMessageDetailPage() {
  const router = useRouter()
  const params = useParams()
  const messageId = params.id as string
  
  const [message, setMessage] = useState<WebsiteMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseNotes, setResponseNotes] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  // Load message data
  useEffect(() => {
    const loadMessage = async () => {
      if (!messageId) return
      
      try {
        setLoading(true)
        const { data, error } = await fetchWebsiteMessageById(messageId)
        
        if (error) throw error
        
        setMessage(data as unknown as WebsiteMessage)
        
        // Mark as read if unread
        if (data && (data as WebsiteMessage).status === 'unread') {
          await markMessageAsRead(messageId)
          setMessage(prev => prev ? { ...prev, status: 'read' } : null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load message')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load message details'
        })
      } finally {
        setLoading(false)
      }
    }

    loadMessage()
  }, [messageId])

  const handleDelete = async () => {
    if (!message) return
    
    try {
      setIsDeleting(true)
      
      const { error } = await deleteWebsiteMessage(message.id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Message deleted successfully'
      })
      
      router.push('/people/outreach/website-messages')
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete message'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleRespond = async () => {
    if (!message || !responseNotes.trim()) return
    
    try {
      setIsResponding(true)
      
      const { error } = await markMessageAsResponded(message.id, responseNotes)
      
      if (error) throw error
      
      setMessage(prev => prev ? {
        ...prev,
        status: 'responded',
        response_notes: responseNotes,
        responded_at: new Date().toISOString()
      } : null)
      
      toast({
        title: 'Success',
        description: 'Response recorded successfully'
      })
      
      setShowResponseDialog(false)
      setResponseNotes('')
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record response'
      })
    } finally {
      setIsResponding(false)
    }
  }

  const handleArchive = async () => {
    if (!message) return
    
    try {
      setIsArchiving(true)
      
      const { error } = await archiveMessage(message.id)
      
      if (error) throw error
      
      setMessage(prev => prev ? { ...prev, status: 'archived' } : null)
      
      toast({
        title: 'Success',
        description: 'Message archived successfully'
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to archive message'
      })
    } finally {
      setIsArchiving(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy \'at\' h:mm a')
    } catch {
      return 'Invalid date'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-yellow-100 text-yellow-800'
      case 'read': return 'bg-blue-100 text-blue-800'
      case 'responded': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Message</h2>
          <p className="text-slate-600">Fetching message details...</p>
        </div>
      </div>
    )
  }

  if (error || !message) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="text-center">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-10 w-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Message Not Found</h2>
            <p className="text-slate-600 mb-6">The message you're looking for doesn't exist or has been deleted.</p>
            <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
              <Link href="/people/outreach/website-messages">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Messages
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            asChild 
            variant="ghost" 
            className="mb-6 hover:bg-white/50 text-slate-600"
          >
            <Link href="/people/outreach/website-messages">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Website Messages
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-2xl">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Website Message
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  {message.subject || 'No subject'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              {message.status !== 'responded' && (
                <Button 
                  onClick={() => setShowResponseDialog(true)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-6 py-2 rounded-xl"
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Respond
                </Button>
              )}
              {message.status !== 'archived' && (
                <Button 
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-lg px-6 py-2 rounded-xl"
                >
                  {isArchiving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Archive
                </Button>
              )}
              <Button 
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-6 py-2 rounded-xl"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message Card */}
            <Card className="bg-white/70 backdrop-blur-lg shadow-xl border border-white/20">
              <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-800">Message Content</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={`${getStatusColor(message.status)} border`}>
                      {message.status}
                    </Badge>
                    <Badge className={`${getPriorityColor(message.priority)} border`}>
                      {message.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Subject</h3>
                    <p className="text-slate-700">{message.subject || 'No subject provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Message</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                  
                  {message.category && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Category</h3>
                      <Badge variant="outline" className="bg-slate-50">
                        {message.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Response History */}
            {message.status === 'responded' && message.response_notes && (
              <Card className="bg-white/70 backdrop-blur-lg shadow-xl border border-white/20">
                <CardHeader className="bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-t-xl">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    Response Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Response Notes</h4>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {message.response_notes}
                        </p>
                      </div>
                    </div>
                    {message.responded_at && (
                      <p className="text-sm text-slate-600">
                        Responded on {formatDate(message.responded_at)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sender Information */}
            <Card className="bg-white/70 backdrop-blur-lg shadow-xl border border-white/20">
              <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-t-xl">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Sender Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Name</h4>
                    <p className="text-slate-700">{message.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </h4>
                    <a 
                      href={`mailto:${message.email}`}
                      className="text-indigo-600 hover:text-indigo-800 underline"
                    >
                      {message.email}
                    </a>
                  </div>
                  
                  {message.phone && (
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </h4>
                      <a 
                        href={`tel:${message.phone}`}
                        className="text-indigo-600 hover:text-indigo-800 underline"
                      >
                        {message.phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message Details */}
            <Card className="bg-white/70 backdrop-blur-lg shadow-xl border border-white/20">
              <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-t-xl">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Message Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Received</h4>
                    <p className="text-slate-700">{formatDate(message.created_at)}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Source</h4>
                    <p className="text-slate-700 capitalize">{message.source}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Priority</h4>
                    <Badge className={`${getPriorityColor(message.priority)} border`}>
                      {message.priority}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Status</h4>
                    <Badge className={`${getStatusColor(message.status)} border`}>
                      {message.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Response Dialog */}
      {showResponseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-2xl w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Record Response</h3>
              <p className="text-sm text-slate-600 mt-2">
                Record your response to {message.name}'s message
              </p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="response-notes" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Response Notes
                </Label>
                <Textarea
                  id="response-notes"
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Describe how you responded to this message (e.g., called, emailed, met in person)..."
                  className="h-32 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowResponseDialog(false)}
                disabled={isResponding}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRespond}
                disabled={isResponding || !responseNotes.trim()}
                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {isResponding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Response'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 