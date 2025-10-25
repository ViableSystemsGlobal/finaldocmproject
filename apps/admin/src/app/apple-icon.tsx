import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default async function AppleIcon() {
  try {
    // Create Supabase client with service role key for server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get the logo URL from tenant settings
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('logo_url, logo_black_url, name')
      .limit(1)
      .single()

    // Use primary church logo first, then black logo as fallback
    const logoUrl = settings?.logo_url || settings?.logo_black_url
    const churchName = settings?.name || 'Church'

    if (logoUrl && logoUrl.trim() !== '') {
      // Use the actual church logo
      return new ImageResponse(
        (
          <div
            style={{
              background: 'white',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '20px',
              padding: '20px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Church Logo"
              width="140"
              height="140"
              style={{
                objectFit: 'contain',
                maxWidth: '140px',
                maxHeight: '140px',
              }}
            />
          </div>
        ),
        {
          ...size,
        }
      )
    } else {
      // Fallback to church initial if no logo
      const initial = churchName.charAt(0).toUpperCase()
      
      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 100,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              color: 'white',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              borderRadius: '20px',
            }}
          >
            {initial}
          </div>
        ),
        {
          ...size,
        }
      )
    }
  } catch (error) {
    console.error('❌ Apple Icon: Error generating apple icon:', error)
    
    // Ultimate fallback
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 100,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            color: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            borderRadius: '20px',
          }}
        >
          ⛪
        </div>
      ),
      {
        ...size,
      }
    )
  }
} 