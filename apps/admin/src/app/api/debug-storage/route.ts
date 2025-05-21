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
    buckets: [] as any[],
    error: null as string | null,
    createdBuckets: [] as string[]
  };

  try {
    // Check if storage is accessible
    results.steps.push('Checking Supabase storage...');
    
    // List existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }
    
    results.buckets = buckets || [];
    results.steps.push(`Found ${buckets?.length || 0} buckets: ${buckets?.map(b => b.name).join(', ') || 'none'}`);
    
    // Check if event-images bucket exists
    const eventImagesBucket = buckets?.find(b => b.name === 'event-images');
    
    if (!eventImagesBucket) {
      results.steps.push('event-images bucket not found, creating it...');
      
      // Create the bucket
      const { data: createData, error: createError } = await supabase.storage.createBucket('event-images', {
        public: true  // Make bucket publicly accessible
      });
      
      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
      
      results.steps.push('Successfully created event-images bucket');
      results.createdBuckets.push('event-images');
      
      // Add bucket policies
      results.steps.push('Setting bucket policies...');
      
      // Since we're using createBucket with public: true, this should be set automatically
      // But let's verify with a test upload
    } else {
      results.steps.push('event-images bucket already exists');
      
      // Try to update the bucket to be public
      results.steps.push('Updating existing bucket to be public...');
      const { error: updateError } = await supabase.storage.updateBucket('event-images', {
        public: true
      });
      
      if (updateError) {
        results.steps.push(`Failed to update bucket: ${updateError.message}`);
        
        // Try direct SQL approach
        results.steps.push('Attempting direct SQL update...');
        try {
          const { error: sqlError } = await supabase.rpc('execute_sql', {
            sql: `
              UPDATE storage.buckets 
              SET public = true 
              WHERE name = 'event-images';
              
              -- Recreate policies
              DROP POLICY IF EXISTS "Allow public access to event-images bucket" ON storage.objects;
              CREATE POLICY "Allow public access to event-images bucket" ON storage.objects
                FOR SELECT
                USING (bucket_id = 'event-images');
              
              DROP POLICY IF EXISTS "Allow inserting objects into event-images bucket" ON storage.objects;
              CREATE POLICY "Allow inserting objects into event-images bucket" ON storage.objects
                FOR INSERT 
                WITH CHECK (bucket_id = 'event-images');
              
              DROP POLICY IF EXISTS "Allow updating event-images bucket objects" ON storage.objects;
              CREATE POLICY "Allow updating event-images bucket objects" ON storage.objects
                FOR UPDATE
                USING (bucket_id = 'event-images');
              
              DROP POLICY IF EXISTS "Allow deleting from event-images bucket" ON storage.objects;
              CREATE POLICY "Allow deleting from event-images bucket" ON storage.objects
                FOR DELETE
                USING (bucket_id = 'event-images');
              
              -- Grant privileges
              GRANT ALL PRIVILEGES ON storage.objects TO authenticated, anon, service_role;
              GRANT ALL PRIVILEGES ON storage.buckets TO authenticated, anon, service_role;
            `
          });
          
          if (sqlError) {
            results.steps.push(`SQL update failed: ${sqlError.message}`);
          } else {
            results.steps.push('SQL update successful');
          }
        } catch (err) {
          results.steps.push(`Error executing SQL: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else {
        results.steps.push('Successfully updated bucket to be public');
      }
    }
    
    // Test uploading a file to the bucket
    results.steps.push('Testing storage upload to event-images bucket...');
    
    // Create a simple text file to test with
    const testContent = 'This is a test file created at ' + new Date().toISOString();
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      results.steps.push(`Test upload failed: ${uploadError.message}`);
      
      // If the upload failed, check if it's a permissions issue
      if (uploadError.message.includes('permission') || uploadError.message.includes('access')) {
        results.steps.push('Storage permission issue detected, attempting to fix...');
        
        // Update bucket to be public
        const { error: updateError } = await supabase.storage.updateBucket('event-images', {
          public: true
        });
        
        if (updateError) {
          results.steps.push(`Failed to update bucket permissions: ${updateError.message}`);
        } else {
          results.steps.push('Updated bucket to be public');
          
          // Try upload again
          const { data: retryData, error: retryError } = await supabase.storage
            .from('event-images')
            .upload(`retry-${testFileName}`, testContent, {
              contentType: 'text/plain',
              cacheControl: '3600',
              upsert: true
            });
            
          if (retryError) {
            results.steps.push(`Retry upload also failed: ${retryError.message}`);
          } else {
            results.steps.push('Retry upload successful');
          }
        }
      }
    } else {
      results.steps.push('Test upload successful');
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(testFileName);
      
      results.steps.push(`Test file URL: ${urlData?.publicUrl || 'unknown'}`);
    }
    
    results.success = true;
    return NextResponse.json(results);
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 500 });
  }
} 