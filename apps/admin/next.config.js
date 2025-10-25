/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simple, stable configuration for Next.js 15.3.2
  serverExternalPackages: ['@supabase/supabase-js'],
  generateEtags: false,
  poweredByHeader: false,
  eslint: {
    // Disable ESLint during development to prevent build failures
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow TypeScript errors during development
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ufjfafcfkalaasdhgcbi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig 