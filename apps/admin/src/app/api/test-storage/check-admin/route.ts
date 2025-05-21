import { NextResponse } from 'next/server';

export async function GET() {
  const results = {
    success: false,
    issues: [] as string[],
    config: {} as Record<string, any>
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Check environment variables
    if (!supabaseUrl) {
      results.issues.push('NEXT_PUBLIC_SUPABASE_URL is not set');
    } else {
      results.config.url = supabaseUrl;
    }
    
    if (!supabaseKey) {
      results.issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    } else {
      // Only show first and last few characters for security
      const keyLength = supabaseKey.length;
      results.config.key = `${supabaseKey.substring(0, 4)}...${supabaseKey.substring(keyLength - 4)}`;
    }
    
    // Check URL format
    if (supabaseUrl) {
      try {
        new URL(supabaseUrl);
      } catch (e) {
        results.issues.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
      }
      
      if (!supabaseUrl.startsWith('https://')) {
        results.issues.push('NEXT_PUBLIC_SUPABASE_URL should start with https://');
      }
    }
    
    // Try to fetch project settings anonymously
    if (supabaseUrl) {
      try {
        const metadataUrl = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
        const response = await fetch(metadataUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey || '',
          },
        });
        
        results.config.apiStatus = response.status;
        
        if (!response.ok) {
          results.issues.push(`API request failed with status ${response.status}`);
          const text = await response.text();
          results.config.apiResponse = text.substring(0, 100); // Limit length
        } else {
          results.config.apiAccessible = true;
        }
      } catch (e) {
        results.issues.push(`Failed to connect to Supabase API: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
    
    // Check CORS settings
    if (supabaseUrl) {
      try {
        const corsResponse = await fetch(`${supabaseUrl}/storage/v1/object/info/dummy`, {
          method: 'OPTIONS',
        });
        
        results.config.corsStatus = corsResponse.status;
        
        // Check for Access-Control-Allow-Origin header
        const corsHeader = corsResponse.headers.get('Access-Control-Allow-Origin');
        results.config.corsHeader = corsHeader;
        
        if (!corsHeader) {
          results.issues.push('CORS headers not properly configured');
        }
      } catch (e) {
        results.issues.push(`Failed to check CORS settings: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
    
    results.success = results.issues.length === 0;
    
    return NextResponse.json(results);
  } catch (error) {
    results.issues.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(results, { status: 500 });
  }
} 