/**
 * Centralized app configuration.
 *
 * All keys are read from environment variables injected at build time via EAS Secrets.
 * Nothing is hardcoded here. To run locally, create a .env file in frontend/ and
 * populate it using env.example as a template.
 *
 * EAS Secrets: https://docs.expo.dev/build-reference/variables/
 */

// ---------------------------------------------------------------------------
// Keys & endpoints
// ---------------------------------------------------------------------------

export const CONFIG = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    storageBucket: 'lure-images',
  },

  revenueCat: {
    iosProductionKey: process.env.EXPO_PUBLIC_RC_IOS_PRODUCTION_KEY ?? '',
    androidProductionKey: process.env.EXPO_PUBLIC_RC_ANDROID_PRODUCTION_KEY ?? '',
    testKey: process.env.EXPO_PUBLIC_RC_TEST_KEY ?? '',
  },

  backend: {
    url: process.env.EXPO_PUBLIC_BACKEND_URL ?? '',
  },
};

// ---------------------------------------------------------------------------
// App constants (not secrets — safe to keep here)
// ---------------------------------------------------------------------------

export const SUBSCRIPTION = {
  entitlementId: 'MyTackleBox Pro',
  freeTierLimit: 10,
  productIds: {
    monthly: 'monthly_pro',
    yearly: 'yearly_pro',
  },
};

// ---------------------------------------------------------------------------
// Startup validation — warns loudly in dev if keys are missing
// ---------------------------------------------------------------------------

const REQUIRED_KEYS = [
  ['CONFIG.supabase.url', CONFIG.supabase.url],
  ['CONFIG.supabase.anonKey', CONFIG.supabase.anonKey],
  ['CONFIG.backend.url', CONFIG.backend.url],
];

if (__DEV__) {
  REQUIRED_KEYS.forEach(([name, value]) => {
    if (!value) {
      console.warn(`[config] Missing env var for ${name}. Check your .env file.`);
    }
  });
}
