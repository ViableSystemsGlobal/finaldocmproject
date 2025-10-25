import { supabase } from '@/lib/supabase';

export type PlannedVisit = {
  id: string;
  contact_id?: string;
  event_name: string;
  event_date: string;
  event_time?: string;
  interest_level: string;
  how_heard_about_us?: string;
  coming_with_others?: boolean;
  companions_count?: number;
  companions_details?: string;
  special_needs?: string;
  contact_preference: string;
  notes?: string;
  follow_up_date?: string;
  status: string;
  converted_to_visitor?: boolean;
  converted_date?: string;
  assigned_to?: string;
  last_message_sent?: string;
  message_count?: number;
  created_at: string;
  updated_at: string;
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    lifecycle?: string;
  };
  user?: {
    id: string;
    email: string;
    raw_user_meta_data: {
      first_name?: string;
      last_name?: string;
      name?: string;
    };
  };
};

export function fetchPlannedVisits(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  return supabase
    .from('planned_visits')
    .select(`
      id, 
      contact_id,
      event_name,
      event_date, 
      event_time,
      interest_level,
      how_heard_about_us,
      coming_with_others,
      companions_count,
      companions_details,
      special_needs,
      contact_preference,
      notes,
      follow_up_date,
      status,
      converted_to_visitor,
      converted_date,
      assigned_to,
      last_message_sent,
      message_count,
      created_at,
      updated_at,
      contacts (
        id, 
        first_name, 
        last_name, 
        email,
        phone,
        lifecycle
      )
    `, { count: 'exact' })
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1);
}

export function fetchPlannedVisit(id: string) {
  return supabase
    .from('planned_visits')
    .select(`
      *,
      contacts(id, first_name, last_name, email, phone, lifecycle)
    `)
    .eq('id', id)
    .single();
}

export function createPlannedVisit(data: {
  contact_id?: string;
  event_name: string;
  event_date: string;
  event_time?: string;
  interest_level?: string;
  how_heard_about_us?: string;
  coming_with_others?: boolean;
  companions_count?: number;
  companions_details?: string;
  special_needs?: string;
  contact_preference?: string;
  notes?: string;
  follow_up_date?: string;
  status?: string;
}) {
  return supabase.from('planned_visits').insert({
    ...data,
    status: data.status || 'pending',
    interest_level: data.interest_level || 'interested',
    contact_preference: data.contact_preference || 'email',
    coming_with_others: data.coming_with_others || false,
    companions_count: data.companions_count || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

export function updatePlannedVisit(id: string, data: Partial<PlannedVisit>) {
  return supabase.from('planned_visits').update({
    ...data,
    updated_at: new Date().toISOString()
  }).eq('id', id);
}

export function deletePlannedVisit(id: string) {
  return supabase.from('planned_visits').delete().eq('id', id);
}

export function markAsAttended(id: string, notes?: string) {
  return supabase
    .from('planned_visits')
    .update({
      status: 'attended',
      notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

export function convertToVisitor(id: string, notes?: string) {
  return supabase
    .from('planned_visits')
    .update({
      converted_to_visitor: true,
      converted_date: new Date().toISOString(),
      status: 'attended', // Assume they attended when converting
      notes: notes ? `${notes}\n\nConverted to visitor.` : 'Converted to visitor.',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

export async function sendMessage(id: string, messageContent: string, messageType: 'email' | 'sms' = 'email') {
  try {
    // First, get the current visit and message count
    const { data: currentVisit, error: fetchError } = await supabase
      .from('planned_visits')
      .select(`
        message_count,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentCount = currentVisit?.message_count || 0;
    
    // Handle the contact data structure - it might be an array or single object
    const contactsData = currentVisit?.contacts;
    const contact = Array.isArray(contactsData) ? contactsData[0] : contactsData;

    if (!contact) {
      throw new Error('Contact information not found');
    }

    // Validate contact information based on message type
    if (messageType === 'email' && !contact.email) {
      throw new Error('No email address available for this contact');
    }
    
    if (messageType === 'sms' && !contact.phone) {
      throw new Error('No phone number available for this contact');
    }

    let sendResult;

    if (messageType === 'email') {
      // Import the email service dynamically to avoid circular imports
      const { enqueueEmailDirect } = await import('./emailService');
      
      // Prepare email data
      const emailVariables = {
        subject: `Regarding Your Planned Visit`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; border-bottom: 3px solid #4F46E5; padding-bottom: 10px;">
              Hello ${contact.first_name || ''} ${contact.last_name || ''}
            </h2>
            <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #475569; line-height: 1.6; margin: 0;">
                ${messageContent.replace(/\n/g, '<br>')}
              </p>
            </div>
            <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #64748B; font-size: 14px; margin: 0;">
                This message is regarding your planned visit to our church.
                <br>We look forward to welcoming you!
              </p>
            </div>
          </div>
        `,
        plainText: `Hello ${contact.first_name || ''} ${contact.last_name || ''},\n\n${messageContent}\n\nThis message is regarding your planned visit to our church. We look forward to welcoming you!`
      };

      // Send email using your existing email service
      sendResult = await enqueueEmailDirect(contact.email, emailVariables, {
        emailType: 'system',
        metadata: {
          planned_visit_id: id,
          contact_id: contact.id,
          message_type: 'planned_visit_outreach'
        }
      });
    } else {
      // Send SMS using your existing SMS service
      const { sendSMS } = await import('./sms');
      
      // Format SMS message with contact name
      const smsMessage = `Hi ${contact.first_name || 'there'}, ${messageContent}`;
      
      sendResult = await sendSMS({
        to_phone: contact.phone,
        message: smsMessage
      });
    }

    if (!sendResult.success) {
      throw new Error(sendResult.error || `Failed to send ${messageType}`);
    }

    // Update the message tracking fields
    const { data, error } = await supabase
      .from('planned_visits')
      .update({
        last_message_sent: new Date().toISOString(),
        message_count: currentCount + 1,
        notes: `${messageType === 'email' ? 'Email' : 'SMS'} sent: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    console.log(`${messageType.toUpperCase()} sent successfully to ${contact.first_name || ''} ${contact.last_name || ''}`);

    return { data, error: null };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { data: null, error };
  }
}

export function rescheduleEvent(id: string, newDate: string, newTime?: string, notes?: string) {
  return supabase
    .from('planned_visits')
    .update({
      event_date: newDate,
      event_time: newTime,
      notes: notes ? `Rescheduled: ${notes}` : 'Event rescheduled',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

export async function getPlannedVisitMetrics() {
  try {
    const now = new Date().toISOString();
    console.log('Fetching planned visit metrics. Current time:', now);
    
    // First, let's see what data exists in the table
    const { data: allVisits, error: allError } = await supabase
      .from('planned_visits')
      .select('id, status, event_date, converted_to_visitor')
      .limit(20);
    
    if (!allError) {
      console.log('Sample planned visits data:', allVisits);
      const statuses = allVisits?.map(v => v.status) || [];
      console.log('Available statuses:', Array.from(new Set(statuses)));
    }
    
    // Get pending visits (upcoming visits that need to be scheduled/confirmed)
    const { count: pendingVisits, error: pendingError } = await supabase
      .from('planned_visits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending visits:', pendingError);
      throw pendingError;
    }
    console.log('Pending visits count (upcoming visits):', pendingVisits);

    // Get confirmed visits (future confirmed visits)
    const { count: confirmedVisits, error: confirmedError } = await supabase
      .from('planned_visits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('event_date', now);

    if (confirmedError) {
      console.error('Error fetching confirmed visits:', confirmedError);
      throw confirmedError;
    }
    console.log('Confirmed visits count (future confirmed):', confirmedVisits);

    // Get overdue visits (past event date and still pending/confirmed/contacted)
    const { count: overdueVisits, error: overdueError } = await supabase
      .from('planned_visits')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'contacted'])
      .lt('event_date', now);

    if (overdueError) {
      console.error('Error fetching overdue visits:', overdueError);
      throw overdueError;
    }
    console.log('Overdue visits count:', overdueVisits);

    // Get attended this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    console.log('Start of month:', startOfMonth.toISOString());

    const { count: attendedThisMonth, error: attendedError } = await supabase
      .from('planned_visits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'attended')
      .gte('event_date', startOfMonth.toISOString());

    if (attendedError) {
      console.error('Error fetching attended visits:', attendedError);
      throw attendedError;
    }
    console.log('Attended this month count:', attendedThisMonth);

    // Get conversions to visitors
    const { count: convertedToVisitors, error: convertedError } = await supabase
      .from('planned_visits')
      .select('*', { count: 'exact', head: true })
      .eq('converted_to_visitor', true);

    if (convertedError) {
      console.error('Error fetching converted visitors:', convertedError);
      throw convertedError;
    }
    console.log('Converted to visitors count:', convertedToVisitors);

    const result = {
      pendingVisits: pendingVisits || 0,
      confirmedVisits: confirmedVisits || 0,
      overdueVisits: overdueVisits || 0,
      attendedThisMonth: attendedThisMonth || 0,
      convertedToVisitors: convertedToVisitors || 0,
      error: null
    };
    
    console.log('Final metrics result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching planned visit metrics:', error);
    return {
      pendingVisits: 0,
      confirmedVisits: 0,
      overdueVisits: 0,
      attendedThisMonth: 0,
      convertedToVisitors: 0,
      error
    };
  }
} 