/**
 * Tests for core/config/index.js
 *
 * Key things we're verifying:
 *   1. CONFIG and SUBSCRIPTION export the correct shape
 *   2. Missing env vars default to '' (not undefined/null — would crash createClient)
 *   3. Values are actually read from process.env, not hardcoded
 *   4. SUBSCRIPTION constants match what RevenueCat and the backend expect
 */

const ORIGINAL_ENV = process.env;

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
});

beforeEach(() => {
  jest.resetModules();
  // Start each test with a clean env — no EXPO_PUBLIC_* vars set
  process.env = { ...ORIGINAL_ENV };
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.EXPO_PUBLIC_BACKEND_URL;
  delete process.env.EXPO_PUBLIC_RC_IOS_PRODUCTION_KEY;
  delete process.env.EXPO_PUBLIC_RC_ANDROID_PRODUCTION_KEY;
  delete process.env.EXPO_PUBLIC_RC_TEST_KEY;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

describe('CONFIG shape', () => {
  it('has supabase, revenueCat, and backend sections', () => {
    const { CONFIG } = require('../index');
    expect(CONFIG).toHaveProperty('supabase');
    expect(CONFIG).toHaveProperty('revenueCat');
    expect(CONFIG).toHaveProperty('backend');
  });

  it('supabase section has url, anonKey, storageBucket', () => {
    const { CONFIG } = require('../index');
    expect(Object.keys(CONFIG.supabase)).toEqual(
      expect.arrayContaining(['url', 'anonKey', 'storageBucket'])
    );
  });

  it('revenueCat section has iosProductionKey, androidProductionKey, testKey', () => {
    const { CONFIG } = require('../index');
    expect(Object.keys(CONFIG.revenueCat)).toEqual(
      expect.arrayContaining(['iosProductionKey', 'androidProductionKey', 'testKey'])
    );
  });

  it('storageBucket is the fixed bucket name', () => {
    const { CONFIG } = require('../index');
    expect(CONFIG.supabase.storageBucket).toBe('lure-images');
  });
});

// ---------------------------------------------------------------------------
// Defaults — empty string fallback (not undefined/null)
// ---------------------------------------------------------------------------

describe('defaults when env vars are missing', () => {
  it('supabase.url defaults to empty string', () => {
    const { CONFIG } = require('../index');
    expect(CONFIG.supabase.url).toBe('');
  });

  it('supabase.anonKey defaults to empty string', () => {
    const { CONFIG } = require('../index');
    expect(CONFIG.supabase.anonKey).toBe('');
  });

  it('backend.url defaults to empty string', () => {
    const { CONFIG } = require('../index');
    expect(CONFIG.backend.url).toBe('');
  });

  it('all revenueCat keys default to empty string', () => {
    const { CONFIG } = require('../index');
    expect(CONFIG.revenueCat.iosProductionKey).toBe('');
    expect(CONFIG.revenueCat.androidProductionKey).toBe('');
    expect(CONFIG.revenueCat.testKey).toBe('');
  });

  it('no key value is undefined or null', () => {
    const { CONFIG } = require('../index');
    const allValues = [
      CONFIG.supabase.url,
      CONFIG.supabase.anonKey,
      CONFIG.revenueCat.iosProductionKey,
      CONFIG.revenueCat.androidProductionKey,
      CONFIG.revenueCat.testKey,
      CONFIG.backend.url,
    ];
    allValues.forEach((val) => {
      expect(val).not.toBeUndefined();
      expect(val).not.toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Env var reading — values are actually wired up
// ---------------------------------------------------------------------------

describe('reads from environment variables', () => {
  it('reads EXPO_PUBLIC_SUPABASE_URL', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    const { CONFIG } = require('../index');
    expect(CONFIG.supabase.url).toBe('https://test.supabase.co');
  });

  it('reads EXPO_PUBLIC_SUPABASE_ANON_KEY', () => {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-abc123';
    const { CONFIG } = require('../index');
    expect(CONFIG.supabase.anonKey).toBe('test-anon-key-abc123');
  });

  it('reads EXPO_PUBLIC_BACKEND_URL', () => {
    process.env.EXPO_PUBLIC_BACKEND_URL = 'https://my-backend.onrender.com';
    const { CONFIG } = require('../index');
    expect(CONFIG.backend.url).toBe('https://my-backend.onrender.com');
  });

  it('reads EXPO_PUBLIC_RC_IOS_PRODUCTION_KEY', () => {
    process.env.EXPO_PUBLIC_RC_IOS_PRODUCTION_KEY = 'appl_ios_prod_key';
    const { CONFIG } = require('../index');
    expect(CONFIG.revenueCat.iosProductionKey).toBe('appl_ios_prod_key');
  });

  it('reads EXPO_PUBLIC_RC_ANDROID_PRODUCTION_KEY', () => {
    process.env.EXPO_PUBLIC_RC_ANDROID_PRODUCTION_KEY = 'goog_android_prod_key';
    const { CONFIG } = require('../index');
    expect(CONFIG.revenueCat.androidProductionKey).toBe('goog_android_prod_key');
  });

  it('reads EXPO_PUBLIC_RC_TEST_KEY', () => {
    process.env.EXPO_PUBLIC_RC_TEST_KEY = 'test_rc_key_xyz';
    const { CONFIG } = require('../index');
    expect(CONFIG.revenueCat.testKey).toBe('test_rc_key_xyz');
  });

  it('two independent vars are both read correctly', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-xyz';
    const { CONFIG } = require('../index');
    expect(CONFIG.supabase.url).toBe('https://abc.supabase.co');
    expect(CONFIG.supabase.anonKey).toBe('anon-xyz');
  });
});

// ---------------------------------------------------------------------------
// AUTH constants
// ---------------------------------------------------------------------------

describe('AUTH constants', () => {
  it('exports AUTH with passwordResetRedirectUrl', () => {
    const { AUTH } = require('../index');
    expect(AUTH).toHaveProperty('passwordResetRedirectUrl');
  });

  it('passwordResetRedirectUrl defaults to empty string when env var missing', () => {
    delete process.env.EXPO_PUBLIC_PASSWORD_RESET_URL;
    const { AUTH } = require('../index');
    expect(AUTH.passwordResetRedirectUrl).toBe('');
  });

  it('reads EXPO_PUBLIC_PASSWORD_RESET_URL', () => {
    process.env.EXPO_PUBLIC_PASSWORD_RESET_URL = 'https://offcitydev.github.io/my-tackle-box/password-reset-success.html';
    const { AUTH } = require('../index');
    expect(AUTH.passwordResetRedirectUrl).toBe('https://offcitydev.github.io/my-tackle-box/password-reset-success.html');
  });
});

// ---------------------------------------------------------------------------
// SUBSCRIPTION constants — must match RevenueCat dashboard + backend exactly
// ---------------------------------------------------------------------------

describe('SUBSCRIPTION constants', () => {
  it('freeTierLimit is 10', () => {
    const { SUBSCRIPTION } = require('../index');
    expect(SUBSCRIPTION.freeTierLimit).toBe(10);
  });

  it('monthly product ID matches App Store Connect identifier', () => {
    const { SUBSCRIPTION } = require('../index');
    expect(SUBSCRIPTION.productIds.monthly).toBe('monthly_pro');
  });

  it('yearly product ID matches App Store Connect identifier', () => {
    const { SUBSCRIPTION } = require('../index');
    expect(SUBSCRIPTION.productIds.yearly).toBe('yearly_pro');
  });

  it('entitlementId matches RevenueCat dashboard exactly', () => {
    const { SUBSCRIPTION } = require('../index');
    expect(SUBSCRIPTION.entitlementId).toBe('MyTackleBox Pro');
  });
});
