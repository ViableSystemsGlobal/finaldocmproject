import { Metadata } from 'next'
import { SermonsHero } from '@/components/sections/sermons-hero'
import { LatestSermons } from '@/components/sections/latest-sermons'

export const metadata: Metadata = {
  title: 'Sermons - DOCM Church',
  description: 'Listen to inspiring sermons and biblical teachings from Demonstration of Christ Ministries. Explore our collection of messages that encourage spiritual growth and faith.',
  openGraph: {
    title: 'Sermons - DOCM Church',
    description: 'Listen to inspiring sermons and biblical teachings from Demonstration of Christ Ministries.',
    type: 'website',
  },
}

export default function SermonsPage() {
  return (
    <>
      {/* Sermons Hero Section */}
      <SermonsHero />
      
      {/* Latest Sermons */}
      <LatestSermons />
    </>
  )
} 