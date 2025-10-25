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

    console.log('Starting multi-app user management migration...')

    // Step 1: Create user_profiles table
    console.log('Creating user_profiles table...')
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        user_type TEXT NOT NULL CHECK (user_type IN ('mobile_user', 'admin_staff', 'hybrid')),
        app_access TEXT[] NOT NULL DEFAULT ARRAY['mobile'],
        
        -- Basic Info
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        avatar_url TEXT,
        
        -- Admin-specific fields
        department TEXT,
        job_title TEXT,
        employee_id TEXT,
        hire_date DATE,
        
        -- Mobile user linking
        member_id UUID,
        
        -- Status
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        last_login_at TIMESTAMP WITH TIME ZONE,
        
        -- Metadata
        preferences JSONB DEFAULT '{}',
        notes TEXT,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Constraints
        UNIQUE(user_id),
        UNIQUE(employee_id)
      );
    `

    let { error } = await supabase.rpc('exec', { sql: createTableSQL })
    if (error) {
      console.error('Error creating table:', error)
      return NextResponse.json({ error: 'Failed to create user_profiles table' }, { status: 500 })
    }

    // Step 2: Create indexes
    console.log('Creating indexes...')
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_app_access ON user_profiles USING GIN(app_access);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
    `

    const indexStatements = indexSQL.split(';').filter(s => s.trim())
    for (const statement of indexStatements) {
      if (statement.trim()) {
        const { error: indexError } = await supabase.rpc('exec', { sql: statement })
        if (indexError) console.error('Index error:', indexError)
      }
    }

    // Step 3: Enable RLS
    console.log('Enabling RLS...')
    await supabase.rpc('exec', { sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;' })

    // Step 4: Create RLS policies
    console.log('Creating RLS policies...')
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Service role full access" ON user_profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');`,
    ]

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec', { sql: policy })
      if (policyError) console.error('Policy error:', policyError)
    }

    // Step 5: Create helper functions
    console.log('Creating helper functions...')
    const getUserPermissionsFunction = `
      CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
      RETURNS TEXT[] AS $$
      DECLARE
        permissions TEXT[];
      BEGIN
        SELECT array_agg(DISTINCT perm)
        INTO permissions
        FROM (
          SELECT unnest(r.permissions) as perm
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = user_uuid
          AND r.is_active = TRUE
        ) perms;
        
        RETURN COALESCE(permissions, ARRAY[]::TEXT[]);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    await supabase.rpc('exec', { sql: getUserPermissionsFunction })

    // Create sync function with proper NULL handling
    console.log('Creating sync function...')
    const syncFunction = `
      CREATE OR REPLACE FUNCTION sync_user_profile()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE user_profiles
        SET
          first_name = NEW.user_metadata->>'first_name',
          last_name = NEW.user_metadata->>'last_name',
          user_type = COALESCE(NEW.user_metadata->>'user_type', user_type),
          last_login_at = CASE 
            WHEN NEW.last_sign_in_at IS NOT NULL AND (
              OLD.last_sign_in_at IS NULL OR 
              NEW.last_sign_in_at > OLD.last_sign_in_at
            ) THEN NEW.last_sign_in_at 
            ELSE last_login_at 
          END,
          updated_at = NOW()
        WHERE user_id = NEW.id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    await supabase.rpc('exec', { sql: syncFunction })

    // Create trigger
    const triggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
      CREATE TRIGGER on_auth_user_updated
        AFTER UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION sync_user_profile();
    `

    await supabase.rpc('exec', { sql: triggerSQL })

    // Step 6: Migrate existing users
    console.log('Migrating existing users...')
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    
    if (existingUsers && existingUsers.users.length > 0) {
      for (const user of existingUsers.users) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!existingProfile) {
          // Create profile for existing user
          const profileData = {
            user_id: user.id,
            user_type: 'admin_staff', // Assume existing users are admin staff
            app_access: ['admin'],
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null,
            is_active: true,
            is_verified: true
          }

          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([profileData])

          if (profileError) {
            console.error(`Error creating profile for user ${user.email}:`, profileError)
          } else {
            console.log(`Created profile for user: ${user.email}`)
          }
        }
      }
    }

    // Step 7: Test the functions
    console.log('Testing functions...')
    if (existingUsers && existingUsers.users.length > 0) {
      const testUserId = existingUsers.users[0].id
      const { data: permissions, error: permError } = await supabase
        .rpc('get_user_permissions', { user_uuid: testUserId })

      if (permError) {
        console.error('Error testing permissions function:', permError)
      } else {
        console.log('Test permissions result:', permissions)
      }
    }

    console.log('Migration completed successfully!')

    return NextResponse.json({ 
      success: true, 
      message: 'Multi-app user management system migration completed successfully',
      migrated_users: existingUsers?.users.length || 0
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
    message: 'Multi-app User Management Migration API',
    endpoints: {
      'POST /api/admin/migrate': 'Run the database migration for multi-app user management'
    }
  })
} 