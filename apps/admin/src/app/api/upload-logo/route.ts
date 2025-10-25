import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('Logo upload API route activated');
    
    // Get the service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    // Check credentials
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials:', {
        url: supabaseUrl ? 'Set' : 'Not set',
        serviceKey: supabaseServiceKey ? 'Set' : 'Not set'
      });
      return NextResponse.json({ 
        error: 'Missing Supabase credentials for server-side operations' 
      }, { 
        status: 500 
      });
    }

    // Create a Supabase client with admin privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucketName = 'church-logos';
    
    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `logo-${timestamp}.${extension}`;
    
    console.log('Logo upload request:', {
      fileName,
      fileType: file.type,
      fileSize: Math.round(file.size / 1024) + 'KB'
    });
    
    // Ensure the bucket exists (using admin privileges)
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const logoBucket = buckets?.find(b => b.name === bucketName);
      
      if (!logoBucket) {
        console.log('Creating church-logos bucket with admin privileges');
        const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true
        });
        
        if (bucketError) {
          console.error('Error creating bucket:', bucketError);
          return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 });
        }
      }
    } catch (err) {
      console.error('Error ensuring bucket exists:', err);
      return NextResponse.json({ error: 'Failed to access storage' }, { status: 500 });
    }
    
    // Convert the file to a Buffer (required for Node.js)
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to storage using admin privileges
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Logo upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log('Logo uploaded successfully:', {
      path: data.path,
      url: urlData.publicUrl
    });
    
    return NextResponse.json({ 
      success: true,
      url: urlData.publicUrl,
      path: data.path
    });
  } catch (error) {
    console.error('Unhandled error in logo upload:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown server error' 
    }, { 
      status: 500 
    });
  }
} 