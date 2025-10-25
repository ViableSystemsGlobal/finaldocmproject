import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create service role client  
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, backup any existing data
    const { data: existingData, error: selectError } = await supabase
      .from('user_profiles')
      .select('*')

    console.log('Existing data:', existingData)

    // Create a simplified fix - just insert the admin user directly if table exists
    // First try to create the admin user profile
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({ error: 'Failed to fetch users', details: authError }, { status: 500 })
    }

    const adminUser = authUsers.users.find(u => u.email === 'admin@docmchurch.org')
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Try inserting with minimal columns that should exist
    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: adminUser.id,
        user_type: 'admin_staff',
        app_access: ['admin'],
        is_active: true
      })
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create profile', details: insertError }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      existingData: existingData || [],
      newProfile: newProfile,
      message: 'Admin profile created successfully' 
    })

  } catch (error) {
    console.error('Error in fix-table-direct:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 