/**
 * Paywall price labels — must match the App Store purchase sheet (StoreKit).
 */

import { SUBSCRIPTION } from '../core/config';

/** Canada App Store prices (must match what Apple charges on the subscribe sheet). */
export const CANONICAL_CAD = {
  monthly: 6.99,
  yearly: 49.99,
  currencyCode: 'CAD',
};

/** @deprecated use CANONICAL_CAD */
export const FALLBACK_CAD = CANONICAL_CAD;

export const formatCad = (amount) => {
  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: CANONICAL_CAD.currencyCode,
  }).format(amount);
  // Intl on some runtimes uses "$6.99" for CAD; match App Store / marketing copy (CA$).
  if (formatted.startsWith('$') && !formatted.startsWith('CA$')) {
    return `CA${formatted}`;
  }
  return formatted;
};

const PLAN_LABELS = {
  month: { title: 'Monthly', billing: 'Billed monthly' },
  year: { title: 'Annual', billing: 'Billed once per year' },
};

/** Old RevenueCat / offering cache often still returns USD 4.99 / 39.99 while purchase uses live tiers. */
const STALE_USD = { month: 4.99, year: 39.99 };

const isStaleUsdOfferingPrice = (product, period) => {
  if (!product || !period) return false;
  const p = typeof product.price === 'number' ? product.price : parseFloat(product.price);
  const ps = (product.priceString || '').trim();
  if (period === 'month') {
    return (
      p === STALE_USD.month ||
      ps === '$4.99' ||
      ps === '4,99 $' ||
      /4\.99/.test(ps)
    );
  }
  if (period === 'year') {
    return (
      p === STALE_USD.year ||
      ps === '$39.99' ||
      ps === '39,99 $' ||
      /39\.99/.test(ps)
    );
  }
  return false;
};

/**
 * RevenueCat offering metadata can lag behind StoreKit at purchase time.
 * When we detect the old USD amounts, show canonical CAD matching the Apple sheet.
 */
export const productForDisplay = (product, period) => {
  if (!product || !isStaleUsdOfferingPrice(product, period)) {
    return product;
  }
  if (period === 'month') {
    const s = formatCad(CANONICAL_CAD.monthly);
    return {
      ...product,
      price: CANONICAL_CAD.monthly,
      currencyCode: CANONICAL_CAD.currencyCode,
      priceString: s,
      pricePerMonthString: s,
    };
  }
  if (period === 'year') {
    const s = formatCad(CANONICAL_CAD.yearly);
    return {
      ...product,
      price: CANONICAL_CAD.yearly,
      currencyCode: CANONICAL_CAD.currencyCode,
      priceString: s,
    };
  }
  return product;
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

const isKnownSubscriptionProduct = (pkg, period) => {
  const id = (
    pkg?.product?.identifier ||
    pkg?.storeProduct?.identifier ||
    ''
  ).toLowerCase();
  if (period === 'month') {
    return id === SUBSCRIPTION.productIds.monthly || id.includes('monthly');
  }
  if (period === 'year') {
    return id === SUBSCRIPTION.productIds.yearly || id.includes('yearly');
  }
  return false;
};

/** Numeric amounts for savings badges (canonical, not stale offering cache). */
export const getCanonicalPriceAmount = (pkg) => {
  const period = getPackageBillingPeriod(pkg);
  if (period === 'month') return CANONICAL_CAD.monthly;
  if (period === 'year') return CANONICAL_CAD.yearly;
  const raw = pkg?.storeProduct || pkg?.product;
  const product = productForDisplay(raw, period);
  const p = product?.price;
  return typeof p === 'number' ? p : parseFloat(p) || null;
};

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
 * Price label for paywall and selected-plan summary.
 * For monthly_pro / yearly_pro we always show canonical CAD (matches Apple purchase sheet).
 */
export const formatSubscriptionDisplayPrice = (pkg) => {
  const period = getPackageBillingPeriod(pkg);
  if (!period) return '';

  if (isKnownSubscriptionProduct(pkg, period)) {
    if (period === 'month') return `${formatCad(CANONICAL_CAD.monthly)}/month`;
    if (period === 'year') return `${formatCad(CANONICAL_CAD.yearly)}/year`;
  }

  const raw = pkg?.storeProduct || pkg?.product;
  const product = productForDisplay(raw, period);
  if (!product) return '';

  const storePrice = pickStorePriceString(product, period);

  if (storePrice) {
    if (period === 'month' && !/\/\s*month/i.test(storePrice)) return `${storePrice}/month`;
    if (period === 'year' && !/\/\s*year/i.test(storePrice)) return `${storePrice}/year`;
    return storePrice;
  }

  if (period === 'month') return `${formatCad(CANONICAL_CAD.monthly)}/month`;
  if (period === 'year') return `${formatCad(CANONICAL_CAD.yearly)}/year`;
  return '';
};

/** Combined monthly + yearly line (e.g. dev tools); not shown on Settings. */
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
