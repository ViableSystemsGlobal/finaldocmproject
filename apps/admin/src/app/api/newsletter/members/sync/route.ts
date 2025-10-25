import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      syncDirection = 'member_to_newsletter',
      autoSegments = ['Members'],
      dryRun = false 
    } = body
    
    console.log('🔄 Starting member-newsletter sync:', { syncDirection, dryRun })
    
    if (syncDirection === 'member_to_newsletter') {
      // Sync all contacts with emails to newsletter subscribers
      
      // Get all contacts that have emails but are not newsletter subscribers
      const { data: unsynced, error: unsyncedError } = await supabaseAdmin
        .from('contacts')
        .select(`
          id, 
          first_name, 
          last_name, 
          email, 
          lifecycle,
          member_status,
          created_at
        `)
        .not('email', 'is', null)
        .neq('email', '')

      if (unsyncedError) {
        console.error('Error fetching unsynced contacts:', unsyncedError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch unsynced contacts' 
        }, { status: 500 })
      }

      if (!unsynced || unsynced.length === 0) {
        return NextResponse.json({ 
          success: true, 
          synced: 0,
          message: 'No contacts to sync'
        })
      }

      // Filter out contacts who are already newsletter subscribers
      const contactEmails = unsynced.map(c => c.email.toLowerCase())
      const { data: existingSubscribers } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('email')
        .in('email', contactEmails)

      const existingEmailSet = new Set(existingSubscribers?.map(s => s.email.toLowerCase()) || [])
      
      const contactsToSync = unsynced.filter(contact => 
        !existingEmailSet.has(contact.email.toLowerCase())
      )

      console.log(`🔄 Found ${contactsToSync.length} contacts to sync to newsletter`)

      if (dryRun) {
        return NextResponse.json({ 
          success: true, 
          dryRun: true,
          wouldSync: contactsToSync.length,
          members: contactsToSync.map(c => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`,
            email: c.email,
            status: c.lifecycle || c.member_status || 'visitor'
          }))
        })
      }

      // Create newsletter subscribers for unsynced contacts with smart segmentation
      let syncedCount = 0
      if (contactsToSync.length > 0) {
        const subscribersToCreate = contactsToSync.map(contact => {
          // Smart segmentation based on contact status
          let segments = []
          const lifecycle = contact.lifecycle || ''
          const memberStatus = contact.member_status || ''
          
          if (lifecycle === 'member' || memberStatus === 'member') {
            segments = ['Members']
          } else if (lifecycle === 'visitor' || memberStatus === 'visitor') {
            segments = ['Visitors']
          } else if (lifecycle === 'lead') {
            segments = ['Visitors', 'Leads']
          } else {
            segments = ['General']
          }

          return {
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name,
            status: 'active',
            segments: segments,
            subscription_source: 'auto_sync',
            contact_id: contact.id,
            subscribed_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        })

        const { data: synced, error: syncError } = await supabaseAdmin
          .from('newsletter_subscribers')
          .insert(subscribersToCreate)
          .select('id')

        if (syncError) {
          console.error('Error syncing contacts:', syncError)
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to sync contacts' 
          }, { status: 500 })
        }

        syncedCount = synced?.length || 0
      }

      console.log(`🔄 Successfully synced ${syncedCount} contacts to newsletter`)

      return NextResponse.json({ 
        success: true, 
        synced: syncedCount,
        message: `Synced ${syncedCount} new contacts to newsletter with smart segmentation`
      })

    } else if (syncDirection === 'newsletter_to_member') {
      // Sync newsletter subscribers back to member status (future feature)
      return NextResponse.json({ 
        success: false, 
        error: 'Newsletter to member sync not implemented yet' 
      }, { status: 501 })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid sync direction' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error in member sync:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 