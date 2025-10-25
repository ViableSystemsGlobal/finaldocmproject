'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Plus
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  fetchDonationCampaigns, 
  DonationCampaign 
} from '@/services/giving'
import CampaignCreateDialog from './CampaignCreateDialog'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'No end date'
  return new Date(dateString).toLocaleDateString()
}

const calculateProgress = (current: number, goal: number | null) => {
  if (!goal || goal === 0) return 0
  return Math.min((current / goal) * 100, 100)
}

const getCampaignStatus = (campaign: DonationCampaign) => {
  if (!campaign.is_active) return 'inactive'
  if (campaign.end_date && new Date(campaign.end_date) < new Date()) return 'ended'
  if (campaign.goal_amount && campaign.current_amount >= campaign.goal_amount) return 'completed'
  return 'active'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'completed': return 'bg-blue-100 text-blue-800'
    case 'ended': return 'bg-gray-100 text-gray-800'
    case 'inactive': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null)

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchDonationCampaigns()
      
      if (error) throw error
      
      setCampaigns(data || [])
    } catch (err) {
      console.error('Failed to load campaigns:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load donation campaigns. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Donation Campaigns</h2>
          <Button disabled className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Donation Campaigns</h2>
          <p className="text-slate-600 mt-1">Manage and track your fundraising campaigns</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Campaigns</p>
                <p className="text-xl font-bold text-blue-800">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Active Campaigns</p>
                <p className="text-xl font-bold text-green-800">
                  {campaigns.filter(c => getCampaignStatus(c) === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Raised</p>
                <p className="text-xl font-bold text-purple-800">
                  {formatCurrency(campaigns.reduce((sum, c) => sum + c.current_amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Completed</p>
                <p className="text-xl font-bold text-orange-800">
                  {campaigns.filter(c => getCampaignStatus(c) === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          const status = getCampaignStatus(campaign)
          const progress = calculateProgress(campaign.current_amount, campaign.goal_amount)
          
          return (
            <Card key={campaign.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-green-600 transition-colors">
                      {campaign.name}
                    </h3>
                    <Badge className={`${getStatusColor(status)} capitalize`}>
                      {status}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Campaign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {campaign.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {campaign.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                {campaign.goal_amount && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-green-600">
                        {formatCurrency(campaign.current_amount)}
                      </span>
                      <span className="text-slate-500">
                        of {formatCurrency(campaign.goal_amount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Campaign Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Ends: {formatDate(campaign.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Target className="h-4 w-4" />
                    <span className="capitalize">{campaign.campaign_type} Fund</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 hover:bg-green-50 hover:border-green-200"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingCampaign(campaign)}
                    className="flex-1 hover:bg-blue-50 hover:border-blue-200"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No campaigns found</h3>
          <p className="text-slate-600 mb-4">Create your first donation campaign to start fundraising.</p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Campaign
          </Button>
        </div>
      )}

      {/* Create/Edit Campaign Dialog */}
      <CampaignCreateDialog
        open={showCreateDialog || !!editingCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingCampaign(null)
          }
        }}
        campaign={editingCampaign}
        onSuccess={loadCampaigns}
      />
    </div>
  )
} 