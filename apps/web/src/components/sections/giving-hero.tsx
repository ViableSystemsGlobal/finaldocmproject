'use client'

import Link from 'next/link'
import { useGivingPage } from '@/hooks/useGivingPage'

export function GivingHero() {
  const { data: givingData, loading, error } = useGivingPage()
  const heroContent = givingData?.hero

  // Don't render during loading - show clean white page
  if (loading) {
    return null
  }

  if (error) {
    return (
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700"></div>
        <div className="relative z-10 text-center text-white">
          <p className="text-red-400">Error loading hero section: {error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
      {/* Video/Image Background */}
      <div className="absolute inset-0">
        {heroContent?.background_image ? (
          <div className="absolute inset-0">
            <img 
              src={heroContent.background_image} 
              alt="Giving Hero Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
        ) : (
          <>
            {/* Default gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
              {/* Video overlay */}
              <div className="absolute inset-0 bg-black/50"></div>
              
              {/* Simulated video background with moving pattern */}
              <div className="absolute inset-0 opacity-30">
                <div 
                  className="h-full w-full animate-pulse"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%),
                      linear-gradient(-45deg, transparent 25%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.05) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.05) 75%)
                    `,
                    backgroundSize: '60px 60px',
                    animation: 'moveBackground 25s linear infinite'
                  }}
                ></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Content */}
          <div className="text-white">
            {heroContent?.first_line_text && (
              <p className="text-sm font-medium text-white uppercase tracking-wider mb-6">
                {heroContent.first_line_text}
              </p>
            )}
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8">
              {heroContent?.heading || "Your generosity changes lives."}
            </h1>
            
            <p className="text-lg md:text-xl leading-relaxed text-gray-200 mb-12 max-w-3xl mx-auto">
              {heroContent?.subheading || "Through your faithful giving, we're able to serve our community, support missions, and further God's kingdom. Every gift, large or small, makes a meaningful difference."}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="#donation-form"
                className="bg-white text-gray-900 px-8 py-4 font-semibold hover:bg-gray-100 transition-all duration-300 text-center"
              >
                {heroContent?.cta_primary || "Make a Donation"}
              </Link>
              <Link 
                href="#giving-impact"
                className="border border-white text-white px-8 py-4 font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 text-center flex items-center justify-center gap-3"
              >
                {heroContent?.cta_secondary || "Learn More"}
                <div className="w-6 h-6 border border-current rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animation keyframes */}
      <style jsx>{`
        @keyframes moveBackground {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(60px) translateY(60px); }
        }
      `}</style>
    </section>
  )
} 