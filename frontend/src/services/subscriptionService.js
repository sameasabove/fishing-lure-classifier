/**
 * Subscription Service - RevenueCat Integration
 */

import Purchases from 'react-native-purchases';
import { Platform, Linking } from 'react-native';
import { getCurrentUser } from './supabaseService';
import { supabase } from '../config/supabase';
import axios from 'axios';
import { BACKEND_URL } from './backendService';
import { CONFIG, SUBSCRIPTION } from '../core/config';

// ============================================================================
// CONFIGURATION
// ============================================================================

const getApiKey = () => {
  if (__DEV__) {
    return { ios: CONFIG.revenueCat.testKey, android: CONFIG.revenueCat.testKey };
  }
  return {
    ios: CONFIG.revenueCat.iosProductionKey,
    android: CONFIG.revenueCat.androidProductionKey,
  };
};

export const PRODUCT_IDS = {
  MONTHLY: SUBSCRIPTION.productIds.monthly,
  YEARLY: SUBSCRIPTION.productIds.yearly,
};

const ENTITLEMENT_ID = SUBSCRIPTION.entitlementId;
const FREE_TIER_LIMIT = SUBSCRIPTION.freeTierLimit;

// ============================================================================
// TEST OVERRIDES (Dev only – use Subscription Test screen to set)
// ============================================================================

let __subscriptionTestOverrides = {};

/**
 * Set a test override to force a specific failure scenario.
 * Only applies in __DEV__. Use clearSubscriptionTestOverrides() to reset.
 * @param {string} key - One of: FORCE_FREE_TIER, NOT_CONFIGURED, NO_OFFERINGS, PACKAGES_ERROR, PURCHASE_CANCELLED,
 *   PURCHASE_FAIL, RESTORE_NO_PURCHASES, RESTORE_FAIL, QUOTA_EXCEEDED, QUOTA_CHECK_FAIL,
 *   STATUS_FAIL, GET_INFO_FAIL
 * @param {boolean} [enabled=true]
 */
export const setSubscriptionTestOverride = (key, enabled = true) => {
  if (!__DEV__) return;
  __subscriptionTestOverrides[key] = !!enabled;
  if (__DEV__) {
    console.log('[Subscriptions] Test override set:', key, '=', !!enabled);
  }
};

/**
 * Clear all test overrides.
 */
export const clearSubscriptionTestOverrides = () => {
  __subscriptionTestOverrides = {};
  if (__DEV__) {
    console.log('[Subscriptions] All test overrides cleared');
  }
};

/**
 * Get current test overrides (for UI).
 */
export const getSubscriptionTestOverrides = () => {
  return __DEV__ ? { ...__subscriptionTestOverrides } : {};
};

const _hasOverride = (key) => __DEV__ && !!__subscriptionTestOverrides[key];

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize RevenueCat SDK
 * Call this when the app starts, after user authentication
 */
export const initializeSubscriptions = async (userId) => {
  try {
    const keys = getApiKey();
    const apiKey = Platform.OS === 'ios' 
      ? keys.ios 
      : keys.android;
    
    if (__DEV__) {
      console.log('[Subscriptions] Initializing with API key:', apiKey.substring(0, 10) + '...');
      console.log('[Subscriptions] Platform:', Platform.OS);
      console.log('[Subscriptions] User ID:', userId);
    }
    
    // Check if already configured to avoid re-initialization errors
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (__DEV__) {
        console.log('[Subscriptions] Already configured, customer ID:', customerInfo.originalAppUserId);
      }
      return { success: true, alreadyConfigured: true };
    } catch (e) {
      // Only treat "not configured" as non-fatal; rethrow real errors (network, etc.)
      const msg = (e?.message || '').toLowerCase();
      const isNotConfigured = msg.includes('configure') || msg.includes('singleton') || msg.includes('instance');
      if (!isNotConfigured) {
        if (__DEV__) {
          console.warn('[Subscriptions] Error checking if configured:', e.message);
        }
        throw e;
      }
      // Not configured yet, proceed with configuration
      if (__DEV__) {
        console.log('[Subscriptions] Not configured yet, proceeding with initialization...');
      }
    }
    
    // Configure RevenueCat with user ID
    await Purchases.configure({ 
      apiKey, 
      appUserID: userId // Links purchases to your user
    });
    
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      console.log('[Subscriptions] Debug logging enabled');
    }
    
    // Verify configuration worked by getting customer info
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (__DEV__) {
        console.log('[Subscriptions] ✓ Initialized successfully, customer ID:', customerInfo.originalAppUserId);
      }
    } catch (verifyError) {
      console.warn('[Subscriptions] Configuration completed but verification failed:', verifyError.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Subscriptions] ✗ Init error:', error);
    console.error('[Subscriptions] Error details:', {
      message: error.message,
      code: error.code,
      userInfo: error.userInfo,
    });
    // Don't fail completely - subscription features will just use fallback
    return { success: false, error: error.message };
  }
};

// ============================================================================
// SUBSCRIPTION STATUS
// ============================================================================

/**
 * Refresh customer info from RevenueCat server
 * Forces a fresh fetch to get latest subscription data
 */
export const refreshCustomerInfo = async () => {
  try {
    // Restore purchases to force refresh from server
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    // If restore fails, try regular getCustomerInfo
    console.warn('[Subscriptions] Restore failed, using getCustomerInfo:', error);
    return await Purchases.getCustomerInfo();
  }
};

/**
 * Get current subscription status
 * Returns whether user has PRO access and details (monthly or yearly only).
 */
export const getSubscriptionStatus = async (forceRefresh = false) => {
  try {
    if (__DEV__) {
      // Demo PRO override removed — use RevenueCat test sandbox or Supabase flag instead.
    }

    // TEST OVERRIDE: Force "status fail"
    if (_hasOverride('STATUS_FAIL')) {
      throw new Error('[TEST] Simulated subscription status failure.');
    }
    // TEST OVERRIDE: Force free tier (treat as non-PRO even if subscription exists)
    if (_hasOverride('FORCE_FREE_TIER')) {
      // Return free tier status regardless of actual subscription
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        isPro: false,
        productIdentifier: null,
        expirationDate: null,
        willRenew: false,
        periodType: null,
      };
    }

    // Check if RevenueCat is configured
    let customerInfo;
    if (forceRefresh) {
      customerInfo = await refreshCustomerInfo();
    } else {
      customerInfo = await Purchases.getCustomerInfo();
    }
    
    // Check if user has active PRO entitlement
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    // Get all purchased product identifiers to see what user has
    const allPurchasedProducts = customerInfo.allPurchasedProductIdentifiers || [];
    
    // Check active subscriptions (recurring subscriptions that are currently active)
    // RevenueCat returns array of product ids or object; support both
    const activeSubscriptions = customerInfo.activeSubscriptions || [];
    const hasProduct = (subs, id) => {
      if (!subs) return false;
      return Array.isArray(subs) ? subs.includes(id) : (subs[id] !== undefined);
    };
    
    if (__DEV__) {
      console.log('[Subscriptions] All purchased products:', allPurchasedProducts);
      console.log('[Subscriptions] Active subscriptions:', activeSubscriptions);
      console.log('[Subscriptions] Active entitlements:', Object.keys(customerInfo.entitlements.active));
    }
    
    // Check if user has an active recurring subscription (monthly or yearly)
    const hasActiveMonthly = hasProduct(activeSubscriptions, PRODUCT_IDS.MONTHLY);
    const hasActiveYearly = hasProduct(activeSubscriptions, PRODUCT_IDS.YEARLY);
    
    // Get the entitlement object (RevenueCat returns one entitlement)
    let entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    if (entitlement && (hasActiveMonthly || hasActiveYearly)) {
      // Check if the active subscription is actually granting the entitlement
      // If monthly/yearly is active, use that product identifier even if entitlement shows lifetime
      // Note: activeSubscriptions may be array (product ids) or object; use entitlement expiration when available
      if (hasActiveMonthly) {
        const sub = Array.isArray(activeSubscriptions) ? null : activeSubscriptions[PRODUCT_IDS.MONTHLY];
        const exp = (sub && typeof sub === 'object' && sub.expirationDate) ? sub.expirationDate : (entitlement?.expirationDate || null);
        entitlement = {
          productIdentifier: PRODUCT_IDS.MONTHLY,
          willRenew: true,
          expirationDate: exp,
          periodType: 'MONTH',
        };
        if (__DEV__) {
          console.log('[Subscriptions] Overriding with active monthly subscription');
        }
      } else if (hasActiveYearly) {
        const sub = Array.isArray(activeSubscriptions) ? null : activeSubscriptions[PRODUCT_IDS.YEARLY];
        const exp = (sub && typeof sub === 'object' && sub.expirationDate) ? sub.expirationDate : (entitlement?.expirationDate || null);
        entitlement = {
          productIdentifier: PRODUCT_IDS.YEARLY,
          willRenew: true,
          expirationDate: exp,
          periodType: 'YEAR',
        };
        if (__DEV__) {
          console.log('[Subscriptions] Overriding with active yearly subscription');
        }
      }
    }
    
    if (__DEV__) {
      console.log('[Subscriptions] Final entitlement:', {
        isPro,
        productIdentifier: entitlement?.productIdentifier,
        willRenew: entitlement?.willRenew,
        expirationDate: entitlement?.expirationDate,
        hasActiveMonthly,
        hasActiveYearly,
      });
    }
    
    return {
      isPro,
      expirationDate: entitlement?.expirationDate || null,
      productIdentifier: entitlement?.productIdentifier || null,
      willRenew: entitlement?.willRenew || false,
      periodType: entitlement?.periodType || null,
    };
  } catch (error) {
    // If RevenueCat not configured yet, check backend API instead
    console.warn('[Subscriptions] RevenueCat not configured, checking backend');
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { isPro: false };
      }
      
      // Use backend API to check subscription status
      const response = await axios.get(`${BACKEND_URL}/api/verify-subscription`, {
        params: { user_id: user.id },
        timeout: 5000,
      });
      
      const subscription = response.data;
      
      return {
        isPro: subscription.is_pro || false,
        productIdentifier: subscription.product_identifier,
        expirationDate: subscription.expires_at,
        willRenew: subscription.will_renew,
      };
    } catch (fallbackError) {
      console.warn('[Subscriptions] Backend check failed, assuming free tier');
      return { isPro: false };
    }
  }
};

/**
 * Check if user is PRO (simple boolean check)
 */
export const isUserPro = async () => {
  const status = await getSubscriptionStatus();
  return status.isPro;
};

// ============================================================================
// OFFERINGS & PACKAGES
// ============================================================================

/**
 * Get available subscription packages
 * Returns packages configured in RevenueCat dashboard
 */
export const getSubscriptionPackages = async () => {
  try {
    // TEST OVERRIDE: Force "not configured" – return fallback packages
    if (_hasOverride('NOT_CONFIGURED')) {
      return { success: true, packages: getFallbackPackages(), isFallback: true };
    }
    // TEST OVERRIDE: Force "no offerings" – return fallback packages
    if (_hasOverride('NO_OFFERINGS')) {
      return { success: true, packages: getFallbackPackages(), isFallback: true };
    }
    // TEST OVERRIDE: Force "packages error" – return failure
    if (_hasOverride('PACKAGES_ERROR')) {
      return { success: false, packages: [], error: '[TEST] Simulated packages load error.' };
    }

    // Check if RevenueCat is configured first
    try {
      await Purchases.getCustomerInfo();
    } catch (configError) {
      const msg = (configError?.message || '').toLowerCase();
      const isNotConfigured = msg.includes('configure') || msg.includes('singleton') || msg.includes('instance');
      
      if (isNotConfigured) {
        if (__DEV__) {
          console.warn('[Subscriptions] RevenueCat not configured yet, returning fallback packages');
        }
        // Return fallback packages for testing
        return {
          success: true,
          packages: getFallbackPackages(),
          isFallback: true,
        };
      }
      throw configError;
    }
    
    // Try to get offerings from RevenueCat
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
      // Only show monthly and yearly — no lifetime
      const allowed = [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.YEARLY];
      const packages = offerings.current.availablePackages.filter(
        (p) => p.product?.identifier && allowed.includes(p.product.identifier)
      );
      if (__DEV__) {
        console.log('[Subscriptions] Loaded', packages.length, 'packages from RevenueCat (monthly/yearly only)');
      }
      return {
        success: true,
        packages: packages.length > 0 ? packages : getFallbackPackages(),
        isFallback: packages.length === 0,
        current: offerings.current,
      };
    } else {
      if (__DEV__) {
        console.warn('[Subscriptions] No offerings found in RevenueCat, using fallback packages');
      }
      // Return fallback packages if RevenueCat has no offerings configured
      return {
        success: true,
        packages: getFallbackPackages(),
        isFallback: true,
      };
    }
  } catch (error) {
    console.error('[Subscriptions] Get packages error:', error);
    
    // Return fallback packages on error so user can still see options
    if (__DEV__) {
      console.warn('[Subscriptions] Using fallback packages due to error');
    }
    return {
      success: true,
      packages: getFallbackPackages(),
      isFallback: true,
      error: error.message, // Include error for debugging
    };
  }
};

/**
 * Create fallback packages when RevenueCat isn't configured or offerings aren't available
 * These are mock packages for testing/development
 */
const getFallbackPackages = () => {
  // Create mock package objects that match RevenueCat package structure
  const createMockPackage = (identifier, title, description, priceString, packageType) => {
    return {
      identifier,
      packageType,
      isFallback: true, // Mark so purchase returns needsConfiguration
      product: {
        identifier: identifier,
        description: description,
        title: title,
        price: 0, // Will be set by store
        priceString: priceString,
        currencyCode: 'USD',
      },
    };
  };
  
  return [
    createMockPackage(
      PRODUCT_IDS.MONTHLY,
      'Monthly PRO',
      'Unlimited scans, billed monthly',
      '$4.99/month',
      'MONTHLY'
    ),
    createMockPackage(
      PRODUCT_IDS.YEARLY,
      'Annual PRO',
      'Unlimited scans, billed annually',
      '$39.99/year',
      'ANNUAL'
    ),
  ];
};

// ============================================================================
// PURCHASE FLOW
// ============================================================================

/**
 * Purchase a subscription package
 */
export const purchaseSubscription = async (packageToPurchase) => {
  try {
    // TEST OVERRIDE: Force "purchase cancelled"
    if (_hasOverride('PURCHASE_CANCELLED')) {
      return { success: false, cancelled: true };
    }
    // TEST OVERRIDE: Force "purchase fail"
    if (_hasOverride('PURCHASE_FAIL')) {
      return { success: false, error: '[TEST] Simulated purchase failure.' };
    }

    // Check if this is a fallback package (can't actually purchase)
    if (packageToPurchase.isFallback || !packageToPurchase.product?.identifier) {
      return {
        success: false,
        error: 'Subscription packages are not configured yet. Please set up RevenueCat offerings in the dashboard.',
        needsConfiguration: true,
      };
    }
    
    // Check if RevenueCat is configured
    try {
      await Purchases.getCustomerInfo();
    } catch (configError) {
      const msg = (configError?.message || '').toLowerCase();
      const isNotConfigured = msg.includes('configure') || msg.includes('singleton') || msg.includes('instance');
      
      if (isNotConfigured) {
        return {
          success: false,
          error: 'RevenueCat is not configured. Please ensure subscriptions are initialized.',
          needsConfiguration: true,
        };
      }
      throw configError;
    }
    
    // Attempt purchase
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    if (isPro) {
      // Sync subscription status to Supabase
      await syncSubscriptionToSupabase(customerInfo);
      
      console.log('[Subscriptions] ✓ Purchase successful');
      return { 
        success: true, 
        isPro: true,
        productId: packageToPurchase.product.identifier
      };
    } else {
      return { 
        success: false, 
        error: 'Purchase did not grant PRO access. Please check your RevenueCat configuration.' 
      };
    }
  } catch (error) {
    if (error.userCancelled) {
      console.log('[Subscriptions] User cancelled purchase');
      return { 
        success: false, 
        cancelled: true 
      };
    } else {
      console.error('[Subscriptions] Purchase error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Purchase failed';
      if (error.message?.includes('not configured') || error.message?.includes('singleton')) {
        errorMessage = 'RevenueCat is not configured. Please restart the app after signing in.';
      } else if (error.message?.includes('offerings') || error.message?.includes('package')) {
        errorMessage = 'Subscription packages are not available. Please check RevenueCat dashboard configuration.';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }
};

/**
 * Restore previous purchases
 * Important for users who reinstall the app or switch devices
 */
export const restorePurchases = async () => {
  try {
    // TEST OVERRIDE: Force "restore – no purchases"
    if (_hasOverride('RESTORE_NO_PURCHASES')) {
      return { success: true, isPro: false, message: 'No purchases to restore' };
    }
    // TEST OVERRIDE: Force "restore fail"
    if (_hasOverride('RESTORE_FAIL')) {
      return { success: false, error: '[TEST] Simulated restore failure.' };
    }

    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    if (isPro) {
      await syncSubscriptionToSupabase(customerInfo);
      console.log('[Subscriptions] ✓ Purchases restored');
    }
    
    return { 
      success: true, 
      isPro,
      message: isPro ? 'PRO subscription restored!' : 'No purchases to restore'
    };
  } catch (error) {
    console.error('[Subscriptions] Restore error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// ============================================================================
// QUOTA MANAGEMENT (FREE TIER)
// ============================================================================

/**
 * Check if user can scan a lure
 * Respects PRO status and free tier quotas
 */
export const canUserScan = async () => {
  try {
    // TEST OVERRIDE: Force free tier (bypass PRO check)
    if (_hasOverride('FORCE_FREE_TIER')) {
      // Skip PRO check and go straight to quota check
    } else {
      // Check PRO status first
      const status = await getSubscriptionStatus();
      
      // PRO users have unlimited scans
      if (status.isPro) {
        return { 
          canScan: true, 
          reason: 'pro',
          unlimited: true 
        };
      }
    }
    
    // Free users: check monthly quota
    const quota = await getMonthlyQuota();
    
    if (quota.remaining > 0) {
      return { 
        canScan: true, 
        reason: 'free_quota',
        remaining: quota.remaining,
        used: quota.used,
        limit: quota.limit,
        resetDate: quota.resetDate
      };
    }
    
    // Quota exceeded
    return { 
      canScan: false, 
      reason: 'quota_exceeded',
      resetDate: quota.resetDate,
      used: quota.used,
      limit: quota.limit
    };
  } catch (error) {
    console.error('[Subscriptions] Can scan check error:', error);
    return { 
      canScan: false, 
      reason: 'error',
      error: error.message 
    };
  }
};

/**
 * Get monthly quota status for free users
 */
export const getMonthlyQuota = async () => {
  try {
    // TEST OVERRIDE: Force "quota exceeded" (0 remaining)
    if (_hasOverride('QUOTA_EXCEEDED')) {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        used: FREE_TIER_LIMIT,
        remaining: 0,
        limit: FREE_TIER_LIMIT,
        resetDate: resetDate.toISOString(),
      };
    }
    // TEST OVERRIDE: Force "quota check fail" – throw so caller gets error
    if (_hasOverride('QUOTA_CHECK_FAIL')) {
      throw new Error('[TEST] Simulated quota check failure.');
    }

    const user = await getCurrentUser();
    if (!user) {
      console.warn('[Subscriptions] No user authenticated');
      return { 
        used: 0, 
        remaining: FREE_TIER_LIMIT, 
        limit: FREE_TIER_LIMIT,
        resetDate: new Date().toISOString()
      };
    }
    
    // Use backend API to check quota (more reliable than direct Supabase query)
    try {
      const response = await axios.get(`${BACKEND_URL}/api/check-scan-quota`, {
        params: { user_id: user.id },
        headers: { 'X-User-ID': user.id },
        timeout: 5000,
      });
      
      const quota = response.data;
      
      // TEST OVERRIDE: Force free tier - skip PRO check even if backend says PRO
      if (!_hasOverride('FORCE_FREE_TIER') && (quota.is_pro || quota.unlimited)) {
        // PRO user
        return {
          used: 0,
          remaining: 999,
          limit: 999,
          resetDate: null,
          isPro: true,
        };
      }
      
      // Free user - calculate remaining from used and limit
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const used = quota.used || 0;
      const limit = quota.limit || FREE_TIER_LIMIT;
      const remaining = Math.max(0, limit - used); // Calculate remaining properly
      
      console.log(`[Subscriptions] Quota from backend: ${used}/${limit} used, ${remaining} remaining`);
      
      return {
        used,
        remaining,
        limit,
        resetDate: quota.reset_date || resetDate.toISOString(),
      };
    } catch (backendError) {
      // Silently fail - don't show errors to user during sign-in
      // Just return safe defaults if backend is unreachable
      if (__DEV__) {
        console.warn('[Subscriptions] Backend quota check failed (silent fallback):', backendError.message);
      }
      // Return safe defaults if backend is unreachable
      return {
        used: 0,
        remaining: FREE_TIER_LIMIT,
        limit: FREE_TIER_LIMIT,
        resetDate: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('[Subscriptions] Quota check error:', error);
    // Return safe defaults on error
    return { 
      used: 0, 
      remaining: FREE_TIER_LIMIT, 
      limit: FREE_TIER_LIMIT,
      resetDate: new Date().toISOString()
    };
  }
};

/**
 * Get quota status for display in UI
 */
export const getQuotaStatus = async () => {
  try {
    const status = await getSubscriptionStatus();
    
    if (status.isPro) {
      return {
        isPro: true,
        unlimited: true,
        message: '∞ Unlimited scans',
        emoji: '🎣'
      };
    }
    
    const quota = await getMonthlyQuota();
    
    // Debug logging
    console.log('[Subscriptions] getQuotaStatus - quota data:', quota);
    
    const resetDate = new Date(quota.resetDate);
    const daysUntilReset = Math.ceil((resetDate - new Date()) / (1000 * 60 * 60 * 24));
    
    return {
      isPro: false,
      unlimited: false,
      used: quota.used,
      remaining: quota.remaining,
      limit: quota.limit,
      resetDate: quota.resetDate,
      daysUntilReset,
      message: `${quota.remaining} scan${quota.remaining !== 1 ? 's' : ''} remaining`,
      subtitle: `Resets in ${daysUntilReset} day${daysUntilReset !== 1 ? 's' : ''}`,
      emoji: quota.remaining > 5 ? '✅' : quota.remaining > 0 ? '⚠️' : '🚫'
    };
  } catch (error) {
    console.error('[Subscriptions] getQuotaStatus error:', error);
    // Return safe error state
    return {
      isPro: false,
      unlimited: false,
      used: 0,
      remaining: 0,
      limit: FREE_TIER_LIMIT,
      message: '⚠️ Could not load quota',
      subtitle: 'Please check your connection',
      emoji: '⚠️'
    };
  }
};

// ============================================================================
// SUPABASE SYNC
// ============================================================================

/**
 * Sync subscription status to Supabase
 * This allows backend to validate subscription status
 */
const syncSubscriptionToSupabase = async (customerInfo) => {
  try {
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[Subscriptions] No user found, skipping Supabase sync');
      return;
    }
    
    // Determine subscription type
    let subscriptionType = null;
    if (entitlement) {
      const productId = entitlement.productIdentifier;
      if (productId === PRODUCT_IDS.MONTHLY) {
        subscriptionType = 'monthly';
      } else if (productId === PRODUCT_IDS.YEARLY) {
        subscriptionType = 'yearly';
      }
    }
    
    // Upsert subscription status
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        is_pro: isPro,
        subscription_type: subscriptionType,
        product_identifier: entitlement?.productIdentifier || null,
        expires_at: entitlement?.expirationDate || null,
        will_renew: entitlement?.willRenew || false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });
    
    if (error) throw error;
    
    console.log('[Subscriptions] ✓ Synced to Supabase');
  } catch (error) {
    console.error('[Subscriptions] Sync to Supabase error:', error);
    // Don't throw - subscription still works even if sync fails
  }
};

/**
 * Manually sync subscription status
 * Useful for debugging or forcing a refresh
 */
export const syncSubscription = async () => {
  try {
    // Check if RevenueCat is configured before trying to use it
    try {
      await Purchases.getCustomerInfo();
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      const isNotConfigured = msg.includes('configure') || msg.includes('singleton') || msg.includes('instance');
      if (!isNotConfigured) throw e;
      if (__DEV__) {
        console.warn('[Subscriptions] RevenueCat not configured yet, skipping sync');
      }
      return { success: false, error: 'RevenueCat not configured' };
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    await syncSubscriptionToSupabase(customerInfo);
    return { success: true };
  } catch (error) {
    if (__DEV__) {
      console.error('[Subscriptions] Manual sync error:', error);
    }
    return { success: false, error: error.message };
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get subscription info for display
 */
export const getSubscriptionInfo = async (forceRefresh = false) => {
  const status = await getSubscriptionStatus(forceRefresh);
  
  if (!status.isPro) {
    // Get actual quota status to show remaining scans
    try {
      const quota = await getMonthlyQuota();
      const remaining = quota.remaining || 0;
      const limit = quota.limit || FREE_TIER_LIMIT;
      return {
        isPro: false,
        title: 'Free Plan',
        description: remaining > 0 ? `${remaining} of ${limit} scans remaining` : `${limit} scans per month`,
        remaining: remaining,
        limit: limit,
        used: quota.used || 0,
      };
    } catch (error) {
      // Fallback if quota check fails
      return {
        isPro: false,
        title: 'Free Plan',
        description: '10 scans per month',
      };
    }
  }
  
  const productId = status.productIdentifier;
  
  if (productId === PRODUCT_IDS.YEARLY) {
    return {
      isPro: true,
      title: 'PRO (Yearly)',
      description: 'Billed annually',
      expiresAt: status.expirationDate,
      willRenew: status.willRenew,
      badge: 'PRO',
    };
  }
  
  if (productId === PRODUCT_IDS.MONTHLY) {
    return {
      isPro: true,
      title: 'PRO (Monthly)',
      description: 'Billed monthly',
      expiresAt: status.expirationDate,
      willRenew: status.willRenew,
      badge: 'PRO',
    };
  }
  
  return {
    isPro: true,
    title: 'PRO',
    description: 'Active subscription',
    badge: 'PRO',
  };
};

/**
 * Open subscription management in App Store/Play Store
 * This allows users to cancel or manage their subscriptions
 */
export const openSubscriptionManagement = async () => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: Open App Store subscription management
      const url = 'https://apps.apple.com/account/subscriptions';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return { success: true };
      } else {
        return { success: false, error: 'Cannot open App Store' };
      }
    } else if (Platform.OS === 'android') {
      // Android: Open Play Store subscription management
      const url = 'https://play.google.com/store/account/subscriptions';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return { success: true };
      } else {
        // Try opening Play Store app directly
        const playStoreUrl = 'market://details?id=com.google.android.gms';
        try {
          await Linking.openURL(playStoreUrl);
          return { success: true };
        } catch {
          return { success: false, error: 'Cannot open Play Store' };
        }
      }
    }
    return { success: false, error: 'Platform not supported' };
  } catch (error) {
    console.error('[Subscriptions] Error opening subscription management:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if subscription is about to expire
 * Returns true if expiring in next 7 days
 */
export const isSubscriptionExpiringSoon = async () => {
  const status = await getSubscriptionStatus();
  
  if (!status.isPro || !status.expirationDate) {
    return false;
  }
  
  const expirationDate = new Date(status.expirationDate);
  const now = new Date();
  const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Diagnostic function to check subscription system status
 * Useful for debugging subscription issues
 */
export const diagnoseSubscriptions = async () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    isDev: __DEV__,
    issues: [],
    status: {},
  };
  
  try {
    // Check if RevenueCat is configured
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      diagnostics.status.configured = true;
      diagnostics.status.customerId = customerInfo.originalAppUserId;
      diagnostics.status.entitlements = Object.keys(customerInfo.entitlements.active);
    } catch (error) {
      diagnostics.status.configured = false;
      diagnostics.issues.push(`RevenueCat not configured: ${error.message}`);
    }
    
    // Check if offerings are available
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        diagnostics.status.hasOfferings = true;
        diagnostics.status.packageCount = offerings.current.availablePackages.length;
      } else {
        diagnostics.status.hasOfferings = false;
        diagnostics.issues.push('No current offering configured in RevenueCat dashboard');
      }
    } catch (error) {
      diagnostics.status.hasOfferings = false;
      diagnostics.issues.push(`Could not fetch offerings: ${error.message}`);
    }
    
    // Check subscription status
    try {
      const status = await getSubscriptionStatus();
      diagnostics.status.isPro = status.isPro;
      diagnostics.status.productId = status.productIdentifier;
    } catch (error) {
      diagnostics.issues.push(`Could not get subscription status: ${error.message}`);
    }
    
    // Check API key
    const keys = getApiKey();
    diagnostics.status.apiKey = {
      ios: keys.ios ? keys.ios.substring(0, 10) + '...' : 'missing',
      android: keys.android ? keys.android.substring(0, 10) + '...' : 'missing',
    };
    
  } catch (error) {
    diagnostics.issues.push(`Diagnostic error: ${error.message}`);
  }
  
  if (__DEV__) {
    console.log('[Subscriptions] Diagnostics:', JSON.stringify(diagnostics, null, 2));
  }
  
  return diagnostics;
};

export default {
  // Initialization
  initializeSubscriptions,
  
  // Status
  getSubscriptionStatus,
  isUserPro,
  getSubscriptionInfo,
  isSubscriptionExpiringSoon,
  
  // Packages
  getSubscriptionPackages,
  
  // Purchase
  purchaseSubscription,
  restorePurchases,
  
  // Quota
  canUserScan,
  getMonthlyQuota,
  getQuotaStatus,
  
  // Sync
  syncSubscription,
  
  // Diagnostics
  diagnoseSubscriptions,
  
  // Test overrides (dev only)
  setSubscriptionTestOverride,
  clearSubscriptionTestOverrides,
  getSubscriptionTestOverrides,
  
  // Constants
  PRODUCT_IDS,
  FREE_TIER_LIMIT,
};

