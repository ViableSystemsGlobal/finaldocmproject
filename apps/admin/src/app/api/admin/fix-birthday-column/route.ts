import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Adding date_of_birth column to contacts table...')

    // First, let's check if the column exists
    const { data: columns, error: columnError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'contacts' 
          AND column_name = 'date_of_birth'
          AND table_schema = 'public'
        `
      })

    if (columnError) {
      console.error('❌ Error checking column:', columnError)
      return NextResponse.json({ error: 'Failed to check column existence' }, { status: 500 })
    }

    let columnExists = false
    if (columns && Array.isArray(columns) && columns.length > 0) {
      columnExists = true
    }

    if (!columnExists) {
      console.log('🔄 Adding date_of_birth column...')
      
      // Add the column
      const { data, error } = await supabase
        .rpc('exec_sql', {
          sql: `
            ALTER TABLE public.contacts ADD COLUMN date_of_birth DATE;
            ALTER TABLE public.contacts ADD COLUMN location TEXT;
            ALTER TABLE public.contacts ADD COLUMN occupation TEXT;
            
            CREATE INDEX IF NOT EXISTS idx_contacts_date_of_birth ON public.contacts(date_of_birth);
            CREATE INDEX IF NOT EXISTS idx_contacts_location ON public.contacts(location);
            CREATE INDEX IF NOT EXISTS idx_contacts_occupation ON public.contacts(occupation);
          `
        })

      if (error) {
        console.error('❌ Error adding columns:', error)
        return NextResponse.json({ error: 'Failed to add columns', details: error }, { status: 500 })
      }
      
      console.log('✅ Columns added successfully!')
    } else {
      console.log('✅ date_of_birth column already exists')
    }

    // Test the birthday functionality
    console.log('🧪 Testing birthday functionality...')
    const { data: testData, error: testError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, date_of_birth')
      .not('date_of_birth', 'is', null)
      .limit(5)

    if (testError) {
      console.error('❌ Test failed:', testError)
    } else {
      console.log('✅ Test passed! Found contacts with birthdays:', testData?.length || 0)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Birthday column setup completed successfully!',
      columnExists: columnExists,
      contactsWithBirthdays: testData?.length || 0
    })

  } catch (err: any) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error', details: err.message }, { status: 500 })
  }
} 