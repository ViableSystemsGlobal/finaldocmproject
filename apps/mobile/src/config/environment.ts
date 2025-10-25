// Environment configuration for mobile app
// Update these values based on your setup

export const config = {
  // Admin API URL - Update for production
  // For production, use your domain: https://admin.docmchurch.org
  // For development, use local IP: http://192.168.0.28:3003
  ADMIN_API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://admin.docmchurch.org' 
    : 'http://192.168.0.28:3003',
  
  // Supabase configuration - Using actual credentials from .env
  SUPABASE_URL: 'https://ufjfafcfkalaasdhgcbi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ3MTMsImV4cCI6MjA2MzI5MDcxM30.PzwQAeRUJDK8llZf0awLwgW6j-pAmZPOgz55USsOnyo',
  
  // Google Maps API Key
  GOOGLE_MAPS_API_KEY: 'AIzaSyBzrY9ppQ9LhCbAKDU-L8cmUHaI23cAZkQ',
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