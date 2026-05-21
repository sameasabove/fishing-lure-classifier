const {
  getPackageBillingPeriod,
  formatSubscriptionDisplayPrice,
  formatSubscriptionPriceSummary,
  getCanonicalPriceAmount,
  getPlanLabel,
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

  it('always shows canonical CAD for monthly_pro and yearly_pro', () => {
    const staleMonthly = {
      identifier: '$rc_monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'monthly_pro',
        price: 4.99,
        currencyCode: 'USD',
        priceString: '$4.99',
        subscriptionPeriod: 'P1M',
      },
    };
    const staleYearly = {
      identifier: '$rc_annual',
      packageType: 'ANNUAL',
      product: {
        identifier: 'yearly_pro',
        price: 39.99,
        currencyCode: 'USD',
        priceString: '$39.99',
        subscriptionPeriod: 'P1Y',
      },
    };
    expect(formatSubscriptionDisplayPrice(staleMonthly)).toBe('CA$6.99/month');
    expect(formatSubscriptionDisplayPrice(staleYearly)).toBe('CA$49.99/year');
    expect(getCanonicalPriceAmount(staleMonthly)).toBe(6.99);
    expect(getCanonicalPriceAmount(staleYearly)).toBe(49.99);
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

  it('uses pricePerMonthString for monthly plans when available', () => {
    const pkg = {
      identifier: '$rc_monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'monthly_pro',
        price: 4.99,
        currencyCode: 'USD',
        priceString: '$4.99',
        pricePerMonthString: 'CA$6.99',
        subscriptionPeriod: 'P1M',
      },
    };
    expect(formatSubscriptionDisplayPrice(pkg)).toBe('CA$6.99/month');
  });

  it('builds price summary for settings', () => {
    expect(formatSubscriptionPriceSummary([monthlyPkg, yearlyPkg])).toBe(
      'CA$6.99/month · CA$49.99/year'
    );
  });

  it('uses app plan labels not store product title', () => {
    expect(getPlanLabel(monthlyPkg).title).toBe('Monthly');
    expect(getPlanLabel(yearlyPkg).billing).toBe('Billed once per year');
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
