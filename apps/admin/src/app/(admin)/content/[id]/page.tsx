'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { PageEditor } from '@/components/content/PageEditor'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { fetchPage, fetchSections, Page, PageSection } from '@/services/content'
import { toast } from '@/components/ui/use-toast'

export default function EditPage({ params }: { params: { id: string } }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = React.use(params as unknown as Promise<{ id: string }>)
  const pageId = unwrappedParams.id
  
  const router = useRouter()
  const [page, setPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true)
      try {
        // Fetch page data
        const { data: pageData, error: pageError } = await fetchPage(pageId)
        if (pageError) throw pageError
        
        // Fetch page sections
        const { data: sectionsData, error: sectionsError } = await fetchSections(pageId)
        if (sectionsError) throw sectionsError
        
        setPage(pageData)
        setSections(sectionsData || [])
      } catch (error) {
        console.error('Error loading page data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load page data',
          variant: 'destructive',
        })
        // Redirect back to content list on error
        router.push('/content')
      } finally {
        setLoading(false)
      }
    }

    loadPageData()
  }, [pageId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Page</h2>
          <p className="text-slate-600">Fetching page data...</p>
        </div>
      </div>
    )
  }

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
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-2xl">
                  <Edit className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Edit Page: {page?.title}
                </h1>
                <p className="text-lg text-slate-600">
                  Update your content and settings
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
          {page && <PageEditor pageData={page} sectionsData={sections} />}
        </div>
      </div>
    </div>
  )
} 