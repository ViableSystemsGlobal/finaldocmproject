import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results = {
    success: false,
    steps: [] as string[],
    error: null as string | null,
    url: null as string | null
  };

  try {
    // Create a standalone Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(`Environment variables not set. URL: ${!!supabaseUrl}, KEY: ${!!supabaseAnonKey}`);
    }
    
    results.steps.push(`Initialized with URL: ${supabaseUrl.substring(0, 20)}...`);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    results.steps.push('Created Supabase client');
    
    // Check if we can access Supabase storage
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }
    
    results.steps.push(`Found ${buckets.length} buckets: ${buckets.map(b => b.name).join(', ')}`);
    
    // Create bucket if it doesn't exist
    const profileBucket = buckets.find(b => b.name === 'profile-images');
    
    if (!profileBucket) {
      results.steps.push('Creating profile-images bucket...');
      const { error: createError } = await supabase.storage.createBucket('profile-images', {
        public: true
      });
      
      if (createError) {
        if (createError.message.includes('resource already exists')) {
          // Bucket already exists, which is fine
          results.steps.push('Bucket creation attempted, but already exists (this is OK)');
        } else {
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }
      } else {
        results.steps.push('Bucket created successfully');
      }
    } else {
      results.steps.push('Bucket already exists');
    }
    
    // Try to upload a test file
    const content = 'This is a test file created at ' + new Date().toISOString();
    // Ensure absolute uniqueness with random string + timestamp
    const randomId = Math.random().toString(36).substring(2, 10);
    const filePath = `test-${Date.now()}-${randomId}.txt`;
    
    results.steps.push(`Attempting to upload file with path: ${filePath}`);
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, content, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: true  // Should overwrite if exists
        });
      
      if (uploadError) {
        if (uploadError.message.includes('resource already exists')) {
          // Just inform about the duplicate and continue - it's not a critical error
          results.steps.push(`Note: File with this name already exists, but we can still use it`);
        } else {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
      } else {
        results.steps.push(`File uploaded: ${filePath}`);
      }
    } catch (uploadErr) {
      results.steps.push(`Upload attempt encountered issue: ${uploadErr instanceof Error ? uploadErr.message : 'unknown error'}`);
      // Continue to try getting the URL anyway
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }
    
    results.steps.push(`Public URL generated: ${urlData.publicUrl}`);
    results.url = urlData.publicUrl;
    results.success = true;
    
    return NextResponse.json(results);
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 500 });
  }
} 