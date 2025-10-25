#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkContacts() {
  console.log('Checking for contacts...');

  // Check for contacts
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, phone, email')
    .limit(10);

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError.message);
    
    if (contactsError.message.includes('does not exist')) {
      console.log('The contacts table does not exist. You need to create it first.');
      return;
    }
    
    return;
  }

  if (!contacts || contacts.length === 0) {
    console.log('No contacts found. You need to create some contacts first.');
    
    // Create a sample contact
    console.log('Creating a sample contact...');
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert({
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-123-4567',
        email: 'john.doe@example.com',
        lifecycle: 'member'
      })
      .select();
    
    if (createError) {
      console.error('Error creating sample contact:', createError.message);
    } else {
      console.log('Created sample contact:', newContact);
    }
    
    return;
  }

  console.log('Found contacts:');
  contacts.forEach(contact => {
    console.log(`- ${contact.id}: ${contact.first_name} ${contact.last_name} (${contact.phone || contact.email || 'No contact info'})`);
  });
  
  console.log('\nUse one of these contact IDs when creating transport requests');
}

// Run the function
checkContacts(); 