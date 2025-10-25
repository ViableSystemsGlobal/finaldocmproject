import { getCurrentUserPermissions } from '@/lib/permissions'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const permissions = await getCurrentUserPermissions()
    
    return NextResponse.json({ 
      success: true,
      user: permissions.user?.email,
      userId: permissions.user?.id,
      roles: permissions.roles.map(r => ({ name: r.name, id: r.id })),
      permissionCount: permissions.permissions.length,
      permissions: permissions.permissions.sort(),
      department: permissions.department,
      hasDashboard: permissions.permissions.includes('dashboard:view'),
      hasReports: permissions.permissions.includes('reports:view:all')
    })

  } catch (error) {
    console.error('Error in check-user-perms:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 