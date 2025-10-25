import { NextResponse } from 'next/server'

export async function GET() {
  // Create a simple SVG logo as default
  const svg = `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="12" fill="#3B82F6"/>
      <path d="M32 8L39.09 22.26L56 24.27L44 35.14L47.18 52.02L32 43.77L16.82 52.02L20 35.14L8 24.27L24.91 22.26L32 8Z" fill="white"/>
      <circle cx="32" cy="32" r="3" fill="#3B82F6"/>
    </svg>
  `

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
} 