// YouTube API service for extracting video metadata
// Supports multiple extraction methods with fallbacks

export interface YouTubeVideoInfo {
  title: string
  description: string
  duration: string
  thumbnail: string
  publishedAt: string
  channelTitle: string
  tags: string[]
  viewCount?: number
  likeCount?: number
  categoryId?: string
}

export interface YouTubeExtractResult {
  success: boolean
  data?: YouTubeVideoInfo
  error?: string
  method?: 'api' | 'oembed' | 'scrape'
}

// Extract YouTube video ID from various URL formats
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

// Method 1: YouTube Data API v3 (requires API key)
async function extractWithAPI(videoId: string, apiKey?: string): Promise<YouTubeExtractResult> {
  if (!apiKey) {
    return { success: false, error: 'YouTube API key not configured' }
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`
    )
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'Video not found' }
    }
    
    const video = data.items[0]
    const snippet = video.snippet
    const contentDetails = video.contentDetails
    const statistics = video.statistics
    
    // Convert ISO 8601 duration to readable format
    const duration = parseDuration(contentDetails.duration)
    
    return {
      success: true,
      method: 'api',
      data: {
        title: snippet.title,
        description: snippet.description,
        duration,
        thumbnail: snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
        publishedAt: snippet.publishedAt,
        channelTitle: snippet.channelName,
        tags: snippet.tags || [],
        viewCount: parseInt(statistics.viewCount || '0'),
        likeCount: parseInt(statistics.likeCount || '0'),
        categoryId: snippet.categoryId
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: `API extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Method 2: YouTube oEmbed API (no API key needed)
async function extractWithOEmbed(videoId: string): Promise<YouTubeExtractResult> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    )
    
    if (!response.ok) {
      throw new Error(`oEmbed API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      method: 'oembed',
      data: {
        title: data.title,
        description: '',
        duration: '',
        thumbnail: data.thumbnail_url,
        publishedAt: '',
        channelTitle: data.author_name,
        tags: []
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: `oEmbed extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Method 3: Web scraping fallback for better data extraction
async function extractWithScraping(videoId: string): Promise<YouTubeExtractResult> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Scraping failed: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : ''
    
    // Extract description from meta tag
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
    let description = descMatch ? descMatch[1] : ''
    
    // Try alternative description extraction from JSON-LD
    if (!description) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/)
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1])
          if (jsonData.description) {
            description = jsonData.description
          }
        } catch (e) {
          // JSON parsing failed, continue
        }
      }
    }
    
    // Try extracting from ytInitialPlayerResponse
    if (!description) {
      const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/)
      if (playerResponseMatch) {
        try {
          const playerData = JSON.parse(playerResponseMatch[1])
          const videoDetails = playerData?.videoDetails
          if (videoDetails?.shortDescription) {
            description = videoDetails.shortDescription
          }
        } catch (e) {
          // JSON parsing failed, continue
        }
      }
    }
    
    // Extract thumbnail
    let thumbnail = ''
    const thumbMatch = html.match(/"thumbnail":\{"thumbnails":\[.*?"url":"([^"]+)"/)
    if (thumbMatch) {
      thumbnail = thumbMatch[1]
    } else {
      // Fallback to standard YouTube thumbnail
      thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }
    
    // Extract channel name
    const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/) || 
                        html.match(/"author":"([^"]+)"/)
    const channelTitle = channelMatch ? channelMatch[1] : ''
    
    // Extract duration from JSON data
    let duration = ''
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/)
    if (durationMatch) {
      const seconds = parseInt(durationMatch[1])
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    
    // Extract tags/keywords
    const tags: string[] = []
    const keywordsMatch = html.match(/"keywords":\[([^\]]+)\]/)
    if (keywordsMatch) {
      try {
        const keywordsArray = JSON.parse(`[${keywordsMatch[1]}]`)
        tags.push(...keywordsArray.slice(0, 5)) // Take first 5 tags
      } catch (e) {
        // Failed to parse keywords
      }
    }
    
    return {
      success: true,
      method: 'scrape',
      data: {
        title,
        description,
        duration,
        thumbnail,
        publishedAt: '',
        channelTitle,
        tags
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Scraping extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Main extraction function with enhanced fallbacks
export async function extractYouTubeInfo(url: string): Promise<YouTubeExtractResult> {
  const videoId = extractVideoId(url)
  
  if (!videoId) {
    return { success: false, error: 'Invalid YouTube URL' }
  }
  
  // Try scraping first for better data (including description)
  const scrapeResult = await extractWithScraping(videoId)
  if (scrapeResult.success && scrapeResult.data?.description) {
    return scrapeResult
  }
  
  // Fallback to oEmbed for basic info
  const oembedResult = await extractWithOEmbed(videoId)
  if (oembedResult.success) {
    // If scraping got some data but failed, merge the results
    if (scrapeResult.success && scrapeResult.data) {
      return {
        success: true,
        method: 'scrape',
        data: {
          title: scrapeResult.data.title || oembedResult.data!.title,
          description: scrapeResult.data.description || '',
          duration: scrapeResult.data.duration || '',
          thumbnail: scrapeResult.data.thumbnail || oembedResult.data!.thumbnail,
          publishedAt: scrapeResult.data.publishedAt || '',
          channelTitle: scrapeResult.data.channelTitle || oembedResult.data!.channelTitle,
          tags: scrapeResult.data.tags || []
        }
      }
    }
    return oembedResult
  }
  
  return { 
    success: false, 
    error: 'All extraction methods failed' 
  }
}

// Utility function to parse ISO 8601 duration (PT4M13S -> "4:13")
function parseDuration(isoDuration: string): string {
  if (!isoDuration) return ''
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ''
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

// Utility function to format date
export function formatPublishedDate(isoDate: string): string {
  if (!isoDate) return ''
  
  try {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return ''
  }
}

// Validate YouTube URL
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null
} 