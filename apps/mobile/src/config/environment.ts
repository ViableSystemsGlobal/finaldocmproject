// Environment configuration for mobile app
// ⚠️  SECURITY: Use environment variables, not hardcoded values

export const config = {
  // Admin API URL - Update for production
  // For production, use your domain: https://admin.docmchurch.org
  // For development, use local IP: http://192.168.0.28:3003
  ADMIN_API_URL: process.env.EXPO_PUBLIC_ADMIN_API_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://admin.docmchurch.org' 
    : 'http://192.168.0.28:3003'),
  
  // Supabase configuration - Load from environment variables
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Google Maps API Key - Load from environment variables
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
}

// Helper to get admin API URL with fallback
export const getAdminApiUrl = (): string => {
  return config.ADMIN_API_URL || 'http://192.168.0.28:3003'
}

// Helper to get Supabase configuration
export const getSupabaseConfig = () => {
  return {
    url: config.SUPABASE_URL,
    anonKey: config.SUPABASE_ANON_KEY,
  }
} 

// Production environment helper
export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
} 