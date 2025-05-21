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
    createdTables: [] as string[]
  };

  try {
    // Check DB connection
    results.steps.push('Checking database connection...');
    
    // List all tables
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .order('tablename');
    
    if (tablesError) {
      throw new Error(`Failed to list tables: ${tablesError.message}`);
    }
    
    results.tables = tables;
    results.steps.push(`Found ${tables.length} tables in public schema`);
    
    // Check if comms tables exist
    const commsTemplatesTable = tables.find(t => t.tablename === 'comms_templates');
    const commsCampaignsTable = tables.find(t => t.tablename === 'comms_campaigns');
    const commsRecipientsTable = tables.find(t => t.tablename === 'comms_recipients');
    
    // Create comms_templates if it doesn't exist
    if (!commsTemplatesTable) {
      results.steps.push('comms_templates table not found, creating it...');
      
      const { error: createError } = await supabase.rpc(
        'execute_sql',
        {
          sql: `
            CREATE TABLE IF NOT EXISTS public.comms_templates (
              id              uuid primary key default gen_random_uuid(),
              name            text not null,
              channel         text not null,
              subject         text,
              body            text not null,
              variables_schema jsonb default '[]',
              created_at      timestamptz default now(),
              updated_at      timestamptz default now()
            );
            
            ALTER TABLE public.comms_templates ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow read access to comms_templates for authenticated users"
              ON public.comms_templates FOR SELECT
              TO authenticated
              USING (true);
            
            CREATE POLICY "Allow insert access to comms_templates for authenticated users"
              ON public.comms_templates FOR INSERT
              TO authenticated
              WITH CHECK (true);
            
            CREATE POLICY "Allow update access to comms_templates for authenticated users"
              ON public.comms_templates FOR UPDATE
              TO authenticated
              USING (true);
            
            CREATE POLICY "Allow delete access to comms_templates for authenticated users"
              ON public.comms_templates FOR DELETE
              TO authenticated
              USING (true);
          `
        }
      );
      
      if (createError) {
        throw new Error(`Failed to create comms_templates table: ${createError.message}`);
      }
      
      results.steps.push('Successfully created comms_templates table');
      results.createdTables.push('comms_templates');
    } else {
      results.steps.push('comms_templates table already exists');
    }
    
    // Create comms_campaigns if it doesn't exist
    if (!commsCampaignsTable) {
      results.steps.push('comms_campaigns table not found, creating it...');
      
      const { error: createError } = await supabase.rpc(
        'execute_sql',
        {
          sql: `
            CREATE TABLE IF NOT EXISTS public.comms_campaigns (
              id              uuid primary key default gen_random_uuid(),
              template_id     uuid references public.comms_templates(id),
              name            text not null,
              channel         text not null,
              scheduled_at    timestamptz,
              status          text not null default 'draft',
              created_by      uuid references auth.users(id),
              created_at      timestamptz default now(),
              updated_at      timestamptz default now()
            );
            
            ALTER TABLE public.comms_campaigns ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow read access to comms_campaigns for authenticated users"
              ON public.comms_campaigns FOR SELECT
              TO authenticated
              USING (true);
            
            CREATE POLICY "Allow insert access to comms_campaigns for authenticated users"
              ON public.comms_campaigns FOR INSERT
              TO authenticated
              WITH CHECK (true);
            
            CREATE POLICY "Allow update access to comms_campaigns for authenticated users"
              ON public.comms_campaigns FOR UPDATE
              TO authenticated
              USING (true);
            
            CREATE POLICY "Allow delete access to comms_campaigns for authenticated users"
              ON public.comms_campaigns FOR DELETE
              TO authenticated
              USING (true);
          `
        }
      );
      
      if (createError) {
        throw new Error(`Failed to create comms_campaigns table: ${createError.message}`);
      }
      
      results.steps.push('Successfully created comms_campaigns table');
      results.createdTables.push('comms_campaigns');
    } else {
      results.steps.push('comms_campaigns table already exists');
    }
    
    // Create comms_recipients if it doesn't exist
    if (!commsRecipientsTable) {
      results.steps.push('comms_recipients table not found, creating it...');
      
      const { error: createError } = await supabase.rpc(
        'execute_sql',
        {
          sql: `
            CREATE TABLE IF NOT EXISTS public.comms_recipients (
              id              uuid primary key default gen_random_uuid(),
              campaign_id     uuid references public.comms_campaigns(id) on delete cascade,
              contact_id      uuid references public.contacts(id),
              to_address      text not null,
              variables       jsonb,
              status          text not null default 'pending',
              last_error      text,
              sent_at         timestamptz,
              delivered_at    timestamptz,
              opened_at       timestamptz,
              clicked_at      timestamptz
            );
            
            ALTER TABLE public.comms_recipients ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow read access to comms_recipients for authenticated users"
              ON public.comms_recipients FOR SELECT
              TO authenticated
              USING (true);
            
            CREATE POLICY "Allow insert access to comms_recipients for authenticated users"
              ON public.comms_recipients FOR INSERT
              TO authenticated
              WITH CHECK (true);
            
            CREATE POLICY "Allow update access to comms_recipients for authenticated users"
              ON public.comms_recipients FOR UPDATE
              TO authenticated
              USING (true);
            
            CREATE POLICY "Allow delete access to comms_recipients for authenticated users"
              ON public.comms_recipients FOR DELETE
              TO authenticated
              USING (true);
          `
        }
      );
      
      if (createError) {
        throw new Error(`Failed to create comms_recipients table: ${createError.message}`);
      }
      
      results.steps.push('Successfully created comms_recipients table');
      results.createdTables.push('comms_recipients');
    } else {
      results.steps.push('comms_recipients table already exists');
    }
    
    // Create updated_at trigger if it doesn't exist
    results.steps.push('Creating or checking the updated_at trigger function...');
    
    const { error: triggerError } = await supabase.rpc(
      'execute_sql',
      {
        sql: `
          CREATE OR REPLACE FUNCTION update_modified_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = now();
              RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          DROP TRIGGER IF EXISTS update_comms_templates_updated_at ON public.comms_templates;
          CREATE TRIGGER update_comms_templates_updated_at
          BEFORE UPDATE ON public.comms_templates
          FOR EACH ROW
          EXECUTE PROCEDURE update_modified_column();
          
          DROP TRIGGER IF EXISTS update_comms_campaigns_updated_at ON public.comms_campaigns;
          CREATE TRIGGER update_comms_campaigns_updated_at
          BEFORE UPDATE ON public.comms_campaigns
          FOR EACH ROW
          EXECUTE PROCEDURE update_modified_column();
        `
      }
    );
    
    if (triggerError) {
      throw new Error(`Failed to create triggers: ${triggerError.message}`);
    }
    
    results.steps.push('Successfully created or updated triggers');
    
    // Create metrics functions
    results.steps.push('Creating metrics functions...');
    
    const { error: metricsError } = await supabase.rpc(
      'execute_sql',
      {
        sql: `
          CREATE OR REPLACE FUNCTION public.get_comms_campaign_metrics(campaign_id UUID)
          RETURNS TABLE (
            total_recipients INTEGER,
            pending_count INTEGER,
            sent_count INTEGER,
            delivered_count INTEGER,
            opened_count INTEGER,
            clicked_count INTEGER,
            failed_count INTEGER
          ) AS $$
          BEGIN
            RETURN QUERY
            SELECT
              COUNT(*)::INTEGER AS total_recipients,
              COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_count,
              COUNT(*) FILTER (WHERE status = 'sent')::INTEGER AS sent_count,
              COUNT(*) FILTER (WHERE status = 'delivered')::INTEGER AS delivered_count,
              COUNT(*) FILTER (WHERE status = 'opened')::INTEGER AS opened_count,
              COUNT(*) FILTER (WHERE status = 'clicked')::INTEGER AS clicked_count,
              COUNT(*) FILTER (WHERE status = 'failed')::INTEGER AS failed_count
            FROM
              public.comms_recipients
            WHERE
              campaign_id = $1;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE OR REPLACE FUNCTION public.get_comms_metrics()
          RETURNS TABLE (
            total_campaigns INTEGER,
            active_campaigns INTEGER,
            scheduled_campaigns INTEGER,
            completed_campaigns INTEGER,
            total_templates INTEGER,
            email_templates INTEGER,
            sms_templates INTEGER,
            whatsapp_templates INTEGER,
            push_templates INTEGER
          ) AS $$
          BEGIN
            RETURN QUERY
            SELECT
              (SELECT COUNT(*)::INTEGER FROM public.comms_campaigns) AS total_campaigns,
              (SELECT COUNT(*)::INTEGER FROM public.comms_campaigns WHERE status IN ('draft', 'sending')) AS active_campaigns,
              (SELECT COUNT(*)::INTEGER FROM public.comms_campaigns WHERE status = 'scheduled') AS scheduled_campaigns,
              (SELECT COUNT(*)::INTEGER FROM public.comms_campaigns WHERE status = 'completed') AS completed_campaigns,
              (SELECT COUNT(*)::INTEGER FROM public.comms_templates) AS total_templates,
              (SELECT COUNT(*)::INTEGER FROM public.comms_templates WHERE channel = 'email') AS email_templates,
              (SELECT COUNT(*)::INTEGER FROM public.comms_templates WHERE channel = 'sms') AS sms_templates,
              (SELECT COUNT(*)::INTEGER FROM public.comms_templates WHERE channel = 'whatsapp') AS whatsapp_templates,
              (SELECT COUNT(*)::INTEGER FROM public.comms_templates WHERE channel = 'push') AS push_templates;
          END;
          $$ LANGUAGE plpgsql;
        `
      }
    );
    
    if (metricsError) {
      throw new Error(`Failed to create metrics functions: ${metricsError.message}`);
    }
    
    results.steps.push('Successfully created metrics functions');
    
    // Create sample template for testing
    if (results.createdTables.includes('comms_templates')) {
      results.steps.push('Creating sample template for testing...');
      
      const { data: sampleTemplate, error: sampleError } = await supabase
        .from('comms_templates')
        .insert({
          name: 'Welcome Email',
          channel: 'email',
          subject: 'Welcome to our Church!',
          body: 'Hello {{name}},\n\nWelcome to our church community! We are glad to have you with us.\n\nBlessings,\nChurch Team',
          variables_schema: [{ name: 'name', type: 'string', required: true }]
        })
        .select();
      
      if (sampleError) {
        results.steps.push(`Failed to create sample template: ${sampleError.message}`);
      } else {
        results.steps.push('Successfully created sample template');
      }
    }
    
    results.success = true;
    return NextResponse.json(results);
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 500 });
  }
} 