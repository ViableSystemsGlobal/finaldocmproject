'use client'

import { useGivingPage } from '@/hooks/useGivingPage'
import { GivingHero } from '@/components/sections/giving-hero'
import { GivingForm } from '@/components/sections/giving-form'

export default function GivingPageClient() {
  const { data: givingData, loading, error } = useGivingPage()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-300 rounded mb-8"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to load giving page
            </h1>
            <p className="text-gray-600 mb-8">
              We're having trouble loading the page content. Please try again later.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!givingData) {
    return null
  }

  return (
    <>
      {/* Hero Section */}
      <GivingHero />
      
      {/* Giving Form */}
      <GivingForm />
    </>
  )
} 