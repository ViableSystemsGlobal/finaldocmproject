'use client'

import { usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface CommsLayoutProps {
  children: React.ReactNode
}

export default function CommsLayout({ children }: CommsLayoutProps) {
  const pathname = usePathname()
  
  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname.includes('/comms/templates')) return 'templates'
    if (pathname.includes('/comms/campaigns')) return 'campaigns'
    if (pathname.includes('/comms/reports')) return 'reports'
    return 'templates' // Default
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Communications</h2>
        <p className="text-muted-foreground">
          Manage your email, SMS, WhatsApp and push notification communications
        </p>
      </div>
      <Tabs defaultValue={getActiveTab()} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" asChild>
            <Link href="/comms/templates">Templates</Link>
          </TabsTrigger>
          <TabsTrigger value="campaigns" asChild>
            <Link href="/comms/campaigns">Campaigns</Link>
          </TabsTrigger>
          <TabsTrigger value="reports" asChild>
            <Link href="/comms/reports">Reports</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="space-y-4">
          {children}
        </TabsContent>
        <TabsContent value="campaigns" className="space-y-4">
          {children}
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  )
} 