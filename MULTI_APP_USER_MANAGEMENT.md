# Multi-App User Management System

## Overview

This implementation provides a comprehensive multi-app user management system for the DOCM-CICS (Complete Integrated Church System) that handles:

- **Mobile App Users**: Church members who access the mobile application
- **Admin Staff**: Staff members who manage the admin system
- **Hybrid Users**: Users who have access to both mobile and admin systems

## Architecture

### 1. Database Schema

#### User Profiles Table (`user_profiles`)
Extended user information beyond Supabase Auth:

```sql
CREATE TABLE user_profiles (
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
  member_id UUID, -- Link to church member record
  
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
```

### 2. User Types

#### Mobile User (`mobile_user`)
- **Purpose**: Church members who use the mobile app
- **Access**: Mobile app only
- **Features**: 
  - Can be linked to member records
  - Basic profile information
  - Mobile app permissions

#### Admin Staff (`admin_staff`)
- **Purpose**: Staff members who manage the church admin system
- **Access**: Admin system only
- **Features**:
  - Department assignment
  - Job titles and employee IDs
  - Role-based permissions
  - Full admin system access

#### Hybrid User (`hybrid`)
- **Purpose**: Users who need both mobile and admin access
- **Access**: Both mobile app and admin system
- **Features**:
  - All mobile user features
  - All admin staff features
  - Seamless switching between apps

### 3. Enhanced Middleware

The middleware now includes:
- **User Type Checking**: Verifies if user has admin access
- **Profile Status Validation**: Checks if user profile is active
- **Enhanced Permission System**: Uses the new user profiles for permission checks

## Implementation Files

### Core Services

1. **`/services/user-management.ts`** - Multi-app user management functions
2. **`/middleware.ts`** - Enhanced middleware with user type checking
3. **`/lib/permissions.ts`** - Existing permission system (compatible)
4. **`/hooks/usePermissions.ts`** - Existing permission hooks (compatible)

### Database Scripts

1. **`/scripts/create-user-profiles-table.sql`** - Complete database migration
2. **`/scripts/run-migration.ts`** - Migration runner script
3. **`/api/admin/migrate/route.ts`** - API endpoint for running migration

### User Interface

1. **`/settings/users/page.tsx`** - Enhanced user management interface
2. **`/settings/migration/page.tsx`** - Migration interface
3. **`/components/auth/ProtectedRoute.tsx`** - Existing route protection (compatible)

## Getting Started

### Step 1: Run the Database Migration

Visit `/settings/migration` in your admin interface and click "Run Migration". This will:

1. Create the `user_profiles` table
2. Set up indexes and security policies
3. Create helper functions
4. Migrate existing users as admin staff
5. Test the new functions

Alternatively, use the API endpoint:
```bash
curl -X POST http://localhost:3000/api/admin/migrate
```

### Step 2: Verify Migration

After migration, check:
- All existing users should have profiles created
- User types should be set to `admin_staff`
- App access should be set to `['admin']`

### Step 3: Start Managing Users

Visit `/settings/users` to:
- View all users with their types and access levels
- Create new mobile users
- Create new admin staff
- Grant admin access to mobile users
- Manage user departments and roles

## Usage Examples

### Creating a Mobile User

```typescript
import { createMobileUser } from '@/services/user-management'

const result = await createMobileUser({
  email: 'member@church.com',
  password: 'secure_password',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  member_id: 'member-uuid' // Optional: link to existing member record
})

if (result.success) {
  console.log('Mobile user created:', result.data)
}
```

### Creating an Admin Staff Member

```typescript
import { createAdminUser } from '@/services/user-management'

const result = await createAdminUser({
  email: 'staff@church.com',
  password: 'secure_password',
  first_name: 'Jane',
  last_name: 'Smith',
  department: 'pastoral_care',
  job_title: 'Pastor',
  employee_id: 'EMP001',
  role_ids: ['pastor-role-id', 'admin-role-id']
})

if (result.success) {
  console.log('Admin user created:', result.data)
}
```

### Granting Admin Access to Mobile User

```typescript
import { grantAdminAccess } from '@/services/user-management'

const result = await grantAdminAccess('user-id', {
  department: 'youth_ministry',
  job_title: 'Youth Leader',
  employee_id: 'EMP002',
  role_ids: ['youth-leader-role-id']
})

if (result.success) {
  console.log('Admin access granted - user is now hybrid')
}
```

### Checking User Permissions (Server-side)

```typescript
import { getUserPermissions, checkUserHasPermission } from '@/services/user-management'

// Get all user permissions
const permissions = await getUserPermissions('user-id')
console.log('User permissions:', permissions)

// Check specific permission
const hasAccess = await checkUserHasPermission('user-id', 'contacts:view:all')
console.log('Has contacts access:', hasAccess)
```

## Security Features

### Row Level Security (RLS)

1. **Users can read their own profile**
2. **Users can update limited fields of their own profile**
3. **Service role has full access**
4. **Admin users can read/manage all profiles** (with proper permissions)

### Access Control

1. **Admin System Access**: Only users with `'admin'` in `app_access` array
2. **Profile Status**: Inactive users are blocked at middleware level
3. **Permission-based Routes**: Existing RBAC system works seamlessly
4. **User Type Validation**: Middleware validates user type and access level

## Database Functions

### Helper Functions Created

1. **`get_user_permissions(user_uuid)`** - Returns array of user permissions
2. **`user_has_permission(user_uuid, permission)`** - Checks single permission
3. **`user_has_any_permission(user_uuid, permissions[])`** - Checks multiple permissions

### Triggers

1. **`on_auth_user_created`** - Automatically creates user profile when auth user is created
2. **`on_auth_user_updated`** - Syncs profile data when auth user is updated
3. **`update_user_profiles_updated_at`** - Updates timestamp on profile changes

## Views

### Enhanced Users View

```sql
CREATE VIEW enhanced_users AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  up.user_type,
  up.app_access,
  up.first_name,
  up.last_name,
  up.display_name,
  get_user_permissions(u.id) as permissions
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id;
```

## Backward Compatibility

This implementation maintains full backward compatibility with:

- **Existing RBAC System**: All existing roles and permissions work unchanged
- **Existing Users**: Automatically migrated as admin staff
- **Permission Hooks**: `usePermissions` hook works without changes  
- **Route Protection**: `ProtectedRoute` component works without changes
- **Navigation Filtering**: Existing navigation logic works unchanged

## Migration Safety

- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Doesn't modify existing data
- **Rollback-friendly**: Can be reversed if needed
- **Incremental**: Can be deployed without downtime

## Monitoring and Maintenance

### Health Checks

1. **Profile Completeness**: Ensure all auth users have profiles
2. **Permission Consistency**: Verify permission assignments
3. **Access Validation**: Check user type and app access alignment

### Regular Maintenance

1. **Cleanup Inactive Users**: Remove or archive old accounts
2. **Permission Audits**: Review role assignments regularly
3. **Profile Updates**: Keep employee information current

## API Endpoints

### User Management APIs

- `POST /api/admin/users/mobile` - Create mobile user
- `POST /api/admin/users/admin` - Create admin user  
- `PUT /api/admin/users/:id/grant-admin` - Grant admin access
- `PUT /api/admin/users/:id/revoke-admin` - Revoke admin access
- `PUT /api/admin/users/:id/toggle-status` - Toggle user status

### Migration API

- `POST /api/admin/migrate` - Run database migration
- `GET /api/admin/migrate` - Get migration status

## Best Practices

### User Creation

1. **Mobile Users**: Create for church members who need app access
2. **Admin Staff**: Create for employees with system management needs
3. **Hybrid Users**: Grant admin access to mobile users when they join staff

### Department Management

1. **Consistent Naming**: Use predefined department values
2. **Color Coding**: Assign consistent colors for visual identification
3. **Hierarchical Structure**: Consider department hierarchies for large churches

### Permission Strategy

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Role-based Assignment**: Use roles rather than individual permissions
3. **Regular Review**: Audit permissions quarterly

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check database permissions and environment variables
2. **User Creation Errors**: Verify email uniqueness and password requirements
3. **Permission Denials**: Check user profile status and app access
4. **Middleware Loops**: Ensure user has valid permissions for accessible routes

### Debug Commands

```sql
-- Check user profile status
SELECT * FROM user_profiles WHERE user_id = 'user-uuid';

-- Check user permissions
SELECT get_user_permissions('user-uuid');

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

## Support and Contributing

For issues, questions, or contributions:

1. Check existing documentation
2. Review database logs for errors
3. Test with migration API endpoint
4. Verify environment variables are set correctly

## Future Enhancements

Potential future improvements:

1. **Audit Logging**: Track user management actions
2. **Bulk Operations**: Import/export user data
3. **Advanced Filtering**: Complex user queries
4. **Integration APIs**: Connect with external systems
5. **Mobile App APIs**: Direct mobile user management
6. **SSO Integration**: Single sign-on capabilities 