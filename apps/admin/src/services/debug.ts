import { supabase } from '@/lib/supabase';

export async function listAllTables() {
  try {
    const { data, error } = await supabase
      .rpc('list_all_tables');
    
    if (error) {
      console.error('Error listing tables:', error);
      
      // Try alternative approach
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_tables')
        .select('schemaname, tablename')
        .neq('schemaname', 'pg_catalog')
        .neq('schemaname', 'information_schema');
      
      if (tablesError) {
        console.error('Error with alternative approach:', tablesError);
        return { data: null, error: tablesError };
      }
      
      return { data: tablesData, error: null };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { data: null, error: err };
  }
} 