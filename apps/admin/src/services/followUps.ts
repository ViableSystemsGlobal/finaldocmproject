import { supabase } from '@/lib/supabase';
import { sendFollowUpAssignmentNotification } from '@/services/notificationService';

export type FollowUp = {
  id: string;
  contact_id: string;
  type: string;
  status: string;
  assigned_to?: string | null;
  created_at: string;
  next_action_date: string;
  completed_at?: string;
  notes?: string;
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };

};

export function fetchFollowUps() {
  return supabase
    .from('follow_ups')
    .select('*, contacts(id, first_name, last_name, email, phone)')
    .order('next_action_date');
}

export function fetchFollowUp(id: string) {
  return supabase
    .from('follow_ups')
    .select('*, contacts(id, first_name, last_name, email, phone)')
    .eq('id', id)
    .single();
}

export function createFollowUp(data: {
  contact_id: string;
  type: string;
  status: string;
  assigned_to?: string;
  next_action_date: string;
  notes?: string;
}) {
  return supabase.from('follow_ups').insert(data);
}

export function updateFollowUp(id: string, data: Partial<FollowUp>) {
  return supabase.from('follow_ups').update(data).eq('id', id);
}

export function deleteFollowUp(id: string) {
  return supabase.from('follow_ups').delete().eq('id', id);
}

export function markFollowUpComplete(id: string, notes?: string) {
  return supabase
    .from('follow_ups')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: notes ? `${notes}\n\nCompleted on ${new Date().toISOString()}` : `Completed on ${new Date().toISOString()}`
    })
    .eq('id', id);
}

/**
 * Send follow-up assignment email notification
 */
export async function sendFollowUpAssignmentEmail(
  followUp: FollowUp,
  assignedUserEmail: string,
  assignedUserName: string,
  assignedByUserName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get church settings for template variables
    const { data: churchSettings } = await supabase
      .from('tenant_settings')
      .select('name, phone, email')
      .single();

    const churchName = churchSettings?.name || 'Our Church';
    const contactName = followUp.contacts 
      ? `${followUp.contacts.first_name || ''} ${followUp.contacts.last_name || ''}`.trim() || 'Unknown Contact'
      : 'Unknown Contact';

    const emailSubject = `Follow-up Assignment: ${contactName}`;
    
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
              ${followUp.contacts?.email ? `<br><span style="color: #6b7280; margin-left: 8px; font-size: 14px;">${followUp.contacts.email}</span>` : ''}
              ${followUp.contacts?.phone ? `<br><span style="color: #6b7280; margin-left: 8px; font-size: 14px;">${followUp.contacts.phone}</span>` : ''}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Type:</strong>
              <span style="color: #6b7280; margin-left: 8px; text-transform: capitalize;">${followUp.type}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151;">Due Date:</strong>
              <span style="color: #6b7280; margin-left: 8px;">${new Date(followUp.next_action_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            
            ${followUp.notes ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">Notes:</strong>
                <p style="color: #6b7280; margin: 5px 0 0 0; line-height: 1.6; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #3b82f6;">${followUp.notes}</p>
              </div>
            ` : ''}
          </div>
          
          <!-- Call to Action -->
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">
              Hi ${assignedUserName}!
            </h3>
            <p style="color: #1e3a8a; line-height: 1.6; margin: 0;">
              Please follow up with <strong>${contactName}</strong> regarding this ${followUp.type} follow-up. 
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
    `;

    // Use the new notification service
    const result = await sendFollowUpAssignmentNotification(
      followUp.assigned_to!,
      {
        id: followUp.id,
        contactName: contactName,
        type: followUp.type,
        dueDate: followUp.next_action_date,
        notes: followUp.notes
      },
      assignedByUserName
    );

    if (result.success) {
      console.log('Follow-up assignment notification sent successfully');
      return { success: true };
    } else {
      console.error('Failed to send follow-up assignment notification:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error sending follow-up assignment email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Reassign follow-up and optionally send notification email
 */
export async function reassignFollowUp(
  id: string, 
  assignedTo: string | null,
  options?: {
    sendNotification?: boolean;
    assignedByUserName?: string;
  }
) {
  const updateData: any = {
    assigned_to: assignedTo
  };
  
  // First, update the follow-up in the database
  const { error: updateError } = await supabase
    .from('follow_ups')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    return { error: updateError };
  }

  // If email notification is enabled and we have an assignee, send the notification
  if (options?.sendNotification && assignedTo) {
    try {
      // Get the updated follow-up with contact details
      const { data: followUp, error: fetchError } = await supabase
        .from('follow_ups')
        .select('*, contacts(id, first_name, last_name, email, phone)')
        .eq('id', id)
        .single();

      if (fetchError || !followUp) {
        console.error('Failed to fetch follow-up for notification:', fetchError);
        return { error: updateError }; // Return original success, just log notification failure
      }

      // Get assigned user details
      const { data: assignedUser, error: userError } = await supabase
        .from('users')
        .select('id, email, raw_user_meta_data')
        .eq('id', assignedTo)
        .single();

      if (userError || !assignedUser || !assignedUser.email) {
        console.error('Failed to get assigned user details:', userError);
        return { error: updateError }; // Return original success, just log notification failure
      }

      const assignedUserName = assignedUser.raw_user_meta_data?.name || 
                              assignedUser.raw_user_meta_data?.full_name || 
                              assignedUser.email;

      // Send the notification email
      console.log('📧 Sending follow-up assignment notification...', {
        assignedTo,
        followUpId: followUp.id,
        contactName: followUp.contacts?.first_name && followUp.contacts?.last_name 
          ? `${followUp.contacts.first_name} ${followUp.contacts.last_name}`
          : followUp.contacts?.first_name || followUp.contacts?.email || 'Unknown Contact',
        assignedByUserName: options.assignedByUserName
      });

      const emailResult = await sendFollowUpAssignmentNotification(
        assignedTo,
        {
          id: followUp.id,
          contactName: followUp.contacts?.first_name && followUp.contacts?.last_name 
            ? `${followUp.contacts.first_name} ${followUp.contacts.last_name}`
            : followUp.contacts?.first_name || followUp.contacts?.email || 'Unknown Contact',
          type: followUp.type,
          dueDate: followUp.next_action_date,
          notes: followUp.notes
        },
        options.assignedByUserName
      );

      console.log('📧 Notification result:', emailResult);

      if (!emailResult.success) {
        console.error('Failed to send assignment notification email:', {
          error: emailResult.error,
          emailSent: emailResult.emailSent,
          pushSent: emailResult.pushSent,
          fullResult: emailResult
        });
        // Don't fail the assignment if email fails, just log it
      } else {
        console.log('✅ Assignment notification sent successfully:', {
          emailSent: emailResult.emailSent,
          pushSent: emailResult.pushSent
        });
      }
    } catch (emailError) {
      console.error('Error sending assignment notification:', emailError);
      // Don't fail the assignment if email fails, just log it
    }
  }

  return { error: updateError };
}

export async function getFollowUpMetrics() {
  try {
    // Get pending follow-ups
    const { count: pendingFollowUps, error: pendingError } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    // Get overdue follow-ups
    const today = new Date().toISOString().split('T')[0]; // Get just the date part
    const { count: overdueFollowUps, error: overdueError } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('next_action_date', today);

    if (overdueError) throw overdueError;

    // Get completed follow-ups today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const { count: completedToday, error: completedError } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString())
      .lte('completed_at', todayEnd.toISOString());

    if (completedError) throw completedError;

    return {
      pendingFollowUps: pendingFollowUps || 0,
      overdueFollowUps: overdueFollowUps || 0,
      completedToday: completedToday || 0,
      error: null
    };
  } catch (error) {
    console.error('Error fetching follow-up metrics:', error);
    return {
      pendingFollowUps: 0,
      overdueFollowUps: 0,
      completedToday: 0,
      error
    };
  }
} 