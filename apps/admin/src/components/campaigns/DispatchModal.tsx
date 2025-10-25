'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Users, 
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Rocket,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { dispatchCampaign } from '@/services/comms/campaigns'
import { toast } from '@/components/ui/use-toast'

interface DispatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: {
    id: string
    name: string
    status: string
    channel: string
  }
  recipients: any[]
  onSuccess?: () => void
}

interface DispatchStats {
  total: number
  pending: number
  sent: number
  failed: number
  progress: number
}

export function DispatchModal({ 
  open, 
  onOpenChange, 
  campaign, 
  recipients,
  onSuccess 
}: DispatchModalProps) {
  const [currentStep, setCurrentStep] = useState<'confirm' | 'dispatching' | 'complete'>('confirm')
  const [stats, setStats] = useState<DispatchStats>({
    total: recipients.length,
    pending: recipients.length,
    sent: 0,
    failed: 0,
    progress: 0
  })

  // Dispatch mutation
  const { mutate: dispatchMutation, isPending } = useMutation({
    mutationFn: () => dispatchCampaign(campaign.id),
    onSuccess: (result) => {
      setCurrentStep('complete')
      
      // Handle different response types
      const sentCount = (result && typeof result === 'object' && 'sent' in result) ? result.sent : 0;
      const failedCount = (result && typeof result === 'object' && 'failed' in result) ? result.failed : 0;
      
      setStats(prev => ({
        ...prev,
        sent: sentCount,
        failed: failedCount,
        pending: 0,
        progress: 100
      }))
      
      toast({
        title: 'Campaign Dispatched Successfully!',
        description: `${sentCount} emails sent, ${failedCount} failed`,
      })
      
      onSuccess?.()
    },
    onError: (error: any) => {
      setCurrentStep('complete')
      toast({
        title: 'Dispatch Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    },
  })

  // Simulate progress updates during dispatch
  useEffect(() => {
    if (currentStep === 'dispatching' && isPending) {
      const interval = setInterval(() => {
        setStats(prev => {
          const newProgress = Math.min(prev.progress + Math.random() * 15, 95)
          const sentCount = Math.floor((newProgress / 100) * prev.total)
          
          return {
            ...prev,
            progress: newProgress,
            sent: sentCount,
            pending: Math.max(prev.total - sentCount, 0)
          }
        })
      }, 500)

      return () => clearInterval(interval)
    }
  }, [currentStep, isPending])

  const handleDispatch = () => {
    setCurrentStep('dispatching')
    setStats(prev => ({ ...prev, progress: 5 }))
    dispatchMutation()
  }

  const handleClose = () => {
    if (currentStep !== 'dispatching') {
      onOpenChange(false)
      // Reset state after closing
      setTimeout(() => {
        setCurrentStep('confirm')
        setStats({
          total: recipients.length,
          pending: recipients.length,
          sent: 0,
          failed: 0,
          progress: 0
        })
      }, 200)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Send className="h-4 w-4" />
      default:
        return <Send className="h-4 w-4" />
    }
  }

  const getStepIcon = () => {
    switch (currentStep) {
      case 'confirm':
        return <Rocket className="h-8 w-8 text-indigo-500" />
      case 'dispatching':
        return <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      case 'complete':
        return stats.failed === 0 ? 
          <CheckCircle2 className="h-8 w-8 text-green-500" /> :
          <AlertTriangle className="h-8 w-8 text-amber-500" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] border-0 bg-gradient-to-br from-white to-slate-50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getStepIcon()}
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {currentStep === 'confirm' && 'Ready to Dispatch'}
                {currentStep === 'dispatching' && 'Dispatching Campaign'}
                {currentStep === 'complete' && 'Dispatch Complete'}
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-1">
                {campaign.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Info */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getChannelIcon(campaign.channel)}
                <span className="font-medium text-slate-700 capitalize">{campaign.channel} Campaign</span>
              </div>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                {campaign.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Recipients</span>
                </div>
                <div className="text-lg font-bold text-slate-800">{stats.total}</div>
              </div>
              
              {currentStep !== 'confirm' && (
                <>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Sent</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">{stats.sent}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                    <div className="text-lg font-bold text-amber-700">{stats.pending}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar - Only show during dispatch */}
          {currentStep === 'dispatching' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Sending emails...</span>
                <span className="font-medium text-slate-800">{Math.round(stats.progress)}%</span>
              </div>
              <Progress 
                value={stats.progress} 
                className="h-3 bg-slate-200"
              />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing recipients...
              </div>
            </div>
          )}

          {/* Results - Only show when complete */}
          {currentStep === 'complete' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Successful</span>
                  </div>
                  <div className="text-xl font-bold text-green-800">{stats.sent}</div>
                </div>
                
                {stats.failed > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-700 mb-1">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Failed</span>
                    </div>
                    <div className="text-xl font-bold text-red-800">{stats.failed}</div>
                  </div>
                )}
              </div>

              {stats.failed === 0 ? (
                <div className="text-center py-2">
                  <p className="text-green-700 font-medium">🎉 All emails sent successfully!</p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-amber-700 font-medium">
                    ⚠️ {stats.sent} sent, {stats.failed} failed
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {currentStep === 'confirm' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDispatch}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Dispatch Now
                </Button>
              </>
            )}
            
            {currentStep === 'dispatching' && (
              <Button 
                disabled 
                className="w-full rounded-xl"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending emails...
              </Button>
            )}
            
            {currentStep === 'complete' && (
              <Button 
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 