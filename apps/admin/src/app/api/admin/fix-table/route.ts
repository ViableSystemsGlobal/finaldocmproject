import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Add missing columns to user_profiles table
    const alterQueries = [
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'admin_staff';`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS app_access TEXT[] DEFAULT ARRAY['admin'];`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100);`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job_title VARCHAR(150);`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS member_id UUID;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address TEXT;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hire_date DATE;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notes TEXT;`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;`,
      `CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_key ON user_profiles(email);`,
      `CREATE INDEX IF NOT EXISTS user_profiles_user_type_idx ON user_profiles(user_type);`,
      `CREATE INDEX IF NOT EXISTS user_profiles_department_idx ON user_profiles(department);`
    ]

    const results = []
    
    for (const query of alterQueries) {
      try {
        const { data, error } = await supabase.rpc('exec', { sql: query })
        results.push({ query, success: !error, error })
        if (error) {
          console.error('Error executing query:', query, error)
        }
      } catch (err) {
        console.error('Exception executing query:', query, err)
        results.push({ query, success: false, error: err })
      }
    }

    return NextResponse.json({ 
      success: true,
      results,
      message: 'Table structure fix completed' 
    })

  } catch (error) {
    console.error('Error in fix-table:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 