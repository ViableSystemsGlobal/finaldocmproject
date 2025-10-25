'use client'

import { PageEditor } from '@/components/content/PageEditor'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function NewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              asChild
              className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl"
            >
              <Link href="/content">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-2xl">
                  <Plus className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Create New Page
                </h1>
                <p className="text-lg text-slate-600">
                  Build beautiful content for your website
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
          <PageEditor />
        </div>
      </div>
    </div>
  )
} 