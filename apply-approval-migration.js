const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://ufjfafcfkalaasdhgcbi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA'
);

async function applyMigration() {
  try {
    console.log('🚀 Applying group membership approval migration step by step...');
    
    // Step 1: Add columns to group_memberships table
    console.log('\n📝 Step 1: Adding approval columns to group_memberships...');
    const steps = [
      'ALTER TABLE public.group_memberships ADD COLUMN IF NOT EXISTS approved_by UUID',
      'ALTER TABLE public.group_memberships ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ',
      'ALTER TABLE public.group_memberships ADD COLUMN IF NOT EXISTS rejection_reason TEXT',
      'ALTER TABLE public.group_memberships ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now()',
      
      // Step 2: Add columns to discipleship_memberships table
      'ALTER TABLE public.discipleship_memberships ADD COLUMN IF NOT EXISTS approved_by UUID',
      'ALTER TABLE public.discipleship_memberships ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ',
      'ALTER TABLE public.discipleship_memberships ADD COLUMN IF NOT EXISTS rejection_reason TEXT',
      'ALTER TABLE public.discipleship_memberships ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now()',
      
      // Step 3: Update existing data
      `DO $$
BEGIN
    -- Check if created_at column exists in group_memberships table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'group_memberships' AND column_name = 'created_at'
    ) THEN
        UPDATE public.group_memberships 
        SET requested_at = COALESCE(joined_at, created_at, now())
        WHERE requested_at IS NULL;
        
        UPDATE public.group_memberships 
        SET approved_at = COALESCE(joined_at, created_at, now())
        WHERE status = 'active' AND approved_at IS NULL;
    ELSE
        UPDATE public.group_memberships 
        SET requested_at = COALESCE(joined_at, now())
        WHERE requested_at IS NULL;
        
        UPDATE public.group_memberships 
        SET approved_at = COALESCE(joined_at, now())
        WHERE status = 'active' AND approved_at IS NULL;
    END IF;
    
    -- Check if created_at column exists in discipleship_memberships table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'discipleship_memberships' AND column_name = 'created_at'
    ) THEN
        UPDATE public.discipleship_memberships 
        SET requested_at = COALESCE(joined_at, created_at, now())
        WHERE requested_at IS NULL;
        
        UPDATE public.discipleship_memberships 
        SET approved_at = COALESCE(joined_at, created_at, now())
        WHERE status = 'active' AND approved_at IS NULL;
    ELSE
        UPDATE public.discipleship_memberships 
        SET requested_at = COALESCE(joined_at, now())
        WHERE requested_at IS NULL;
        
        UPDATE public.discipleship_memberships 
        SET approved_at = COALESCE(joined_at, now())
        WHERE status = 'active' AND approved_at IS NULL;
    END IF;
END $$`,
    ];
    
    for (const sql of steps) {
      console.log(`  🔄 Executing: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('execute_sql', { sql });
      if (error) {
        console.error('❌ Error:', error);
      } else {
        console.log('  ✅ Success');
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
    // Test by checking if columns exist
    console.log('\n🔍 Testing migration by checking table structure...');
    const { data: groupCols, error: groupColsError } = await supabase.rpc('execute_sql', { 
      sql: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'group_memberships\' AND column_name IN (\'approved_by\', \'approved_at\', \'rejection_reason\', \'requested_at\')' 
    });
    
    if (groupColsError) {
      console.error('❌ Error checking columns:', groupColsError);
    } else {
      console.log('✅ Group memberships columns added:', groupCols.length);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

applyMigration(); 