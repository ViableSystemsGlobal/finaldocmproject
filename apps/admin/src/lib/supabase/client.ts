import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or API key');
    throw new Error('Missing Supabase URL or API key');
  }
  
  return createSupabaseClient(supabaseUrl, supabaseKey);
} 