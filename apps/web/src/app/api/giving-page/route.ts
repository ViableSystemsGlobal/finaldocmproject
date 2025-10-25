import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// Default/fallback content for giving page
const defaultGivingPageContent = {
  hero: {
    first_line_text: "Give",
    heading: "Your generosity changes lives.",
    subheading: "Through your faithful giving, we're able to serve our community, support missions, and further God's kingdom. Every gift, large or small, makes a meaningful difference.",
    background_image: null,
    cta_primary: "Make a Donation",
    cta_secondary: "Learn More"
  },
  giving_methods: {
    section_title: "Ways to Give",
    section_heading: "Multiple Giving Options",
    section_description: "Choose the giving method that works best for you. All donations are secure and tax-deductible.",
    methods: [
      {
        id: 'online',
        title: 'Online Giving',
        description: 'Secure, convenient giving through our website',
        icon: 'credit-card',
        features: ['One-time or recurring', 'Instant receipts', 'Multiple payment methods']
      },
      {
        id: 'text',
        title: 'Text to Give',
        description: 'Quick giving via text message',
        icon: 'phone',
        features: ['Text amount to donate', 'Set up recurring gifts', 'Secure and simple']
      },
      {
        id: 'check',
        title: 'Check or Cash',
        description: 'Traditional giving methods welcomed',
        icon: 'banknote',
        features: ['Drop in offering', 'Mail to church', 'In-person giving']
      }
    ]
  },
  fund_designations: [
    { id: 'general', name: 'General Fund', description: 'Supports overall church operations and ministries' },
    { id: 'building', name: 'Building Fund', description: 'Facility improvements and expansion projects' },
    { id: 'missions', name: 'Missions', description: 'Supporting missionaries and outreach efforts' },
    { id: 'youth', name: 'Youth Ministry', description: 'Programs and activities for young people' },
    { id: 'children', name: 'Children\'s Ministry', description: 'Kids programs and Sunday school' },
    { id: 'outreach', name: 'Community Outreach', description: 'Local community service and support' }
  ],
  impact: {
    section_title: "Your Impact",
    section_heading: "See How Your Gifts Make a Difference",
    section_description: "Your faithful giving enables us to transform lives and serve our community in countless ways.",
    stats: [
      { label: "Families Served", value: "500+", description: "Through our food pantry and assistance programs" },
      { label: "Youth Impacted", value: "150+", description: "Participating in youth programs and activities" },
      { label: "Missionaries Supported", value: "12", description: "Local and international mission work" },
      { label: "Community Events", value: "25+", description: "Annual outreach and service events" }
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Attempting to fetch giving page from database...')
    
    const supabase = createServerSupabaseClient()

    // Fetch giving page content
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('id, slug, title, seo_meta, published_at, created_at, updated_at')
      .eq('slug', 'give')
      .not('published_at', 'is', null)
      .single()

    if (pageError || !pageData) {
      console.log('⚠️ GIVING SOURCE: DEFAULT (No giving page found in CMS)')
      return NextResponse.json({
        hero: defaultGivingPageContent.hero,
        fund_designations: defaultGivingPageContent.fund_designations,
        source: 'default',
        message: 'Using default giving page - No giving page found in CMS'
      })
    }

    // Fetch giving page sections
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('page_sections')
      .select('id, type, order, props')
      .eq('page_id', pageData.id)
      .order('order', { ascending: true })

    console.log('📊 Sections query result:', {
      pageId: pageData.id,
      sectionsFound: sectionsData?.length || 0,
      sectionsData: sectionsData,
      sectionsError: sectionsError
    })

    if (sectionsError) {
      console.error('❌ GIVING SOURCE: DEFAULT (Sections error):', sectionsError)
      return NextResponse.json({
        hero: defaultGivingPageContent.hero,
        fund_designations: defaultGivingPageContent.fund_designations,
        source: 'default',
        message: `Using default giving page - Sections error: ${sectionsError.message}`
      })
    }

    // Also fetch fund designations from payment categories
    const { data: fundData, error: fundError } = await supabase
      .from('payment_categories')
      .select('id, name, description, is_active')
      .eq('is_active', true)
      .order('order', { ascending: true })

    let fundDesignations = defaultGivingPageContent.fund_designations
    if (!fundError && fundData && fundData.length > 0) {
      fundDesignations = fundData.map(fund => ({
        id: fund.id,
        name: fund.name,
        description: fund.description || `Support our ${fund.name.toLowerCase()}`
      }))
    }

    if (!sectionsData || sectionsData.length === 0) {
      console.log('⚠️ GIVING SOURCE: DEFAULT (No sections found)')
      return NextResponse.json({
        hero: defaultGivingPageContent.hero,
        fund_designations: fundDesignations,
        source: 'default',
        message: 'Using default giving page - No sections found'
      })
    }

    // Transform sections data using buildGivingContent function
    const givingContent = buildGivingContent(sectionsData, fundDesignations)

    console.log('✅ GIVING SOURCE: DATABASE')
    console.log('Giving page sections found:', sectionsData?.length || 0)
    console.log('Fund designations found:', fundDesignations.length)

    return NextResponse.json({
      hero: givingContent.hero,
      fund_designations: givingContent.fund_designations,
      source: 'database',
      message: 'Giving page loaded from database'
    })

  } catch (error) {
    console.error('❌ Error in giving page API:', error)
    return NextResponse.json({
      hero: defaultGivingPageContent.hero,
      fund_designations: defaultGivingPageContent.fund_designations,
      source: 'error_fallback',
      message: `Using default giving page - API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}

function buildGivingContent(sections: any[], fundDesignations: any[]) {
  const content = {
    hero: { ...defaultGivingPageContent.hero },
    giving_methods: { ...defaultGivingPageContent.giving_methods },
    fund_designations: fundDesignations,
    impact: { ...defaultGivingPageContent.impact }
  }

  sections.forEach(section => {
    switch (section.type) {
      case 'hero':
        content.hero = {
          first_line_text: section.props?.first_line_text || section.props?.firstLine || defaultGivingPageContent.hero.first_line_text,
          heading: section.props?.heading || defaultGivingPageContent.hero.heading,
          subheading: section.props?.subheading || defaultGivingPageContent.hero.subheading,
          background_image: section.props?.backgroundImage || section.props?.background_image || defaultGivingPageContent.hero.background_image,
          cta_primary: section.props?.cta_primary || section.props?.ctaButtons?.primary || defaultGivingPageContent.hero.cta_primary,
          cta_secondary: section.props?.cta_secondary || section.props?.ctaButtons?.secondary || defaultGivingPageContent.hero.cta_secondary
        }
        break

      case 'giving_methods':
        content.giving_methods = {
          section_title: section.props?.section_title || defaultGivingPageContent.giving_methods.section_title,
          section_heading: section.props?.section_heading || defaultGivingPageContent.giving_methods.section_heading,
          section_description: section.props?.section_description || defaultGivingPageContent.giving_methods.section_description,
          methods: section.props?.methods || defaultGivingPageContent.giving_methods.methods
        }
        break

      case 'impact':
        content.impact = {
          section_title: section.props?.section_title || defaultGivingPageContent.impact.section_title,
          section_heading: section.props?.section_heading || defaultGivingPageContent.impact.section_heading,
          section_description: section.props?.section_description || defaultGivingPageContent.impact.section_description,
          stats: section.props?.stats || defaultGivingPageContent.impact.stats
        }
        break
    }
  })

  return content
} 