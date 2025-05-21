import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const results = {
    success: false,
    steps: [] as string[],
    tables: [] as any[],
    error: null as string | null,
    fixedTables: [] as string[]
  };

  try {
    // Check DB connection
    results.steps.push('Checking database connection...');
    
    // List all tables
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .in('schemaname', ['public', 'events'])
      .order('schemaname');
    
    if (tablesError) {
      throw new Error(`Failed to list tables: ${tablesError.message}`);
    }
    
    results.tables = tables;
    results.steps.push(`Found ${tables.length} tables`);
    
    // Check if event_images exists
    const eventImagesTable = tables.find(t => 
      t.tablename === 'event_images' && t.schemaname === 'public'
    );
    
    if (!eventImagesTable) {
      results.steps.push('event_images table not found in public schema, creating it...');
      
      // Create the event_images table
      const { error: createError } = await supabase.rpc(
        'execute_sql',
        {
          sql: `
            CREATE TABLE IF NOT EXISTS public.event_images (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
              url TEXT NOT NULL,
              alt_text TEXT,
              sort_order INT DEFAULT 0,
              created_at TIMESTAMPTZ DEFAULT now()
            );
            
            ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY event_images_all_operations_policy
            ON public.event_images
            FOR ALL
            USING (true)
            WITH CHECK (true);
            
            GRANT ALL ON TABLE public.event_images TO authenticated, anon, service_role;
          `
        }
      );
      
      if (createError) {
        throw new Error(`Failed to create event_images table: ${createError.message}`);
      }
      
      results.steps.push('Successfully created event_images table');
      results.fixedTables.push('event_images');
    } else {
      results.steps.push('event_images table found in public schema');
    }
    
    // Check event_images policies
    const { data: policies, error: policiesError } = await supabase.rpc(
      'execute_sql',
      {
        sql: `
          SELECT 
            schemaname, 
            tablename, 
            policyname 
          FROM pg_policies 
          WHERE 
            schemaname = 'public' AND 
            tablename = 'event_images'
        `
      }
    );
    
    if (policiesError) {
      throw new Error(`Failed to check policies: ${policiesError.message}`);
    }
    
    results.steps.push(`Found ${policies?.length || 0} policies for event_images`);
    
    if (!policies || policies.length === 0) {
      results.steps.push('No policies found for event_images, creating them...');
      
      const { error: policyError } = await supabase.rpc(
        'execute_sql',
        {
          sql: `
            CREATE POLICY event_images_all_operations_policy
            ON public.event_images
            FOR ALL
            USING (true)
            WITH CHECK (true);
          `
        }
      );
      
      if (policyError) {
        throw new Error(`Failed to create policy: ${policyError.message}`);
      }
      
      results.steps.push('Successfully created policy for event_images');
    }
    
    // Test inserting a record
    results.steps.push('Testing insert to event_images...');
    
    // Get an event ID
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (eventsError) {
      throw new Error(`Failed to get events: ${eventsError.message}`);
    }
    
    if (events && events.length > 0) {
      const eventId = events[0].id;
      results.steps.push(`Using event ID: ${eventId}`);
      
      // Try insert
      const { data: insertData, error: insertError } = await supabase
        .from('event_images')
        .insert({
          event_id: eventId,
          url: 'https://test-image-url.com/test.jpg',
          alt_text: 'Test image',
          sort_order: 999
        })
        .select();
      
      if (insertError) {
        results.steps.push(`Insert test failed: ${insertError.message}`);
      } else {
        results.steps.push('Insert test succeeded');
      }
    } else {
      results.steps.push('No events found to test with');
    }
    
    results.success = true;
    return NextResponse.json(results);
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 500 });
  }
} 