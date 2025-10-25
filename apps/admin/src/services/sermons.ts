import { supabase } from '@/lib/supabase'

export interface Sermon {
  id: string
  title: string
  slug: string
  description: string
  speaker: string
  series?: string
  scripture_reference?: string
  sermon_date: string
  duration?: number // in minutes
  video_type: 'upload' | 'youtube'
  video_url?: string // For uploaded videos
  youtube_url?: string // For YouTube links
  youtube_id?: string // Extracted YouTube video ID
  audio_url?: string
  thumbnail_image?: string
  transcript?: string
  notes?: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  view_count: number
  seo_meta: {
    title?: string
    description?: string
    keywords?: string[]
  }
  created_at: string
  updated_at: string
}

export interface SermonsResponse {
  data: Sermon[] | null
  error: any
  count?: number
}

export interface SermonResponse {
  data: Sermon | null
  error: any
}

// Extract YouTube video ID from URL
export function extractYouTubeId(url: string): string | null {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Generate YouTube embed URL
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

// Generate YouTube thumbnail URL
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`
}

// Fetch all sermons with pagination and filtering
export async function fetchSermons(
  page: number = 1,
  limit: number = 10,
  status?: string,
  searchQuery?: string,
  series?: string
): Promise<SermonsResponse> {
  try {
    let query = supabase
      .from('sermons')
      .select('*', { count: 'exact' })
      .order('sermon_date', { ascending: false })

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply series filter
    if (series && series !== 'all') {
      query = query.eq('series', series)
    }

    // Apply search filter
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,speaker.ilike.%${searchQuery}%,scripture_reference.ilike.%${searchQuery}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, error, count } = await query

    return { data, error, count: count || 0 }
  } catch (error) {
    console.error('Error fetching sermons:', error)
    return { data: null, error }
  }
}

// Fetch single sermon by ID
export async function fetchSermon(id: string): Promise<SermonResponse> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error fetching sermon:', error)
    return { data: null, error }
  }
}

// Fetch sermon by slug
export async function fetchSermonBySlug(slug: string): Promise<SermonResponse> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('slug', slug)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error fetching sermon by slug:', error)
    return { data: null, error }
  }
}

// Create new sermon
export async function createSermon(sermonData: Omit<Sermon, 'id' | 'created_at' | 'updated_at' | 'view_count'>): Promise<SermonResponse> {
  try {
    // Process YouTube URL if provided
    let processedData = { ...sermonData }
    if (sermonData.video_type === 'youtube' && sermonData.youtube_url) {
      const youtubeId = extractYouTubeId(sermonData.youtube_url)
      if (youtubeId) {
        processedData.youtube_id = youtubeId
        // Auto-generate thumbnail if not provided
        if (!processedData.thumbnail_image) {
          processedData.thumbnail_image = getYouTubeThumbnail(youtubeId)
        }
      }
    }

    const { data, error } = await supabase
      .from('sermons')
      .insert({
        ...processedData,
        view_count: 0,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error creating sermon:', error)
    return { data: null, error }
  }
}

// Update sermon
export async function updateSermon(id: string, sermonData: Partial<Omit<Sermon, 'id' | 'created_at'>>): Promise<SermonResponse> {
  try {
    // Process YouTube URL if provided
    let processedData = { ...sermonData }
    if (sermonData.video_type === 'youtube' && sermonData.youtube_url) {
      const youtubeId = extractYouTubeId(sermonData.youtube_url)
      if (youtubeId) {
        processedData.youtube_id = youtubeId
        // Auto-generate thumbnail if not provided
        if (!processedData.thumbnail_image) {
          processedData.thumbnail_image = getYouTubeThumbnail(youtubeId)
        }
      }
    }

    const { data, error } = await supabase
      .from('sermons')
      .update({
        ...processedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error updating sermon:', error)
    return { data: null, error }
  }
}

// Delete sermon
export async function deleteSermon(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('sermons')
      .delete()
      .eq('id', id)

    return { error }
  } catch (error) {
    console.error('Error deleting sermon:', error)
    return { error }
  }
}

// Publish sermon
export async function publishSermon(id: string): Promise<SermonResponse> {
  return updateSermon(id, {
    status: 'published',
    published_at: new Date().toISOString()
  })
}

// Unpublish sermon
export async function unpublishSermon(id: string): Promise<SermonResponse> {
  return updateSermon(id, {
    status: 'draft',
    published_at: null
  })
}

// Archive sermon
export async function archiveSermon(id: string): Promise<SermonResponse> {
  return updateSermon(id, { status: 'archived' })
}

// Increment view count
export async function incrementSermonViews(id: string): Promise<SermonResponse> {
  try {
    const { data, error } = await supabase.rpc('increment_sermon_views', { sermon_id: id })
    return { data, error }
  } catch (error) {
    console.error('Error incrementing sermon views:', error)
    return { data: null, error }
  }
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

// Get unique sermon series
export async function getSermonSeries(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('series')
      .not('series', 'is', null)
      .not('series', 'eq', '')

    if (error) throw error

    // Extract unique series names
    const seriesSet = new Set(data?.map(sermon => sermon.series).filter(Boolean))
    const uniqueSeries = Array.from(seriesSet) as string[]
    return uniqueSeries.sort()
  } catch (error) {
    console.error('Error fetching sermon series:', error)
    return []
  }
}

// Get sermon metrics
export async function getSermonMetrics() {
  try {
    const { data: sermons, error } = await supabase
      .from('sermons')
      .select('status, created_at, view_count, video_type')

    if (error) throw error

    const totalSermons = sermons?.length || 0
    const publishedSermons = sermons?.filter(sermon => sermon.status === 'published').length || 0
    const draftSermons = sermons?.filter(sermon => sermon.status === 'draft').length || 0
    const archivedSermons = sermons?.filter(sermon => sermon.status === 'archived').length || 0
    const totalViews = sermons?.reduce((sum, sermon) => sum + (sermon.view_count || 0), 0) || 0
    const youtubeSermons = sermons?.filter(sermon => sermon.video_type === 'youtube').length || 0
    const uploadSermons = sermons?.filter(sermon => sermon.video_type === 'upload').length || 0

    // Recent sermons (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentSermons = sermons?.filter(sermon =>
      new Date(sermon.created_at) > thirtyDaysAgo
    ).length || 0

    return {
      totalSermons,
      publishedSermons,
      draftSermons,
      archivedSermons,
      recentSermons,
      totalViews,
      youtubeSermons,
      uploadSermons
    }
  } catch (error) {
    console.error('Error fetching sermon metrics:', error)
    return {
      totalSermons: 0,
      publishedSermons: 0,
      draftSermons: 0,
      archivedSermons: 0,
      recentSermons: 0,
      totalViews: 0,
      youtubeSermons: 0,
      uploadSermons: 0
    }
  }
} 