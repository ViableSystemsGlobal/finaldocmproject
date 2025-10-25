import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results = {
    success: false,
    message: '',
    error: null as string | null,
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      serviceKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
    }
  };

  try {
    // Try with anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    results.message = 'Successfully created Supabase client';
    
    // Try a simple query
    const { data, error } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .limit(1);
    
    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
    
    results.success = true;
    results.message = `Connection successful. Found tables: ${data?.length || 0}`;
  } catch (e: any) {
    results.error = e.message;
  }

  return NextResponse.json(results);
} 