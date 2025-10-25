import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { includeVisitors = true, skipDuplicates = true } = body
    
    console.log('📧 Starting bulk import of contacts to newsletter')
    
    // Get all contacts with emails (or filter by type if specified)
    let query = supabaseAdmin
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
    
    // If not including visitors, filter to members only
    if (!includeVisitors) {
      query = query.or('lifecycle.eq.member,member_status.eq.member')
    }

    const { data: contacts, error: contactError } = await query

    if (contactError) {
      console.error('Error fetching contacts:', contactError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch contacts' 
      }, { status: 500 })
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        imported: 0,
        skipped: 0,
        message: 'No contacts with email addresses found'
      })
    }

    console.log(`📧 Found ${contacts.length} contacts with emails`)

    // Get existing newsletter subscribers to avoid duplicates
    let existingEmails = new Set()
    if (skipDuplicates) {
      const { data: existingSubscribers } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('email')
        .eq('status', 'active')

      existingEmails = new Set(existingSubscribers?.map(s => s.email.toLowerCase()) || [])
      console.log(`📧 Found ${existingEmails.size} existing subscribers`)
    }

    // Prepare subscribers for import with smart segmentation
    const subscribersToImport = []
    let skippedCount = 0

    for (const contact of contacts) {
      const email = contact.email.toLowerCase()
      
      if (skipDuplicates && existingEmails.has(email)) {
        skippedCount++
        continue
      }

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

      subscribersToImport.push({
        email: contact.email,
        first_name: contact.first_name,
        last_name: contact.last_name,
        status: 'active',
        segments,
        subscription_source: 'bulk_import',
        contact_id: contact.id,
        subscribed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
    }

    console.log(`📧 Importing ${subscribersToImport.length} new subscribers, skipping ${skippedCount} duplicates`)

    // Batch import subscribers
    let importedCount = 0
    if (subscribersToImport.length > 0) {
      const { data: imported, error: importError } = await supabaseAdmin
        .from('newsletter_subscribers')
        .insert(subscribersToImport)
        .select('id')

      if (importError) {
        console.error('Error importing subscribers:', importError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to import subscribers' 
        }, { status: 500 })
      }

      importedCount = imported?.length || 0
    }

    console.log(`📧 Successfully imported ${importedCount} subscribers`)

    return NextResponse.json({ 
      success: true, 
      imported: importedCount,
      skipped: skippedCount,
      total: contacts.length,
      message: `Imported ${importedCount} contacts as newsletter subscribers with smart segmentation${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`
    })

  } catch (error) {
    console.error('Error in contact import:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 