import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { headers } from 'next/headers';
import { logUserUpdate, logUserDelete } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const updateData = await request.json();
    
    // Get request metadata for audit logging
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;
    
    console.log('🔍 Updating user with admin client...', { userId, updateData });
    
    // Get current user data for audit log
    const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    // Separate role_ids from auth update data
    const { role_ids, department, ...authUpdateData } = updateData;
    
    // Prepare user metadata update
    const userMetadataUpdate: any = {};
    if (authUpdateData.first_name !== undefined) userMetadataUpdate.first_name = authUpdateData.first_name;
    if (authUpdateData.last_name !== undefined) userMetadataUpdate.last_name = authUpdateData.last_name;
    if (department !== undefined) userMetadataUpdate.department = department;
    
    // Prepare the auth update payload
    const authUpdate: any = {};
    if (authUpdateData.email) authUpdate.email = authUpdateData.email;
    if (authUpdateData.password) authUpdate.password = authUpdateData.password;
    if (authUpdateData.phone !== undefined) authUpdate.phone = authUpdateData.phone;
    if (Object.keys(userMetadataUpdate).length > 0) {
      authUpdate.user_metadata = userMetadataUpdate;
    }
    
    // Update user auth data
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdate);
    
    if (error) {
      console.error('❌ Error updating user auth data:', error);
      return NextResponse.json(
        { 
          message: 'Failed to update user', 
          code: 'USER_UPDATE_ERROR',
          details: error.message 
        },
        { status: 400 }
      );
    }
    
    // Handle role assignments if provided
    if (role_ids !== undefined) {
      console.log('🔄 Updating user role assignments...');
      
      // First, remove all existing role assignments for this user
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('❌ Error removing existing roles:', deleteError);
        // Continue anyway, don't fail the entire update
      }
      
      // Add new role assignments
      if (role_ids.length > 0) {
        const roleAssignments = role_ids.map((roleId: string) => ({
          user_id: userId,
          role_id: roleId,
          assigned_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabaseAdmin
          .from('user_roles')
          .insert(roleAssignments);
        
        if (insertError) {
          console.error('❌ Error assigning new roles:', insertError);
          // Continue anyway, user auth data was updated successfully
        }
      }
    }

    // Log user update with audit utility
    if (currentUser?.user && data.user) {
      await logUserUpdate(
        userId,
        {
          email: currentUser.user.email,
          user_metadata: currentUser.user.user_metadata
        },
        {
          email: data.user.email,
          user_metadata: data.user.user_metadata,
          ...updateData
        }
        // TODO: Get actual admin user ID from auth context
      );
    }

    console.log(`✅ Successfully updated user: ${userId}`);
    return NextResponse.json(data.user);
    
  } catch (error) {
    console.error('💥 Unexpected error in PUT /api/admin/users/[id]:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        details: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Get request metadata for audit logging
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;
    
    console.log('🔍 Deleting user with admin client...');
    
    // Get current user data for audit log
    const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('❌ Error deleting user:', error);
      return NextResponse.json(
        { 
          message: 'Failed to delete user', 
          code: 'USER_DELETE_ERROR',
          details: error.message 
        },
        { status: 400 }
      );
    }

    // Log user deletion with audit utility
    if (currentUser?.user) {
      await logUserDelete(
        userId,
        {
          email: currentUser.user.email,
          user_metadata: currentUser.user.user_metadata
        }
        // TODO: Get actual admin user ID from auth context
      );
    }

    console.log(`✅ Successfully deleted user: ${userId}`);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('💥 Unexpected error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        details: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 