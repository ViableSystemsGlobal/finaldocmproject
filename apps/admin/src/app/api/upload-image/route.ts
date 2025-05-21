import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get the service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Do strict validation because service role has full admin access
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for server-side operations');
}

// Create a Supabase client with admin privileges
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('Server-side upload API route activated');
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contactId = formData.get('contactId') as string;
    const fileName = formData.get('fileName') as string || `${contactId}-${Date.now()}.${file.name.split('.').pop()}`;
    
    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!contactId) {
      return NextResponse.json({ error: 'No contact ID provided' }, { status: 400 });
    }
    
    console.log('Server upload request:', {
      contactId,
      fileName,
      fileType: file.type,
      fileSize: Math.round(file.size / 1024) + 'KB'
    });
    
    // Ensure the bucket exists (using admin privileges)
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const profileBucket = buckets?.find(b => b.name === 'profile-images');
      
      if (!profileBucket) {
        console.log('Creating profile-images bucket with admin privileges');
        await supabaseAdmin.storage.createBucket('profile-images', {
          public: true
        });
      }
    } catch (err) {
      console.error('Error ensuring bucket exists:', err);
      // Continue anyway, the bucket might already exist
    }
    
    // Convert the file to a Buffer (required for Node.js)
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to storage using admin privileges
    const { data, error } = await supabaseAdmin.storage
      .from('profile-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Server-side upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('profile-images')
      .getPublicUrl(fileName);
    
    // Update the contact profile with the image URL
    await supabaseAdmin
      .from('contacts')
      .update({ profile_image: urlData.publicUrl })
      .eq('id', contactId);
    
    return NextResponse.json({ 
      success: true,
      url: urlData.publicUrl,
      path: data.path
    });
  } catch (error) {
    console.error('Unhandled error in server-side upload:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown server error' 
    }, { 
      status: 500 
    });
  }
} 