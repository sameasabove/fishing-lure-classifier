/**
 * Paywall price labels — must match the App Store purchase sheet (StoreKit priceString).
 */

/** Canada early-adoption list prices when StoreKit is unavailable (dev / misconfigured RevenueCat). */
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
  if (productId.includes('yearly') || productId.includes('annual')) return 'year';
  if (productId.includes('monthly') || productId.includes('month')) return 'month';

  const id = (pkg.identifier || '').toLowerCase();
  if (id.includes('annual') || id.includes('yearly')) return 'year';
  if (id.includes('month')) return 'month';

  return null;
};

/**
 * Price label for paywall & App Store 3.1.2 disclosure. Uses StoreKit priceString when available.
 */
export const formatSubscriptionDisplayPrice = (pkg) => {
  const product = pkg?.product;
  if (!product) return '';

  const period = getPackageBillingPeriod(pkg);
  const storePrice = product.priceString?.trim();

  if (storePrice) {
    if (period === 'month' && !/\/\s*month/i.test(storePrice)) return `${storePrice}/month`;
    if (period === 'year' && !/\/\s*year/i.test(storePrice)) return `${storePrice}/year`;
    return storePrice;
  }

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
