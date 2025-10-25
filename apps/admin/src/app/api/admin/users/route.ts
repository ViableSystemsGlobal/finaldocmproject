import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { logUserCreate } from '@/lib/audit'

// Create service role client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type UserData = {
  user_id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  avatar_url: string
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching admin users...')
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Filter and return admin users (exclude obvious test accounts)
    const adminUsers: UserData[] = authUsers.users
      .filter(user => {
        // Only include users with email
        if (!user.email) {
          return false
        }
        
        // Exclude obvious test accounts
        if (user.email.includes('@example.com')) {
          return false
        }
        
        return true
      })
      .map(user => ({
        user_id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        phone: user.phone || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      }))
      .sort((a, b) => {
        // Sort by email for consistency
        return a.email.localeCompare(b.email)
      })

    console.log(`✅ Found ${adminUsers.length} users`)
    return NextResponse.json({ users: adminUsers })

  } catch (error) {
    console.error('💥 Error fetching users:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const { email, password, first_name, last_name, phone, department, role_ids, ...otherData } = userData;
    
    // Get request metadata for audit logging
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;

    console.log('🔍 Creating user with admin client...', { email, role_ids, department });
    
    // Prepare user metadata
    const userMetadata: any = {};
    if (first_name) userMetadata.first_name = first_name;
    if (last_name) userMetadata.last_name = last_name;
    if (department) userMetadata.department = department;
    
    // Prepare user creation payload
    const createUserPayload: any = {
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata
    };
    
    if (phone) createUserPayload.phone = phone;
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser(createUserPayload);
    
    if (error) {
      console.error('❌ Error creating user:', error);
      return NextResponse.json({ 
        message: 'Failed to create user', 
        code: 'USER_CREATE_ERROR',
        details: error.message 
      }, { status: 400 });
    }
    
    // Handle role assignments if provided
    if (role_ids && role_ids.length > 0 && data.user) {
      console.log('🔄 Assigning roles to new user...');
      
      const roleAssignments = role_ids.map((roleId: string) => ({
        user_id: data.user.id,
        role_id: roleId,
        assigned_at: new Date().toISOString()
      }));
      
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert(roleAssignments);
      
      if (roleError) {
        console.error('❌ Error assigning roles to new user:', roleError);
        // Continue anyway, user was created successfully
      }
    }

    // Log user creation with audit utility
    if (data.user) {
      await logUserCreate(
        data.user.id,
        {
          email: data.user.email,
          user_metadata: userMetadata,
          role_ids,
          department
        }
        // TODO: Get actual admin user ID from auth context
      );
    }

    console.log(`✅ Successfully created user: ${data.user?.email}`);
    return NextResponse.json(data.user);
    
  } catch (error) {
    console.error('💥 Unexpected error in POST /api/admin/users:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      code: 'INTERNAL_ERROR',
      details: 'An unexpected error occurred' 
    }, { status: 500 });
  }
} 