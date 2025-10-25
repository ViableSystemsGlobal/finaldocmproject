'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Target } from 'lucide-react'
import { createDonationCampaign, updateDonationCampaign, DonationCampaign } from '@/services/giving'

interface CampaignCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: DonationCampaign | null
  onSuccess: () => void
}

export default function CampaignCreateDialog({ 
  open, 
  onOpenChange, 
  campaign, 
  onSuccess 
}: CampaignCreateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    goal_amount: campaign?.goal_amount?.toString() || '',
    campaign_type: campaign?.campaign_type || 'general',
    start_date: campaign?.start_date || '',
    end_date: campaign?.end_date || '',
    is_active: campaign?.is_active ?? true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Campaign name is required'
      })
      return
    }

    setLoading(true)

    try {
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) : null,
        campaign_type: formData.campaign_type,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active
      }

      let result
      if (campaign) {
        // Update existing campaign
        result = await updateDonationCampaign(campaign.id, campaignData)
      } else {
        // Create new campaign
        result = await createDonationCampaign(campaignData)
      }

      if (result.error) throw result.error

      toast({
        title: 'Success',
        description: `Campaign ${campaign ? 'updated' : 'created'} successfully`
      })

      onSuccess()
      onOpenChange(false)
      
      // Reset form if creating new campaign
      if (!campaign) {
        setFormData({
          name: '',
          description: '',
          goal_amount: '',
          campaign_type: 'general',
          start_date: '',
          end_date: '',
          is_active: true
        })
      }
    } catch (error) {
      console.error('Failed to save campaign:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${campaign ? 'update' : 'create'} campaign`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {campaign ? 'Edit Campaign' : 'Create New Campaign'}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {campaign 
                  ? 'Update the campaign details and settings'
                  : 'Create a new fundraising campaign to track donations'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
              Campaign Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Building Fund 2024"
              className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the purpose and goals of this campaign..."
              className="min-h-[100px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500"
              rows={4}
            />
          </div>

          {/* Goal Amount & Campaign Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="goal_amount" className="text-sm font-semibold text-slate-700">
                Goal Amount ($)
              </Label>
              <Input
                id="goal_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.goal_amount}
                onChange={(e) => handleChange('goal_amount', e.target.value)}
                placeholder="50000.00"
                className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_type" className="text-sm font-semibold text-slate-700">
                Campaign Type
              </Label>
              <Select value={formData.campaign_type} onValueChange={(value) => handleChange('campaign_type', value)}>
                <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Fund</SelectItem>
                  <SelectItem value="building">Building Fund</SelectItem>
                  <SelectItem value="missions">Missions</SelectItem>
                  <SelectItem value="ministry">Ministry</SelectItem>
                  <SelectItem value="emergency">Emergency Relief</SelectItem>
                  <SelectItem value="outreach">Community Outreach</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start & End Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-sm font-semibold text-slate-700">
                Start Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-sm font-semibold text-slate-700">
                End Date
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <Label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                Campaign Active
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Active campaigns will accept donations and appear in lists
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {campaign ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                campaign ? 'Update Campaign' : 'Create Campaign'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 