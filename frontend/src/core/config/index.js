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

  // Injected into native Android config via app.config.js (Maps SDK). Not used in JS at runtime.
  googleMaps: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  },
};

// ---------------------------------------------------------------------------
// App constants (not secrets — safe to keep here)
// ---------------------------------------------------------------------------

export const AUTH = {
  // Password reset redirects here after the user clicks the email link.
  // Must also be allowlisted in Supabase: Authentication → URL Configuration → Redirect URLs.
  passwordResetRedirectUrl: process.env.EXPO_PUBLIC_PASSWORD_RESET_URL ?? '',
  // Signup confirmation email opens this branded page (host confirm-email-success.html).
  emailConfirmRedirectUrl: process.env.EXPO_PUBLIC_EMAIL_CONFIRM_REDIRECT_URL ?? '',
};

/** Public legal URLs (App Store 3.1.2 — must appear in the subscription purchase UI). */
export const LEGAL = {
  privacyPolicyUrl:
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ??
    'https://sameasabove.github.io/fishing-lure-classifier/backend/PRIVACY_POLICY.html',
  termsOfUseUrl:
    process.env.EXPO_PUBLIC_TERMS_OF_USE_URL ??
    'https://sameasabove.github.io/fishing-lure-classifier/backend/TERMS_OF_SERVICE.html',
};

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
