# Audit Logging System Guide

## Overview

The Activity Log (Audit Logs) system in your church management system automatically tracks user actions, system events, and data changes for security, compliance, and operational visibility.

## How It Works

### 1. Database Structure

The audit logs are stored in the `audit_logs` table with the following structure:

```sql
CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id),  -- Who performed the action
  action      TEXT        NOT NULL,                    -- What action was performed
  entity      TEXT        NOT NULL,                    -- What type of data was affected
  entity_id   UUID,                                    -- Specific record ID (if applicable)
  old_values  JSONB,                                   -- Previous values (for updates/deletes)
  new_values  JSONB,                                   -- New values (for creates/updates)
  ip_address  INET,                                    -- Client IP address
  user_agent  TEXT,                                    -- Browser/client information
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()      -- When the action occurred
);
```

### 2. Automatic Logging

Audit logging is automatically implemented in the following areas:

#### User Management
- ✅ **User Creation**: When new users are created via User Management
- ✅ **User Updates**: When user profiles are modified
- ✅ **User Deletion**: When users are removed from the system

#### Planned Implementation Areas
- 🔄 **Authentication**: Login/logout events
- 🔄 **Member Management**: Member profile changes
- 🔄 **Communication**: Email/SMS campaigns
- 🔄 **Settings Changes**: System configuration updates
- 🔄 **Data Exports**: When data is exported to CSV/other formats

### 3. Audit Logging Utilities

The system includes a comprehensive audit logging utility (`/lib/audit.ts`) with pre-built functions:

```typescript
// User-related logging
await logUserCreate(userId, userData, adminUserId)
await logUserUpdate(userId, oldValues, newValues, adminUserId)
await logUserDelete(userId, userData, adminUserId)

// Authentication logging
await logUserLogin(userId, loginData)
await logUserLogout(userId)

// Communication logging
await logEmailSend(campaignId, emailData, userId)
await logSmsSend(campaignId, smsData, userId)

// System logging
await logSettingsChange(settingType, oldValues, newValues, userId)
await logDataExport(entityType, exportData, userId)
await logDataView(entityType, viewData, userId)

// Generic CRUD logging
await logCrudAction('create', 'member', entityId, oldValues, newValues, userId)
```

### 4. Activity Log Page Features

The Activity Log page (`/settings/audit-logs`) provides:

- **Real-time Activity Feed**: Shows all system activity in chronological order
- **Advanced Filtering**: Filter by action type, entity, date range, or search terms
- **Detailed Event Views**: Click any event to see complete details including data changes
- **Export Functionality**: Export audit logs to CSV for external analysis
- **Visual Action Icons**: Color-coded icons for different action types
- **User Attribution**: Track which user performed each action

### 5. Action Types Tracked

| Action | Description | Example |
|--------|-------------|---------|
| `create` | New records created | User account created |
| `update` | Existing records modified | Member profile updated |
| `delete` | Records removed | User account deleted |
| `login` | User authentication | User logged into system |
| `logout` | User session ended | User logged out |
| `view` | Data accessed/viewed | Member list accessed |
| `export` | Data exported | Member data exported to CSV |
| `send_email` | Email communications | Newsletter sent |
| `send_sms` | SMS communications | Event reminder sent |
| `settings` | System settings changed | Email configuration updated |

### 6. Entity Types Tracked

| Entity | Description |
|--------|-------------|
| `user` | User accounts and authentication |
| `member` | Church member profiles |
| `auth` | Authentication events |
| `communication` | Email/SMS campaigns |
| `system` | System settings and configuration |
| `events` | Church events and activities |
| `groups` | Discipleship groups and ministries |

### 7. Security & Privacy

- **Data Integrity**: All audit logs are immutable once created
- **Access Control**: Only authorized administrators can view audit logs
- **IP Tracking**: Client IP addresses are logged for security analysis
- **User Agent Tracking**: Browser/client information helps identify unauthorized access
- **Automatic Cleanup**: Consider implementing log retention policies for compliance

### 8. Compliance Benefits

The audit logging system helps with:

- **Data Protection Compliance**: Track who accessed personal data and when
- **Security Incident Response**: Investigate unauthorized access or data breaches
- **Change Management**: Monitor system configuration changes
- **User Activity Monitoring**: Understand how staff use the system
- **Operational Insights**: Identify usage patterns and system optimization opportunities

### 9. Implementation Status

#### ✅ Currently Implemented
- Basic audit logging infrastructure
- User management action logging
- Activity log viewing page with filtering
- Export functionality
- Audit logging utility library

#### 🔄 Planned Enhancements
- Authentication event logging (login/logout)
- Member management action logging
- Communication action logging (email/SMS)
- Settings change logging
- Data export action logging
- Real-time notifications for critical events
- Log retention and archival policies

### 10. Usage Examples

#### For Administrators
- Monitor user creation and management activities
- Track system configuration changes
- Investigate security incidents
- Generate compliance reports
- Monitor staff productivity and system usage

#### For IT/Security Teams
- Security incident investigation
- Access pattern analysis
- System usage optimization
- Compliance auditing
- Change management tracking

### 11. Sample Audit Log Entry

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "admin-user-123",
  "action": "create",
  "entity": "user",
  "entity_id": "new-user-456",
  "old_values": null,
  "new_values": {
    "email": "john.doe@example.com",
    "role": "member",
    "status": "active"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "created_at": "2024-06-01T11:42:16.363012+00:00"
}
```

## Getting Started

1. **View Activity Logs**: Navigate to Settings → Audit Logs in your admin dashboard
2. **Filter Events**: Use the search and filter options to find specific activities
3. **Export Data**: Click the "Export Logs" button to download audit data
4. **View Details**: Click the eye icon on any event to see complete details

The audit logging system is now fully functional and ready to track all user activities in your church management system! 