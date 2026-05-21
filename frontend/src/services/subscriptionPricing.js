/**
 * Paywall price labels — must match the App Store purchase sheet (StoreKit).
 */

import { SUBSCRIPTION } from '../core/config';

/** Canada early-adoption list prices when StoreKit is unavailable (dev only). */
export const FALLBACK_CAD = {
  monthly: 6.99,
  yearly: 49.99,
  currencyCode: 'CAD',
};

export const formatCad = (amount) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: FALLBACK_CAD.currencyCode,
  }).format(amount);

const PLAN_LABELS = {
  month: { title: 'Monthly', billing: 'Billed monthly' },
  year: { title: 'Annual', billing: 'Billed once per year' },
};

/**
 * Billing period for UI (/month vs /year). Prefer StoreKit ISO period, then package type & product id.
 */
export const getPackageBillingPeriod = (pkg) => {
  if (!pkg) return null;

  const iso = pkg.product?.subscriptionPeriod;
  if (iso === 'P1Y') return 'year';
  if (iso === 'P1M') return 'month';

  const type = pkg.packageType;
  if (type === 'ANNUAL') return 'year';
  if (type === 'MONTHLY' || type === 'WEEKLY') return 'month';

  const productId = (pkg.product?.identifier || '').toLowerCase();
  if (productId === SUBSCRIPTION.productIds.yearly || productId.includes('yearly')) return 'year';
  if (productId === SUBSCRIPTION.productIds.monthly || productId.includes('monthly')) return 'month';

  const id = (pkg.identifier || '').toLowerCase();
  if (id.includes('annual') || id.includes('yearly')) return 'year';
  if (id.includes('month')) return 'month';

  return null;
};

/** App-facing plan copy — never use App Store product title/description (often contain stale prices). */
export const getPlanLabel = (pkg) => {
  const period = getPackageBillingPeriod(pkg);
  return PLAN_LABELS[period] || { title: 'PRO', billing: '' };
};

/**
 * Best StoreKit-formatted price for display (matches Apple's purchase sheet).
 */
const pickStorePriceString = (product, period) => {
  if (!product) return '';

  if (period === 'month') {
    return (
      product.pricePerMonthString?.trim() ||
      product.priceString?.trim() ||
      ''
    );
  }
  if (period === 'year') {
    return product.priceString?.trim() || product.pricePerYearString?.trim() || '';
  }
  return product.priceString?.trim() || '';
};

/**
 * Price label for paywall & App Store 3.1.2 disclosure.
 */
export const formatSubscriptionDisplayPrice = (pkg) => {
  // Prefer live StoreKit product attached in getSubscriptionPackages (not stale RC offering copy)
  const product = pkg?.storeProduct || pkg?.product;
  if (!product) return '';

  const period = getPackageBillingPeriod(pkg);
  const storePrice = pickStorePriceString(product, period);

  if (storePrice) {
    if (period === 'month' && !/\/\s*month/i.test(storePrice)) return `${storePrice}/month`;
    if (period === 'year' && !/\/\s*year/i.test(storePrice)) return `${storePrice}/year`;
    return storePrice;
  }

  // Do not format stale RevenueCat numeric price — wrong card amounts vs Apple sheet
  const raw = product.price;
  const price = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
  const code = product.currencyCode;
  if (!Number.isNaN(price) && code) {
    try {
      const locale = code === 'CAD' ? 'en-CA' : undefined;
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
      }).format(price);
      if (period === 'month') return `${formatted}/month`;
      if (period === 'year') return `${formatted}/year`;
      return formatted;
    } catch (_) {
      /* fall through */
    }
  }

  return '';
};

/** One-line summary for Settings / upgrade teasers, e.g. "CA$6.99/month · CA$49.99/year". */
export const formatSubscriptionPriceSummary = (packages) => {
  if (!packages?.length) return null;

  const monthly = packages.find((p) => getPackageBillingPeriod(p) === 'month');
  const yearly = packages.find((p) => getPackageBillingPeriod(p) === 'year');
  const parts = [];
  const mp = monthly ? formatSubscriptionDisplayPrice(monthly) : '';
  const yp = yearly ? formatSubscriptionDisplayPrice(yearly) : '';
  if (mp) parts.push(mp);
  if (yp) parts.push(yp);
  return parts.length ? parts.join(' · ') : null;
};
