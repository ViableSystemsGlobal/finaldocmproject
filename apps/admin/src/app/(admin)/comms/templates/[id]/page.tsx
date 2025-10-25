'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  BellRing, 
  Save,
  Loader2,
  Trash2,
  Edit3,
  Copy,
  Send,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  CommsTemplate, 
  fetchTemplate, 
  deleteTemplate 
} from '@/services/comms/templates'
import { useNextParams } from '@/lib/nextParams'
import { formatDistanceToNow } from 'date-fns'

type Params = {
  params: {
    id: string
  }
}

export default function TemplateDetailPage({ params }: Params) {
  const router = useRouter()
  const { id } = useNextParams(params)
  
  const [template, setTemplate] = useState<CommsTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Load template data
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        const { data, error } = await fetchTemplate(id)
        
        if (error) throw error
        if (!data) throw new Error('Template not found')
        
        setTemplate(data)
      } catch (error) {
        console.error('Failed to load template:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load template. Please try again.'
        })
        router.push('/comms/templates')
      } finally {
        setLoading(false)
      }
    }
    
    loadTemplate()
  }, [id, router])
  
  const handleDelete = async () => {
    if (!template) return
    
    setIsDeleting(true)
    
    try {
      const { success, error } = await deleteTemplate(template.id)
      
      if (!success) throw error
      
      toast({
        title: 'Template deleted',
        description: `Template "${template.name}" has been deleted.`
      })
      
      router.push('/comms/templates')
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete template. Please try again.'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-6 w-6" />
      case 'sms': return <MessageSquare className="h-6 w-6" />
      case 'whatsapp': return <MessageSquare className="h-6 w-6" />
      case 'push': return <BellRing className="h-6 w-6" />
      default: return <Mail className="h-6 w-6" />
    }
  }

  const getChannelGradient = (channel: string) => {
    switch (channel) {
      case 'email': return 'from-blue-500 to-blue-600'
      case 'sms': return 'from-green-500 to-green-600'
      case 'whatsapp': return 'from-emerald-500 to-emerald-600'
      case 'push': return 'from-purple-500 to-purple-600'
      default: return 'from-blue-500 to-blue-600'
    }
  }

  const getChannelBadge = (channel: string) => {
    const variants = {
      email: 'bg-blue-100 text-blue-800 border-blue-200',
      sms: 'bg-green-100 text-green-800 border-green-200', 
      whatsapp: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      push: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    
    return (
      <Badge className={`${variants[channel as keyof typeof variants]} border font-medium`}>
        {channel.toUpperCase()}
      </Badge>
    )
  }

  const handleCopyContent = () => {
    if (template) {
      navigator.clipboard.writeText(template.body)
      toast({
        title: 'Content copied',
        description: 'Template content copied to clipboard'
      })
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Template</h2>
          <p className="text-slate-600">Fetching template details...</p>
        </div>
      </div>
    )
  }
  
  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto">
            <MessageSquare className="h-10 w-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Template Not Found</h2>
          <p className="text-slate-600 mb-6">The template you're looking for doesn't exist.</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/comms/templates')}
            className="rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push('/comms/templates')}
              className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className={`relative bg-gradient-to-r ${getChannelGradient(template.channel)} p-4 rounded-2xl`}>
                  {getChannelIcon(template.channel)}
                  <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {template.name}
                  </h1>
                  {getChannelBadge(template.channel)}
                </div>
                <p className="text-lg text-slate-600">
                  {template.subject || 'Communication template'}
                </p>
                <p className="text-sm text-slate-500">
                  Updated {formatDistanceToNow(new Date(template.updated_at))} ago
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleCopyContent}
                variant="outline"
                className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button 
                onClick={() => router.push(`/comms/templates/${template.id}/edit`)}
                className={`bg-gradient-to-r ${getChannelGradient(template.channel)} hover:opacity-90 text-white border-0 shadow-lg rounded-xl`}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="rounded-xl"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
        
        {/* Template Content */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${getChannelGradient(template.channel)} px-8 py-6`}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                {getChannelIcon(template.channel)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Template Content</h3>
                <p className="text-white/80">Preview and manage your template</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Template Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">Template Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Name:</span>
                    <span className="font-medium text-slate-800">{template.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Channel:</span>
                    <span className="font-medium text-slate-800">{template.channel.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium text-slate-800">
                      {formatDistanceToNow(new Date(template.created_at))} ago
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Updated:</span>
                    <span className="font-medium text-slate-800">
                      {formatDistanceToNow(new Date(template.updated_at))} ago
                    </span>
                  </div>
                </div>
              </div>
              
              {template.subject && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-slate-800 mb-3">Subject Line</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {template.subject}
                  </p>
                </div>
              )}
            </div>
            
            {/* Template Content */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-800">Template Body</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyContent}
                  className="rounded-lg"
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Copy Content
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {template.body}
                </pre>
              </div>
            </div>
            
            {/* Variables Schema */}
            {template.variables_schema && template.variables_schema.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-slate-800">Dynamic Variables</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.variables_schema.map((variable: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                      <code className="text-sm font-mono text-purple-700">
                        {'{{'} {variable.name || `variable_${index}`} {'}}'}
                      </code>
                      {variable.description && (
                        <p className="text-xs text-slate-600 mt-1">{variable.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{template.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Template'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 