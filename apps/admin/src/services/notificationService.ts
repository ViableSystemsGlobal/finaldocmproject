import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/services/emailService'

/**
 * Unified Notification Service
 * Handles email and push notifications for various church management events
 */

export interface NotificationPayload {
  type: 'follow_up_assigned' | 'prayer_assigned' | 'follow_up_due' | 'event_reminder' | 'prayer_request' | 'member_joined' | 'visitor_first_time' | 'group_leader_assigned'
  recipientUserId: string
  title: string
  message: string
  emailSubject?: string
  emailBody?: string
  data?: Record<string, any>
  urgency?: 'low' | 'normal' | 'high' | 'critical'
}

export interface NotificationResult {
  success: boolean
  emailSent?: boolean
  pushSent?: boolean
  error?: string
}

/**
 * Check if notifications should be sent based on user preferences and global settings
 */
async function shouldSendNotification(
  notificationType: string, 
  method: 'email' | 'push' | 'sms' | 'in_app',
  recipientUserId: string
): Promise<boolean> {
  try {
    console.log(`🔍 Checking if ${method} notification should be sent for ${notificationType} to user ${recipientUserId}`)
    
    // Check global settings first
    const { data: globalSettings, error: globalError } = await supabase
      .from('notification_settings')
      .select('email_enabled, push_enabled, sms_enabled, in_app_enabled')
      .single()

    if (globalError) {
      console.warn('Global notification settings table not found or empty, defaulting to allow:', globalError.message)
      // If the table doesn't exist, default to allowing notifications
      return true
    }

    if (!globalSettings) {
      console.log('No global settings found, defaulting to allow')
      return true
    }

    // Check if the specific method is enabled
    const methodEnabled = method === 'email' ? globalSettings.email_enabled :
                         method === 'push' ? globalSettings.push_enabled :
                         method === 'sms' ? globalSettings.sms_enabled :
                         method === 'in_app' ? globalSettings.in_app_enabled : false

    if (!methodEnabled) {
      console.log(`${method} notifications globally disabled`)
      return false
    }

    // Check notification type settings
    const { data: typeSettings, error: typeError } = await supabase
      .from('notification_type_settings')
      .select('enabled, roles')
      .eq('notification_type_id', notificationType)
      .eq('method', method)
      .single()

    if (typeError) {
      console.warn('Notification type settings table not found or empty, defaulting to allow:', typeError.message)
      // If the table doesn't exist, default to allowing notifications
      return true
    }

    if (!typeSettings || !typeSettings.enabled) {
      console.log(`${notificationType} ${method} notifications disabled`)
      return false
    }

    // Get user role/permissions to check if they should receive this notification
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', recipientUserId)
      .single()

    if (userError) {
      console.warn('User profiles table not found or user profile not found, defaulting to allow:', userError.message)
      // If the table doesn't exist or user not found, default to allowing notifications
      return true
    }

    const userRole = userProfile?.role || 'member'
    const allowedRoles = typeSettings.roles || []
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      console.log(`${userRole} not allowed for ${notificationType} ${method} notifications (allowed roles: ${allowedRoles.join(', ')})`)
      return false
    }

    // Check individual user preferences (if they exist)
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('enabled')
      .eq('user_id', recipientUserId)
      .eq('notification_type_id', notificationType)
      .eq('method', method)
      .single()

    if (prefsError) {
      console.warn('User notification preferences table not found or no preferences set, defaulting to allow:', prefsError.message)
      // If the table doesn't exist or user has no preferences, default to allowing notifications
      return true
    }

    if (userPrefs && !userPrefs.enabled) {
      console.log(`User has disabled ${notificationType} ${method} notifications`)
      return false
    }

    console.log(`✅ ${notificationType} ${method} notification allowed for user ${recipientUserId}`)
    return true
  } catch (error) {
    console.error('Error checking notification settings:', error)
    // Default to allow if there's an error checking settings
    console.log('Defaulting to allow notifications due to error')
    return true
  }
}

/**
 * Get user email and basic info
 */
async function getUserInfo(userId: string): Promise<{ email: string; name?: string } | null> {
  try {
    // Try to get from users view first (auth.users)
    const { data: authUser } = await supabase
      .from('users')
      .select('email, raw_user_meta_data')
      .eq('id', userId)
      .single()

    if (authUser?.email) {
      const name = authUser.raw_user_meta_data?.name || 
                  authUser.raw_user_meta_data?.full_name || 
                  authUser.email

      return {
        email: authUser.email,
        name: name
      }
    }

    // Fallback to user_profiles if available
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('user_id', userId)
      .single()

    if (userProfile?.email) {
      const name = userProfile.first_name && userProfile.last_name 
        ? `${userProfile.first_name} ${userProfile.last_name}`
        : userProfile.first_name || userProfile.email

      return {
        email: userProfile.email,
        name: name
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user info:', error)
    return null
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  recipientEmail: string,
  subject: string,
  body: string,
  notificationType: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Attempting to send email to:', recipientEmail)
    console.log('📧 Email subject:', subject)
    
    // Check if sendEmail function is available
    if (typeof sendEmail !== 'function') {
      console.error('❌ sendEmail function is not available')
      return {
        success: false,
        error: 'Email service not available'
      }
    }

    const result = await sendEmail(recipientEmail, {
      subject,
      body,
      plainText: body.replace(/<[^>]*>/g, '') // Strip HTML for plain text
    }, {
      emailType: 'system',
      metadata: {
        notification_type: notificationType,
        ...data
      }
    })

    console.log('📧 Email result:', result)
    return result
  } catch (error) {
    console.error('❌ Error sending email notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    }
  }
}

/**
 * Send push notification
 */
async function sendPushNotification(
  recipientUserId: string,
  title: string,
  body: string,
  notificationType: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003';
    const response = await fetch(`${baseUrl}/api/notifications/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: [recipientUserId],
        title,
        body,
        type: notificationType,
        data
      })
    })

    const result = await response.json()
    
    if (result.success) {
      return { success: true }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown push notification error'
    }
  }
}

/**
 * Main function to send notifications
 */
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const {
    type,
    recipientUserId,
    title,
    message,
    emailSubject,
    emailBody,
    data = {},
    urgency = 'normal'
  } = payload

  console.log(`📢 Sending ${type} notification to user ${recipientUserId}`)

  let emailSent = false
  let pushSent = false
  let errors: string[] = []

  // Get recipient information
  const userInfo = await getUserInfo(recipientUserId)
  if (!userInfo) {
    console.error(`❌ User not found: ${recipientUserId}`)
    return {
      success: false,
      error: 'Recipient user not found or has no email'
    }
  }

  console.log(`👤 Found user: ${userInfo.email} (${userInfo.name})`)

  // Check if we should send email notification
  const shouldSendEmail = await shouldSendNotification(type, 'email', recipientUserId)
  if (shouldSendEmail && userInfo.email) {
    console.log('📧 Sending email notification...')
    const emailResult = await sendEmailNotification(
      userInfo.email,
      emailSubject || title,
      emailBody || message,
      type,
      { ...data, recipient_user_id: recipientUserId }
    )

    if (emailResult.success) {
      emailSent = true
      console.log('✅ Email notification sent successfully')
    } else {
      errors.push(`Email: ${emailResult.error}`)
      console.error('❌ Email notification failed:', emailResult.error)
    }
  }

  // Check if we should send push notification
  const shouldSendPush = await shouldSendNotification(type, 'push', recipientUserId)
  if (shouldSendPush) {
    console.log('📱 Sending push notification...')
    const pushResult = await sendPushNotification(
      recipientUserId,
      title,
      message,
      type,
      { ...data, recipient_user_id: recipientUserId }
    )

    if (pushResult.success) {
      pushSent = true
      console.log('✅ Push notification sent successfully')
    } else {
      errors.push(`Push: ${pushResult.error}`)
      console.error('❌ Push notification failed:', pushResult.error)
    }
  }

  // Log the notification to database
  try {
    await supabase
      .from('notification_logs')
      .insert({
        user_id: recipientUserId,
        type,
        title,
        body: message,
        data: { ...data, email_sent: emailSent, push_sent: pushSent },
        sent_at: new Date().toISOString(),
        status: (emailSent || pushSent) ? 'sent' : 'failed'
      })
  } catch (logError) {
    console.warn('⚠️ Failed to log notification:', logError)
    // Don't fail the notification if logging fails
  }

  const success = emailSent || pushSent
  
  console.log(`📊 Notification summary: ${success ? 'Success' : 'Failed'} - Email: ${emailSent}, Push: ${pushSent}`)
  
  return {
    success,
    emailSent,
    pushSent,
    error: errors.length > 0 ? errors.join(', ') : success ? undefined : 'No notifications were sent'
  }
}

/**
 * Convenience function for follow-up assignment notifications
 */
export async function sendFollowUpAssignmentNotification(
  assignedUserId: string,
  followUpData: {
    id: string
    contactName: string
    type: string
    dueDate: string
    notes?: string
  },
  assignedByUserName?: string
): Promise<NotificationResult> {
  const contactName = followUpData.contactName
  const title = `Follow-up Assignment: ${contactName}`
  const message = `You've been assigned to follow up with ${contactName} (${followUpData.type})`
  
  // Get church settings for email template
  const { data: churchSettings } = await supabase
    .from('tenant_settings')
    .select('name, phone, email')
    .single()

  const churchName = churchSettings?.name || 'Our Church'
  
  const emailSubject = title
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
          <h1 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: 600;">
            📋 Follow-up Assignment
          </h1>
          <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 16px;">
            ${churchName}
          </p>
        </div>

        <!-- Assignment Details -->
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">
            You've been assigned a follow-up task
          </h3>
          <p style="color: #78350f; margin: 0; font-size: 14px;">
            ${assignedByUserName ? `Assigned by: ${assignedByUserName}` : 'This follow-up has been assigned to you'}
          </p>
        </div>

        <!-- Follow-up Details -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
            Follow-up Details:
          </h3>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Contact:</strong>
            <span style="color: #6b7280; margin-left: 8px;">${contactName}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Type:</strong>
            <span style="color: #6b7280; margin-left: 8px; text-transform: capitalize;">${followUpData.type}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Due Date:</strong>
            <span style="color: #6b7280; margin-left: 8px;">${new Date(followUpData.dueDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          
          ${followUpData.notes ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Notes:</strong>
              <p style="color: #6b7280; margin: 5px 0 0 0; line-height: 1.6; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #3b82f6;">${followUpData.notes}</p>
            </div>
          ` : ''}
        </div>
        
        <!-- Call to Action -->
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
          <p style="color: #1e3a8a; line-height: 1.6; margin: 0;">
            Please follow up with <strong>${contactName}</strong> regarding this ${followUpData.type} follow-up. 
            You can access the full details and update the status in your admin dashboard.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            If you have any questions about this follow-up, please contact the church office.
          </p>
          ${churchSettings?.email ? `
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">
              📧 ${churchSettings.email}
            </p>
          ` : ''}
          ${churchSettings?.phone ? `
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">
              📞 ${churchSettings.phone}
            </p>
          ` : ''}
        </div>
      </div>
    </div>
  `

  return await sendNotification({
    type: 'follow_up_assigned',
    recipientUserId: assignedUserId,
    title,
    message,
    emailSubject,
    emailBody,
    data: {
      follow_up_id: followUpData.id,
      contact_name: contactName,
      follow_up_type: followUpData.type,
      due_date: followUpData.dueDate,
      assigned_by: assignedByUserName
    },
    urgency: 'normal'
  })
}

/**
 * Convenience function for prayer assignment notifications
 */
export async function sendPrayerAssignmentNotification(
  assignedUserId: string,
  prayerData: {
    id: string
    title: string
    submitterName: string
    category?: string
    message: string
    isConfidential?: boolean
    urgency?: string
  },
  assignedByUserName?: string
): Promise<NotificationResult> {
  const title = `Prayer Assignment: ${prayerData.title}`
  const message = `You've been assigned to pray for ${prayerData.submitterName} - ${prayerData.title}`
  
  // Get church settings for email template
  const { data: churchSettings } = await supabase
    .from('tenant_settings')
    .select('name, phone, email')
    .single()

  const churchName = churchSettings?.name || 'Our Church'
  
  const emailSubject = title
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
          <h1 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: 600;">
            🙏 Prayer Assignment
          </h1>
          <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 16px;">
            ${churchName}
          </p>
        </div>

        <!-- Assignment Details -->
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">
            You've been assigned a prayer request
          </h3>
          <p style="color: #78350f; margin: 0; font-size: 14px;">
            ${assignedByUserName ? `Assigned by: ${assignedByUserName}` : 'This prayer request has been assigned to you'}
          </p>
        </div>

        <!-- Prayer Request Details -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
            Prayer Request Details:
          </h3>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">For:</strong>
            <span style="color: #6b7280; margin-left: 8px;">${prayerData.submitterName}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Title:</strong>
            <span style="color: #6b7280; margin-left: 8px;">${prayerData.title}</span>
          </div>
          
          ${prayerData.category ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Category:</strong>
              <span style="color: #6b7280; margin-left: 8px; text-transform: capitalize;">${prayerData.category}</span>
            </div>
          ` : ''}
          
          ${prayerData.urgency ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Urgency:</strong>
              <span style="color: #6b7280; margin-left: 8px; text-transform: capitalize;">${prayerData.urgency}</span>
            </div>
          ` : ''}
          
          ${prayerData.isConfidential ? `
            <div style="margin-bottom: 15px; background-color: #fee2e2; padding: 10px; border-radius: 6px; border-left: 4px solid #ef4444;">
              <strong style="color: #dc2626;">🔒 Confidential Request</strong>
              <p style="color: #7f1d1d; margin: 5px 0 0 0; font-size: 12px;">This is a private prayer request. Please handle with care and discretion.</p>
            </div>
          ` : ''}
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Prayer Request:</strong>
            <div style="color: #6b7280; margin: 5px 0 0 0; line-height: 1.6; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #3b82f6;">
              ${prayerData.message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
        
        <!-- Call to Action -->
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
          <p style="color: #1e3a8a; line-height: 1.6; margin: 0;">
            Please lift up <strong>${prayerData.submitterName}</strong> in prayer regarding their request. 
            Remember them in your daily prayers and intercede on their behalf. You can update the prayer status and add notes in your admin dashboard.
          </p>
        </div>
        
        <!-- Scripture Encouragement -->
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #22c55e;">
          <p style="color: #15803d; margin: 0; font-style: italic; line-height: 1.6;">
            "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."
          </p>
          <p style="color: #16a34a; margin: 8px 0 0 0; font-size: 14px; text-align: right;">
            - Philippians 4:6-7
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Thank you for your faithful prayers and ministry to our church family.
          </p>
          ${churchSettings?.email ? `
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">
              📧 ${churchSettings.email}
            </p>
          ` : ''}
          ${churchSettings?.phone ? `
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">
              📞 ${churchSettings.phone}
            </p>
          ` : ''}
        </div>
      </div>
    </div>
  `

  return await sendNotification({
    type: 'prayer_assigned',
    recipientUserId: assignedUserId,
    title,
    message,
    emailSubject,
    emailBody,
    data: {
      prayer_request_id: prayerData.id,
      submitter_name: prayerData.submitterName,
      prayer_title: prayerData.title,
      prayer_category: prayerData.category,
      urgency: prayerData.urgency,
      is_confidential: prayerData.isConfidential,
      assigned_by: assignedByUserName
    },
    urgency: prayerData.urgency === 'urgent' ? 'high' : 'normal'
  })
}

/**
 * Convenience function for group leader assignment notifications
 */
export async function sendGroupLeaderAssignmentNotification(
  assignedUserId: string,
  groupData: {
    id: string
    name: string
    description?: string
    category?: string
    leaderRole: 'leader' | 'co-leader'
  },
  assignedByUserName?: string
): Promise<NotificationResult> {
  const groupName = groupData.name
  const roleText = groupData.leaderRole === 'leader' ? 'Leader' : 'Co-Leader'
  const title = `Group ${roleText} Assignment: ${groupName}`
  const message = `You've been assigned as ${roleText} for the group "${groupName}"`
  
  // Get church settings for email template
  const { data: churchSettings } = await supabase
    .from('tenant_settings')
    .select('name, phone, email')
    .single()

  const churchName = churchSettings?.name || 'Our Church'
  
  const emailSubject = title
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
          <h1 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: 600;">
            👥 Group Leadership Assignment
          </h1>
          <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 16px;">
            ${churchName}
          </p>
        </div>

        <!-- Assignment Details -->
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
          <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 18px;">
            Congratulations! You've been assigned as a group ${roleText.toLowerCase()}
          </h3>
          <p style="color: #047857; margin: 0; font-size: 14px;">
            ${assignedByUserName ? `Assigned by: ${assignedByUserName}` : 'You have been assigned to lead this group'}
          </p>
        </div>

        <!-- Group Details -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
            Group Details:
          </h3>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Group Name:</strong>
            <span style="color: #6b7280; margin-left: 8px;">${groupName}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Your Role:</strong>
            <span style="color: #6b7280; margin-left: 8px;">${roleText}</span>
          </div>
          
          ${groupData.category ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Category:</strong>
              <span style="color: #6b7280; margin-left: 8px; text-transform: capitalize;">${groupData.category}</span>
            </div>
          ` : ''}
          
          ${groupData.description ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Description:</strong>
              <div style="color: #6b7280; margin: 5px 0 0 0; line-height: 1.6; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #3b82f6;">
                ${groupData.description.replace(/\n/g, '<br>')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <!-- Responsibilities -->
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
            Your Responsibilities as ${roleText}:
          </h3>
          <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Lead group meetings and facilitate discussions</li>
            <li style="margin-bottom: 8px;">Manage group membership and attendance</li>
            <li style="margin-bottom: 8px;">Coordinate group activities and events</li>
            <li style="margin-bottom: 8px;">Provide pastoral care and support to members</li>
            <li style="margin-bottom: 8px;">Communicate regularly with church leadership</li>
            ${groupData.leaderRole === 'co-leader' ? '<li style="margin-bottom: 8px;">Support the primary leader in their duties</li>' : ''}
          </ul>
        </div>
        
        <!-- Next Steps -->
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
            Next Steps:
          </h3>
          <ol style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Access the admin dashboard to view your group</li>
            <li style="margin-bottom: 8px;">Review the current member list and their details</li>
            <li style="margin-bottom: 8px;">Plan your first meeting or connect with existing members</li>
            <li style="margin-bottom: 8px;">Reach out to church leadership if you have questions</li>
            <li style="margin-bottom: 8px;">Begin praying for your group members regularly</li>
          </ol>
        </div>
        
        <!-- Scripture Encouragement -->
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #22c55e;">
          <p style="color: #15803d; margin: 0; font-style: italic; line-height: 1.6;">
            "Be shepherds of God's flock that is under your care, watching over them—not because you must, but because you are willing, as God wants you to be; not pursuing dishonest gain, but eager to serve; not lording it over those entrusted to you, but being examples to the flock."
          </p>
          <p style="color: #16a34a; margin: 8px 0 0 0; font-size: 14px; text-align: right;">
            - 1 Peter 5:2-3
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Thank you for your willingness to serve and lead in our church community.
          </p>
          ${churchSettings?.email ? `
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">
              📧 ${churchSettings.email}
            </p>
          ` : ''}
          ${churchSettings?.phone ? `
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">
              📞 ${churchSettings.phone}
            </p>
          ` : ''}
        </div>
      </div>
    </div>
  `

  return await sendNotification({
    type: 'group_leader_assigned',
    recipientUserId: assignedUserId,
    title,
    message,
    emailSubject,
    emailBody,
    data: {
      group_id: groupData.id,
      group_name: groupName,
      leader_role: groupData.leaderRole,
      group_category: groupData.category,
      assigned_by: assignedByUserName
    },
    urgency: 'normal'
  })
}

/**
 * Test notification function
 */
export async function testNotificationSystem(
  testUserId: string,
  notificationType: 'email' | 'push' | 'both' = 'both'
): Promise<NotificationResult> {
  console.log(`🧪 Testing notification system for user ${testUserId}`)

  if (notificationType === 'email' || notificationType === 'both') {
    const emailResult = await sendNotification({
      type: 'follow_up_assigned',
      recipientUserId: testUserId,
      title: 'Test Notification',
      message: 'This is a test notification from the church management system.',
      emailSubject: 'Test Email Notification',
      emailBody: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email Notification</h2>
          <p>This is a test email notification from your church management system.</p>
          <p>If you received this email, the notification system is working correctly!</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
      data: { test: true },
      urgency: 'low'
    })

    return emailResult
  }

  return { success: false, error: 'Invalid test type' }
} 