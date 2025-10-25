import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `footer-logo-${uuidv4()}.${fileExt}`
    const bucketName = 'footer-assets'
    
    console.log('Footer logo upload request:', {
      fileName,
      fileType: file.type,
      fileSize: Math.round(file.size / 1024) + 'KB'
    })
    
    // Ensure the bucket exists (using admin privileges)
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      const footerBucket = buckets?.find(b => b.name === bucketName)
      
      if (!footerBucket) {
        console.log('Creating footer-assets bucket with admin privileges')
        const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true
        })
        
        if (bucketError) {
          console.error('Error creating bucket:', bucketError)
          return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 })
        }
      }
    } catch (err) {
      console.error('Error ensuring bucket exists:', err)
      return NextResponse.json({ error: 'Failed to access storage' }, { status: 500 })
    }
    
    // Convert the file to a Buffer (required for Node.js)
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to storage using admin privileges
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) {
      console.error('Footer logo upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName)
    
    console.log('Footer logo uploaded successfully:', {
      path: data.path,
      url: urlData.publicUrl
    })
    
    return NextResponse.json({ 
      success: true,
      url: urlData.publicUrl,
      path: data.path
    })
    
  } catch (error) {
    console.error('Unhandled error in footer logo upload:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown server error' 
    }, { 
      status: 500 
    })
  }
} 