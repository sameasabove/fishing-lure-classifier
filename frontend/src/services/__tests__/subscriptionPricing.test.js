const {
  getPackageBillingPeriod,
  formatSubscriptionDisplayPrice,
} = require('../subscriptionPricing');

describe('subscription display pricing', () => {
  const monthlyPkg = {
    identifier: '$rc_monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'monthly_pro',
      price: 6.99,
      currencyCode: 'CAD',
      priceString: 'CA$6.99',
      subscriptionPeriod: 'P1M',
    },
  };

  const yearlyPkg = {
    identifier: '$rc_annual',
    packageType: 'ANNUAL',
    product: {
      identifier: 'yearly_pro',
      price: 49.99,
      currencyCode: 'CAD',
      priceString: 'CA$49.99',
      subscriptionPeriod: 'P1Y',
    },
  };

  it('detects billing period from subscriptionPeriod and product id', () => {
    expect(getPackageBillingPeriod(monthlyPkg)).toBe('month');
    expect(getPackageBillingPeriod(yearlyPkg)).toBe('year');
    expect(
      getPackageBillingPeriod({
        identifier: 'custom',
        packageType: 'CUSTOM',
        product: { identifier: 'yearly_pro', subscriptionPeriod: null },
      })
    ).toBe('year');
  });

  it('prefers StoreKit priceString over numeric price formatting', () => {
    const wrongNumeric = {
      ...monthlyPkg,
      product: {
        ...monthlyPkg.product,
        price: 4.99,
        currencyCode: 'USD',
        priceString: 'CA$6.99',
      },
    };
    expect(formatSubscriptionDisplayPrice(wrongNumeric)).toBe('CA$6.99/month');
    expect(formatSubscriptionDisplayPrice(yearlyPkg)).toBe('CA$49.99/year');
  });

  it('formats fallback numeric prices when priceString is missing', () => {
    const fallback = {
      identifier: 'monthly_pro',
      packageType: 'MONTHLY',
      product: {
        identifier: 'monthly_pro',
        price: 6.99,
        currencyCode: 'CAD',
        subscriptionPeriod: 'P1M',
      },
    };
    expect(formatSubscriptionDisplayPrice(fallback)).toMatch(/6\.99.*\/month/);
  });
});
