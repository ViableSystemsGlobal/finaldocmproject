import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface MediaItem {
  collection_name: string
  collection_category: string
  collection_date: string
  description: string
  type: string
  url: string
  uploaded_at: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'photo', 'video', 'mixed'
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortOrder = searchParams.get('sort') || 'newest' // 'newest', 'oldest', 'most_photos', 'alphabetical'

    // Base query to get collections grouped by collection_name
    let query = supabaseAdmin
      .from('media_library')
      .select(`
        collection_name,
        collection_category,
        collection_date,
        description,
        type,
        url,
        uploaded_at
      `)
      .filter('collection_name', 'not.is', null)

    // Filter by media type
    if (type && type !== 'mixed') {
      query = query.eq('type', type)
    }

    // Filter by category
    if (category) {
      query = query.eq('collection_category', category)
    }

    const { data: mediaData, error } = await query
    
    if (error) {
      console.error('Error fetching media collections:', error)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }

    // Group media by collection_name
    const collectionsMap = new Map()

    mediaData?.forEach((item: MediaItem) => {
      const collectionName = item.collection_name
      
      if (!collectionsMap.has(collectionName)) {
        collectionsMap.set(collectionName, {
          id: collectionName.toLowerCase().replace(/\s+/g, '-'),
          title: collectionName,
          category: item.collection_category,
          date: item.collection_date,
          description: item.description,
          photo_count: 0,
          video_count: 0,
          cover_image: null,
          media_urls: [],
          created_at: item.uploaded_at
        })
      }

      const collection = collectionsMap.get(collectionName)
      
      // Count media types
      if (item.type === 'image') {
        collection.photo_count++
        // Use first image as cover if none set
        if (!collection.cover_image) {
          collection.cover_image = item.url
        }
      } else if (item.type === 'video') {
        collection.video_count++
        // Use first video as cover if no image cover
        if (!collection.cover_image && collection.photo_count === 0) {
          collection.cover_image = item.url
        }
      }
      
      collection.media_urls.push(item.url)
      
      // Update created_at to be the earliest upload date
      if (new Date(item.uploaded_at) < new Date(collection.created_at)) {
        collection.created_at = item.uploaded_at
      }
    })

    // Convert map to array
    let collections = Array.from(collectionsMap.values())

    // Sort collections
    switch (sortOrder) {
      case 'oldest':
        collections.sort((a, b) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime())
        break
      case 'most_photos':
        collections.sort((a, b) => (b.photo_count + b.video_count) - (a.photo_count + a.video_count))
        break
      case 'alphabetical':
        collections.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'newest':
      default:
        collections.sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
        break
    }

    // Limit results
    collections = collections.slice(0, limit)

    return NextResponse.json({
      success: true,
      collections,
      total: collections.length
    })

  } catch (error) {
    console.error('Unhandled error in collections API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    )
  }
} 