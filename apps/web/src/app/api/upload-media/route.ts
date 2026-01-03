import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { 
  validateFileUpload, 
  ALLOWED_FILE_TYPES, 
  ALLOWED_EXTENSIONS, 
  MAX_FILE_SIZES,
  sanitizeFileName,
  sanitizeString,
  rateLimit,
  getClientIP
} from '@/lib/security'
import { requireAPIKey } from '@/lib/auth-middleware'

// Lazy initialization of admin client to avoid build-time errors
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// GET method to fetch existing media items
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`media-get-${clientIP}`, 30, 60000) // 30 requests per minute
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    console.log('=== Media Fetch from upload-media route ===')
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Fetch media items using admin client (bypasses RLS)
    const { data: mediaData, error: mediaError } = await supabaseAdmin
      .from('media_library')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(100) // Limit results to prevent abuse
    
    if (mediaError) {
      console.error('Media fetch error:', mediaError)
      return NextResponse.json({ 
        success: false, 
        data: null,
        error: mediaError
      })
    }
    
    console.log('✅ Media fetch successful:', mediaData?.length || 0, 'items')
    
    return NextResponse.json({ 
      success: true, 
      data: mediaData,
      error: null
    }, {
      headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    })
    
  } catch (error) {
    console.error('Media fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require API key for uploads
    const authError = requireAPIKey(request)
    if (authError) {
      return authError
    }

    // Rate limiting - stricter for uploads
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`media-upload-${clientIP}`, 10, 60000) // 10 uploads per minute
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    console.log('=== Server-side media upload started ===')
    
    const supabaseAdmin = getSupabaseAdmin()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // SECURITY: Validate file upload
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determine allowed types based on file category
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    let allowedTypes: string[]
    let maxSize: number
    let allowedExtensions: string[]
    
    if (isImage) {
      allowedTypes = ALLOWED_FILE_TYPES.images
      maxSize = MAX_FILE_SIZES.image
      allowedExtensions = ALLOWED_EXTENSIONS.images
    } else if (isVideo) {
      allowedTypes = ALLOWED_FILE_TYPES.videos
      maxSize = MAX_FILE_SIZES.video
      allowedExtensions = ALLOWED_EXTENSIONS.videos
    } else {
      return NextResponse.json(
        { error: 'File type not allowed. Only images and videos are accepted.' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFileUpload(file, allowedTypes, maxSize, allowedExtensions)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    // Sanitize inputs
    const altText = sanitizeString((formData.get('altText') as string) || '', 500)
    const collectionName = formData.get('collectionName') ? sanitizeString(formData.get('collectionName') as string, 200) : null
    const collectionCategory = formData.get('collectionCategory') ? sanitizeString(formData.get('collectionCategory') as string, 200) : null
    const collectionDate = formData.get('collectionDate') as string || null
    const description = formData.get('description') ? sanitizeString(formData.get('description') as string, 2000) : null
    
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    })
    
    // SECURITY: Sanitize filename and generate unique name
    const sanitizedName = sanitizeFileName(file.name)
    const fileExt = sanitizedName.split('.').pop()?.toLowerCase() || 'bin'
    
    // Only allow safe extensions
    if (!allowedExtensions.includes(`.${fileExt}`)) {
      return NextResponse.json(
        { error: `File extension .${fileExt} is not allowed` },
        { status: 400 }
      )
    }
    
    const fileName = `${uuidv4()}.${fileExt}`
    
    console.log('Generated filename:', fileName)
    
    // Ensure the bucket exists using admin privileges
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      const uploadmediaBucket = buckets?.find(b => b.name === 'uploadmedia')
      
      if (!uploadmediaBucket) {
        console.log('Creating uploadmedia bucket with admin privileges')
        const { error: bucketError } = await supabaseAdmin.storage.createBucket('uploadmedia', {
          public: true
        })
        
        if (bucketError) {
          console.error('Error creating bucket:', bucketError)
          return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 })
        }
        console.log('Bucket created successfully')
      } else {
        console.log('Bucket already exists')
      }
    } catch (err) {
      console.error('Error ensuring bucket exists:', err)
      return NextResponse.json({ error: 'Failed to access storage' }, { status: 500 })
    }
    
    // Convert the file to a Buffer for upload
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload using admin privileges
    console.log('Uploading file...')
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('uploadmedia')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }
    
    console.log('File uploaded successfully:', uploadData)
    
    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('uploadmedia')
      .getPublicUrl(fileName)
    
    if (!urlData?.publicUrl) {
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
    }
    
    // Determine file type
    const fileType = file.type.split('/')[0] // 'image', 'video', 'application', etc.
    
    // Insert into media_library using admin privileges
    console.log('Saving to database...')
    console.log('Insert data:', {
      url: urlData.publicUrl,
      type: fileType,
      alt_text: altText,
      collection_name: collectionName,
      collection_category: collectionCategory,
      collection_date: collectionDate,
      description: description
    })
    
    const { data: mediaData, error: dbError } = await supabaseAdmin
      .from('media_library')
      .insert({
        url: urlData.publicUrl,
        type: fileType,
        alt_text: altText,
        collection_name: collectionName,
        collection_category: collectionCategory,
        collection_date: collectionDate,
        description: description
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('❌ Database insertion error details:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
        full_error: dbError
      })
      return NextResponse.json({ 
        error: `Database error: ${dbError.message}`,
        details: dbError,
        success: false
      }, { status: 500 })
    }
    
    console.log('Media saved successfully:', mediaData)
    
    return NextResponse.json({ 
      success: true,
      data: mediaData,
      message: `${fileType === 'video' ? 'Video' : 'File'} uploaded successfully`
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    })
    
  } catch (error) {
    console.error('Unhandled error in media upload:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown server error' 
    }, { 
      status: 500 
    })
  }
} 