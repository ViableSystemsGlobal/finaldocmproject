// Branding and logo service for mobile app
import { ADMIN_API_URL } from '@env';
import { getAdminApiUrl } from '../config/environment';

const ADMIN_API_URL_FALLBACK = ADMIN_API_URL || getAdminApiUrl();

// Updated mobile app logo from Supabase storage
const MOBILE_APP_LOGO_URL = 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1749413334725.webp';

export interface BrandingConfig {
  logoUrl: string | any; // Allow both string URLs and require() objects
  churchName: string;
  mobileLogoUrl?: string;
}

// Default fallback branding using local asset
const DEFAULT_BRANDING: BrandingConfig = {
  logoUrl: require('../../assets/icon.png'), // Use local asset as reliable default
  churchName: 'DOCM Church',
  mobileLogoUrl: undefined,
};

// Clear cache immediately to force reload with new URL
let cachedBranding: BrandingConfig | null = null;

// Helper function to resolve logo URL
const resolveLogoUrl = (logoUrl: string | undefined): string | any => {
  // Try the Supabase URL first, fallback to local asset if needed
  if (!logoUrl) return MOBILE_APP_LOGO_URL;
  
  if (logoUrl.startsWith('http')) {
    return logoUrl;
  }
  
  if (logoUrl.includes('mobile-app-icon.png') || logoUrl.startsWith('/')) {
    return MOBILE_APP_LOGO_URL;
  }
  
  return MOBILE_APP_LOGO_URL;
};

export const getBrandingConfig = async (): Promise<BrandingConfig> => {
  // Use the new Supabase logo URL directly
  const branding: BrandingConfig = {
    logoUrl: MOBILE_APP_LOGO_URL,
    churchName: 'Mobile App Admin',
    mobileLogoUrl: undefined,
  };

  console.log('📱 Using Supabase logo branding config:', {
    logoUrl: branding.logoUrl,
    churchName: branding.churchName
  });
  
  return branding;

  // Uncomment below when you want to re-enable admin API fetching:
  /*
  if (cachedBranding) {
    return cachedBranding;
  }

  try {
    const response = await fetch(`${ADMIN_API_URL}/api/tenant-settings`);
    if (!response.ok) {
      console.log('📱 Could not fetch branding from admin, using Supabase logo');
      return {
        logoUrl: MOBILE_APP_LOGO_URL,
        churchName: 'Mobile App Admin',
        mobileLogoUrl: undefined,
      };
    }

    const settings = await response.json();
    
    const branding: BrandingConfig = {
      logoUrl: resolveLogoUrl(settings.logo_mobile_url || settings.logo_url),
      churchName: settings.name || 'Mobile App Admin',
      mobileLogoUrl: settings.logo_mobile_url,
    };

    cachedBranding = branding;
    console.log('📱 Loaded branding config:', branding);
    
    return branding;
  } catch (error) {
    console.log('📱 Error fetching branding, using Supabase logo:', error);
    return {
      logoUrl: MOBILE_APP_LOGO_URL,
      churchName: 'Mobile App Admin',
      mobileLogoUrl: undefined,
    };
  }
  */
};

// Clear cache (useful for testing or when settings change)
export const clearBrandingCache = () => {
  cachedBranding = null;
}; 