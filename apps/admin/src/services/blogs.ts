import { supabase } from '@/lib/supabase'

export interface Blog {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image?: string
  author: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  tags: string[]
  seo_meta: {
    title?: string
    description?: string
    keywords?: string[]
  }
  created_at: string
  updated_at: string
}

export interface BlogsResponse {
  data: Blog[] | null
  error: any
  count?: number
}

export interface BlogResponse {
  data: Blog | null
  error: any
}

// Fetch all blogs with pagination and filtering
export async function fetchBlogs(
  page: number = 1, 
  limit: number = 10,
  status?: string,
  searchQuery?: string
): Promise<BlogsResponse> {
  try {
    let query = supabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, error, count } = await query

    return { data, error, count: count || 0 }
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return { data: null, error }
  }
}

// Fetch single blog by ID
export async function fetchBlog(id: string): Promise<BlogResponse> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error fetching blog:', error)
    return { data: null, error }
  }
}

// Fetch blog by slug
export async function fetchBlogBySlug(slug: string): Promise<BlogResponse> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error fetching blog by slug:', error)
    return { data: null, error }
  }
}

// Create new blog
export async function createBlog(blogData: Omit<Blog, 'id' | 'created_at' | 'updated_at'>): Promise<BlogResponse> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .insert({
        ...blogData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error creating blog:', error)
    return { data: null, error }
  }
}

// Update blog
export async function updateBlog(id: string, blogData: Partial<Omit<Blog, 'id' | 'created_at'>>): Promise<BlogResponse> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .update({
        ...blogData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error updating blog:', error)
    return { data: null, error }
  }
}

// Delete blog
export async function deleteBlog(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id)

    return { error }
  } catch (error) {
    console.error('Error deleting blog:', error)
    return { error }
  }
}

// Publish blog
export async function publishBlog(id: string): Promise<BlogResponse> {
  return updateBlog(id, { 
    status: 'published', 
    published_at: new Date().toISOString() 
  })
}

// Unpublish blog
export async function unpublishBlog(id: string): Promise<BlogResponse> {
  return updateBlog(id, { 
    status: 'draft', 
    published_at: null 
  })
}

// Archive blog
export async function archiveBlog(id: string): Promise<BlogResponse> {
  return updateBlog(id, { status: 'archived' })
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

// Get blog metrics
export async function getBlogMetrics() {
  try {
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('status, created_at')

    if (error) throw error

    const totalBlogs = blogs?.length || 0
    const publishedBlogs = blogs?.filter(blog => blog.status === 'published').length || 0
    const draftBlogs = blogs?.filter(blog => blog.status === 'draft').length || 0
    const archivedBlogs = blogs?.filter(blog => blog.status === 'archived').length || 0

    // Recent blogs (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentBlogs = blogs?.filter(blog => 
      new Date(blog.created_at) > thirtyDaysAgo
    ).length || 0

    return {
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      archivedBlogs,
      recentBlogs
    }
  } catch (error) {
    console.error('Error fetching blog metrics:', error)
    return {
      totalBlogs: 0,
      publishedBlogs: 0,
      draftBlogs: 0,
      archivedBlogs: 0,
      recentBlogs: 0
    }
  }
} 