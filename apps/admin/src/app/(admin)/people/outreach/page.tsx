'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, RefreshCw, Heart, ArrowRight, CalendarClock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'

export default function OutreachPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Outreach</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Soul Winning Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5 text-primary" />
              Soul Winning
            </CardTitle>
            <CardDescription>
              Track salvation decisions and new contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Record and manage evangelism efforts, invitations, and salvation decisions.
              Track how people are coming to your church.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/people/outreach/soul-winning">
                Go to Soul Winning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Follow-Ups Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5 text-primary" />
              Follow-Ups
            </CardTitle>
            <CardDescription>
              Manage follow-up activities for contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create, assign, and track follow-up activities for visitors and members.
              Never let a contact fall through the cracks.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/people/outreach/follow-ups">
                Go to Follow-Ups
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Prayer Requests Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="mr-2 h-5 w-5 text-primary" />
              Prayer Requests
            </CardTitle>
            <CardDescription>
              Track and respond to prayer needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Record, assign, and follow up on prayer requests from your congregation
              and community. Track answers to prayer.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/people/outreach/prayer-requests">
                Go to Prayer Requests
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Planned Visits Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarClock className="mr-2 h-5 w-5 text-primary" />
              Planned Visits
            </CardTitle>
            <CardDescription>
              Manage visitors planning to attend events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track and manage people who are planning to visit your church events.
              Send messages, coordinate visits, and convert prospects to regular visitors.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/people/outreach/planned-visits">
                Go to Planned Visits
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Website Messages Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Website Messages
            </CardTitle>
            <CardDescription>
              Handle contact form inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage messages and inquiries received through your website contact forms.
              Respond to visitors and track communication.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/people/outreach/website-messages">
                Go to Website Messages
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 