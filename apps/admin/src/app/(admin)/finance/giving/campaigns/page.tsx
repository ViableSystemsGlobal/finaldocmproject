'use client'

import CampaignManagement from '@/components/giving/CampaignManagement'
import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CampaignsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              asChild
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <Link href="/finance/giving">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-2xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Donation Campaigns
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Phase 2: Manage and track fundraising campaigns with Stripe integration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Management Component */}
        <CampaignManagement />
      </div>
    </div>
  )
} 