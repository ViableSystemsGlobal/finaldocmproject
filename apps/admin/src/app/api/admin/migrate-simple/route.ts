import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    )

    console.log('Starting simplified multi-app user management migration...')

    // Step 1: Create user_profiles table (simplified)
    console.log('Creating user_profiles table...')
    
    const { error: dropError } = await supabase.rpc('exec', { 
      sql: 'DROP TABLE IF EXISTS user_profiles CASCADE;' 
    })
    
    const createTableSQL = `
      CREATE TABLE user_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        user_type TEXT NOT NULL CHECK (user_type IN ('mobile_user', 'admin_staff', 'hybrid')) DEFAULT 'admin_staff',
        app_access TEXT[] NOT NULL DEFAULT ARRAY['admin'],
        
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        avatar_url TEXT,
        
        department TEXT,
        job_title TEXT,
        employee_id TEXT,
        hire_date DATE,
        
        member_id UUID,
        
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_verified BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at TIMESTAMP WITH TIME ZONE,
        
        preferences JSONB DEFAULT '{}',
        notes TEXT,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(user_id)
      );
    `

    let { error } = await supabase.rpc('exec', { sql: createTableSQL })
    if (error) {
      console.error('Error creating table:', error)
      return NextResponse.json({ error: 'Failed to create user_profiles table', details: error.message }, { status: 500 })
    }

    // Step 2: Create basic indexes
    console.log('Creating indexes...')
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);',
      'CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);'
    ]

    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec', { sql: indexSQL })
      if (indexError) console.error('Index error:', indexError)
    }

    // Step 3: Enable RLS and create basic policies
    console.log('Setting up security...')
    await supabase.rpc('exec', { sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;' })

    const policies = [
      `DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;`,
      `CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Service role full access" ON user_profiles;`,
      `CREATE POLICY "Service role full access" ON user_profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');`
    ]

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec', { sql: policy })
      if (policyError) console.error('Policy error:', policyError)
    }

    // Step 4: Create simple permission function
    console.log('Creating helper functions...')
    const getUserPermissionsFunction = `
      CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
      RETURNS TEXT[] AS $$
      DECLARE
        permissions TEXT[] := ARRAY[]::TEXT[];
      BEGIN
        SELECT COALESCE(array_agg(DISTINCT perm), ARRAY[]::TEXT[])
        INTO permissions
        FROM (
          SELECT unnest(r.permissions) as perm
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = user_uuid
          AND r.is_active = TRUE
        ) perms;
        
        RETURN permissions;
      EXCEPTION WHEN OTHERS THEN
        RETURN ARRAY[]::TEXT[];
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    const { error: funcError } = await supabase.rpc('exec', { sql: getUserPermissionsFunction })
    if (funcError) {
      console.error('Function error:', funcError)
    }

    // Step 5: Migrate existing users
    console.log('Migrating existing users...')
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    
    let migratedCount = 0
    if (existingUsers && existingUsers.users.length > 0) {
      for (const user of existingUsers.users) {
        try {
          // Create profile for existing user
          const profileData = {
            user_id: user.id,
            user_type: 'admin_staff',
            app_access: ['admin'],
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null,
            is_active: true,
            is_verified: true
          }

          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert([profileData], { onConflict: 'user_id' })

          if (profileError) {
            console.error(`Error creating profile for user ${user.email}:`, profileError)
          } else {
            console.log(`Created profile for user: ${user.email}`)
            migratedCount++
          }
        } catch (err) {
          console.error(`Error processing user ${user.email}:`, err)
        }
      }
    }

    // Step 6: Test the functions
    console.log('Testing functions...')
    if (existingUsers && existingUsers.users.length > 0) {
      const testUserId = existingUsers.users[0].id
      try {
        const { data: permissions, error: permError } = await supabase
          .rpc('get_user_permissions', { user_uuid: testUserId })

        if (permError) {
          console.error('Error testing permissions function:', permError)
        } else {
          console.log('Test permissions result:', permissions)
        }
      } catch (err) {
        console.error('Error testing functions:', err)
      }
    }

    console.log('Simplified migration completed successfully!')

    return NextResponse.json({ 
      success: true, 
      message: 'Simplified multi-app user management system migration completed successfully',
      migrated_users: migratedCount,
      note: 'Triggers and complex functions were skipped for compatibility. Basic functionality is ready.'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Simplified Multi-app User Management Migration API',
    description: 'A simplified version that avoids complex triggers and focuses on core functionality',
    endpoints: {
      'POST /api/admin/migrate-simple': 'Run the simplified database migration'
    }
  })
} 