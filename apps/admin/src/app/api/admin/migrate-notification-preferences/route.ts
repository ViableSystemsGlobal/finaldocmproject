import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting migration to add notification_preferences column...')

    // First, check if the column already exists
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns', { 
        table_name: 'mobile_app_users',
        schema_name: 'public'
      })

    if (columnsError) {
      console.log('⚠️ Could not check existing columns, proceeding with migration...')
    }

    // Add notification_preferences column if it doesn't exist
    const addColumnSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'mobile_app_users' 
          AND column_name = 'notification_preferences'
          AND table_schema = 'public'
        ) THEN
          ALTER TABLE public.mobile_app_users 
          ADD COLUMN notification_preferences JSONB DEFAULT '{
            "events": true,
            "sermons": true,
            "announcements": true,
            "prayers": true,
            "groups": true,
            "general": true,
            "quietHoursEnabled": true,
            "quietHoursStart": "22:00",
            "quietHoursEnd": "08:00"
          }'::jsonb;
          
          RAISE NOTICE 'Added notification_preferences column to mobile_app_users table';
        ELSE
          RAISE NOTICE 'notification_preferences column already exists';
        END IF;
      END $$;
    `

    const { error: addColumnError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: addColumnSQL 
    })

    if (addColumnError) {
      console.error('❌ Error adding notification_preferences column:', addColumnError)
      // Try alternative approach - direct column addition
      const { error: directError } = await supabaseAdmin
        .from('mobile_app_users')
        .select('notification_preferences')
        .limit(1)

      if (directError && directError.message.includes('column "notification_preferences" does not exist')) {
        // Column definitely doesn't exist, let's try a simpler approach
        console.log('🔧 Attempting direct column addition...')
        
        // We'll update the existing users to have the column via a different method
        // Since we can't run DDL directly, let's create a workaround
        return NextResponse.json({
          success: false,
          error: 'Cannot add column directly. Please run the SQL migration manually.',
          sql: addColumnSQL,
          message: 'The notification_preferences column needs to be added to the mobile_app_users table.'
        })
      }
    }

    // Add auth_user_id column if it doesn't exist
    const addAuthUserIdSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'mobile_app_users' 
          AND column_name = 'auth_user_id'
          AND table_schema = 'public'
        ) THEN
          ALTER TABLE public.mobile_app_users 
          ADD COLUMN auth_user_id TEXT;
          
          RAISE NOTICE 'Added auth_user_id column to mobile_app_users table';
        ELSE
          RAISE NOTICE 'auth_user_id column already exists';
        END IF;
      END $$;
    `

    const { error: addAuthUserIdError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: addAuthUserIdSQL 
    })

    if (addAuthUserIdError) {
      console.error('❌ Error adding auth_user_id column:', addAuthUserIdError)
    }

    // Update any existing records that might have NULL notification_preferences
    const { error: updateError } = await supabaseAdmin
      .from('mobile_app_users')
      .update({
        notification_preferences: {
          events: true,
          sermons: true,
          announcements: true,
          prayers: true,
          groups: true,
          general: true,
          quietHoursEnabled: true,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00"
        }
      })
      .is('notification_preferences', null)

    if (updateError) {
      console.error('❌ Error updating notification preferences:', updateError)
    }

    // Verify the migration worked
    const { data: testData, error: testError } = await supabaseAdmin
      .from('mobile_app_users')
      .select('id, notification_preferences, auth_user_id')
      .limit(1)

    if (testError) {
      console.error('❌ Error verifying migration:', testError)
      return NextResponse.json({
        success: false,
        error: testError.message,
        message: 'Migration may have failed - could not verify columns exist'
      })
    }

    console.log('✅ Migration completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      columnsAdded: ['notification_preferences', 'auth_user_id'],
      testData: testData
    })

  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Migration failed'
      },
      { status: 500 }
    )
  }
} 