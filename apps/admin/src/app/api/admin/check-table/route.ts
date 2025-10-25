import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try to select from user_profiles to see if it exists and what columns it has
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (testError) {
      return NextResponse.json({ 
        exists: false,
        error: testError,
        message: 'user_profiles table does not exist or has issues' 
      })
    }

    // If we can select, let's see the structure by trying to create a dummy record
    const { data: insertTest, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: 'test-id-' + Date.now(),
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'admin_staff',
        app_access: ['admin'],
        is_active: true
      })
      .select()

    // Delete the test record if it was created
    if (insertTest && insertTest.length > 0) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', insertTest[0].user_id)
    }

    return NextResponse.json({ 
      exists: true,
      insertError: insertError,
      testData: testData,
      message: 'Table structure test completed' 
    })

  } catch (error) {
    console.error('Error in check-table:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 