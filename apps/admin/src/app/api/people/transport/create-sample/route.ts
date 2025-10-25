import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handler for creating a sample transport request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Creating sample transport request with:', body);
    
    // Validate required fields
    if (!body.event_id) {
      return NextResponse.json(
        { message: 'Invalid request: event_id is required' },
        { status: 400 }
      );
    }
    
    // Set default values if needed
    const pickup_location = body.pickup_location || {
      lat: 39.72341827331013 + (Math.random() * 0.05),
      lng: -104.80330062208942 + (Math.random() * 0.05),
      address: '123 Sample St, Denver, CO'
    };
    
    console.log('Using pickup location:', pickup_location);
    
    // Get a random contact for this sample
    console.log('Fetching contacts...');
    let contact_id;
    
    try {
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name')
        .limit(5);
      
      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        throw contactsError;
      }
      
      console.log('Contacts found:', contacts?.length || 0);
      
      if (contacts && contacts.length > 0) {
        // Get a random contact from the results
        const randomContact = contacts[Math.floor(Math.random() * contacts.length)];
        contact_id = randomContact.id;
        console.log('Selected random contact:', randomContact.first_name, randomContact.last_name);
      } else {
        console.log('No contacts found, creating dummy contact');
        // Create a dummy contact if none exist
        const { data: newContact, error: newContactError } = await supabaseAdmin
          .from('contacts')
          .insert({
            first_name: 'Sample',
            last_name: 'User',
            email: `sample${Math.floor(Math.random() * 1000)}@example.com`,
            phone: `555-555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
          })
          .select()
          .single();
          
        if (newContactError) {
          console.error('Error creating sample contact:', newContactError);
          throw newContactError;
        }
        
        contact_id = newContact.id;
        console.log('Created new contact with ID:', contact_id);
      }
    } catch (contactError) {
      console.error('Failed to get or create contact:', contactError);
      return NextResponse.json(
        { message: 'Failed to get or create contact', error: String(contactError) },
        { status: 500 }
      );
    }
    
    if (!contact_id) {
      return NextResponse.json(
        { message: 'No contact ID found or created' },
        { status: 500 }
      );
    }
    
    // Create the transport request
    console.log('Creating transport request with contact ID:', contact_id);
    try {
      // First create without pickup_location to avoid geometry parsing errors
      const { data: transportRequest, error: transportError } = await supabaseAdmin
        .from('transport_requests')
        .insert({
          event_id: body.event_id,
          contact_id,
          pickup_address: pickup_location.address || '123 Sample St, Denver, CO',
          status: body.status || 'pending',
          requested_at: body.requested_at || new Date().toISOString(),
          notes: 'This is a sample transport request created for testing.'
        })
        .select()
        .single();
      
      if (transportError) {
        console.error('Error creating transport request:', transportError);
        throw transportError;
      }
      
      console.log('Successfully created sample transport request:', transportRequest.id);
      
      // Now add the location data in a separate update
      if (transportRequest.id) {
        console.log('Adding location data to transport request');
        const { error: locationError } = await supabaseAdmin
          .from('transport_requests')
          .update({
            pickup_location: {
              lat: pickup_location.lat,
              lng: pickup_location.lng,
              address: pickup_location.address
            }
          })
          .eq('id', transportRequest.id);
        
        if (locationError) {
          console.warn('Failed to add location data:', locationError);
          // Continue anyway since we successfully created the request
        } else {
          console.log('Successfully added location data');
        }
      }
      
      return NextResponse.json({
        message: 'Sample transport request created successfully',
        data: transportRequest
      });
    } catch (transportError) {
      console.error('Error creating transport request:', transportError);
      return NextResponse.json(
        { message: 'Failed to create transport request', error: String(transportError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
} 