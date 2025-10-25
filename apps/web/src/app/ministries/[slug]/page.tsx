import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Clock, MapPin, Heart, Mail, Phone, Calendar, CheckCircle, ExternalLink } from 'lucide-react'

interface MinistryData {
  id: string
  title: string
  description: string
  excerpt: string
  featured_image?: string
  icon_emoji: string
  category: string
  time_commitment?: string
  contact_person?: string
  contact_email?: string
  contact_phone?: string
  requirements?: string[]
  benefits?: string[]
  gradient_colors: {
    from: string
    to: string
  }
  ministry_group?: {
    id: string
    name: string
    type: string
  }
  location?: string
  meeting_times?: string[]
}

interface MinistryPageProps {
  params: Promise<{
    slug: string
  }>
}

async function fetchMinistryData(slug: string): Promise<MinistryData | null> {
  try {
    // In development, use localhost; in production, use the site URL
    const isDev = process.env.NODE_ENV === 'development'
    const baseUrl = isDev ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_SITE_URL || 'https://docmchurch.org')
    
    const response = await fetch(`${baseUrl}/api/ministries/${encodeURIComponent(slug)}`, {
      cache: 'no-store', // Don't cache during development
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error(`Ministry fetch failed: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    return data.ministry
  } catch (error) {
    console.error('Error fetching ministry:', error)
    return null
  }
}

// Generate static params for common ministry slugs
export async function generateStaticParams() {
  // Common ministry slugs that should be pre-generated
  const commonSlugs = [
    'worship-ministry',
    'youth-ministry',
    'children-ministry',
    'mens-ministry',
    'womens-ministry',
    'music-ministry',
    'prayer-ministry',
    'outreach-ministry',
    'discipleship-ministry',
    'hospitality-ministry',
    'media-ministry',
    'ushers-ministry',
    'pastoral-care',
    'small-groups',
    'bible-study'
  ]
  
  return commonSlugs.map((slug) => ({
    slug,
  }))
}

// Generate metadata for the ministry page
export async function generateMetadata({ params }: MinistryPageProps): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const ministry = await fetchMinistryData(slug)
    
    if (ministry) {
      return {
        title: `${ministry.title} - DOCM Church`,
        description: ministry.description || ministry.excerpt,
        openGraph: {
          title: `${ministry.title} - DOCM Church`,
          description: ministry.description || ministry.excerpt,
          type: 'website',
          images: ministry.featured_image ? [ministry.featured_image] : [],
        },
      }
    }
  } catch (error) {
    console.error('Error generating metadata for ministry:', error)
  }

  return {
    title: 'Ministry - DOCM Church',
    description: 'Discover how you can get involved and serve in our church ministries.',
  }
}

export default async function MinistryPage({ params }: MinistryPageProps) {
  const { slug } = await params
  const ministry = await fetchMinistryData(slug)

  if (!ministry) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden h-[50vh] min-h-[400px]">
        {ministry.featured_image ? (
          <>
            <div className="absolute inset-0">
              <img 
                src={ministry.featured_image} 
                alt={ministry.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60"></div>
            </div>
          </>
        ) : (
          <div className={`bg-gradient-to-br from-${ministry.gradient_colors.from} to-${ministry.gradient_colors.to}`}>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link 
              href="/#get-involved"
              className="inline-flex items-center text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Get Involved
            </Link>
          </div>

          {/* Hero Content - Centered */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-6">{ministry.icon_emoji}</div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {ministry.title}
              </h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
                {ministry.excerpt}
              </p>
              
              {/* Quick Info */}
              <div className="flex flex-wrap justify-center gap-6 mt-8">
                {ministry.time_commitment && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Clock className="w-5 h-5" />
                    <span>{ministry.time_commitment}</span>
                  </div>
                )}
                {ministry.category && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Users className="w-5 h-5" />
                    <span className="capitalize">{ministry.category}</span>
                  </div>
                )}
                {ministry.contact_person && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Heart className="w-5 h-5" />
                    <span>{ministry.contact_person}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Ministry</h2>
                <div className="prose prose-lg max-w-none text-gray-700">
                  <p>{ministry.description}</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Involved</h3>
                
                {/* Contact Info */}
                <div className="space-y-4 mb-8">
                  {ministry.contact_person && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Contact Person</div>
                        <div className="text-gray-600">{ministry.contact_person}</div>
                      </div>
                    </div>
                  )}
                  
                  {ministry.contact_email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Email</div>
                        <a 
                          href={`mailto:${ministry.contact_email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {ministry.contact_email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {ministry.contact_phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Phone</div>
                        <a 
                          href={`tel:${ministry.contact_phone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {ministry.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {ministry.time_commitment && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Time Commitment</div>
                        <div className="text-gray-600">{ministry.time_commitment}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  href="/contact"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center inline-block"
                >
                  Get Involved Today
                </Link>
                
                <div className="mt-4 text-center">
                  <Link
                    href="/#get-involved"
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    ← Browse All Ministries
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 