/**
 * Environment Variable Validation
 * Validates required environment variables and provides helpful error messages
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Client-side accessible variables (NEXT_PUBLIC_*)
const REQUIRED_CLIENT_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
] as const;

const OPTIONAL_CLIENT_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
] as const;

// Server-side only variables (only check these on server)
const REQUIRED_SERVER_ENV_VARS = [
  // These are only available on server-side
] as const;

const OPTIONAL_SERVER_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS'
] as const;

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isClient = typeof window !== 'undefined';

  // Check required client-side variables
  REQUIRED_CLIENT_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
    } else if (value.includes('your-') || value.includes('placeholder')) {
      errors.push(`Environment variable ${varName} appears to be a placeholder value`);
    }
  });

  // Check optional client-side variables and warn if missing
  OPTIONAL_CLIENT_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      warnings.push(`Optional environment variable not set: ${varName}`);
    }
  });

  // Only check server-side variables when running on server
  if (!isClient) {
    // Check required server-side variables
    REQUIRED_SERVER_ENV_VARS.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        errors.push(`Missing required server environment variable: ${varName}`);
      } else if (value.includes('your-') || value.includes('placeholder')) {
        errors.push(`Server environment variable ${varName} appears to be a placeholder value`);
      }
    });

    // Check optional server-side variables and warn if missing
    OPTIONAL_SERVER_ENV_VARS.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        warnings.push(`Optional server environment variable not set: ${varName}`);
      }
    });
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must start with https://');
  }

  // Validate Stripe keys match (test vs live) - only on server
  if (!isClient) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const stripePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (stripeSecret && stripePublishable) {
      const secretIsTest = stripeSecret.startsWith('sk_test_');
      const publishableIsTest = stripePublishable.startsWith('pk_test_');
      if (secretIsTest !== publishableIsTest) {
        errors.push('Stripe secret and publishable keys must both be test or both be live keys');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function logEnvironmentStatus(): void {
  const isClient = typeof window !== 'undefined';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const context = isClient ? '[Client]' : '[Server]';
  
  // In development mode on client-side, just do a simple check
  if (isClient && isDevelopment) {
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (hasSupabaseUrl && hasSupabaseKey) {
      console.log(`✅ ${context} Essential environment variables loaded`);
    } else {
      console.warn(`⚠️ ${context} Environment variables loading...`);
      console.warn('  - NEXT_PUBLIC_SUPABASE_URL:', hasSupabaseUrl ? 'SET' : 'NOT SET');
      console.warn('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', hasSupabaseKey ? 'SET' : 'NOT SET');
    }
    return;
  }
  
  // Full validation for production or server-side
  const result = validateEnvironment();
  
  if (result.isValid) {
    console.log(`✅ ${context} Environment validation passed`);
    if (result.warnings.length > 0) {
      console.warn(`⚠️ ${context} Environment warnings:`);
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  } else {
    console.error(`❌ ${context} Environment validation failed:`);
    result.errors.forEach(error => console.error(`  - ${error}`));
    
    if (result.warnings.length > 0) {
      console.warn(`⚠️ ${context} Additional warnings:`);
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
}

export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasSupabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasStripe: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    hasGoogleMaps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    hasEmail: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, ''), // Remove trailing slashes
  };
} 