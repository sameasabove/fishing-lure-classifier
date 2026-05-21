# 🚀 RevenueCat Production Setup Guide

## Step-by-Step Instructions to Get Production Keys

---

## Step 1: Log into RevenueCat Dashboard

1. Go to: https://app.revenuecat.com/
2. Log in with your account
3. Select your project (or create one if you haven't)

---

## Step 2: Get Production API Keys

### For iOS:
1. In RevenueCat dashboard, go to: **Project Settings** → **API Keys**
2. Look for the **iOS** section
3. Find the key that starts with `appl_` (this is the production key)
4. Copy the entire key (it will look like: `appl_xxxxxxxxxxxxxxxxxxxxx`)

### For Android:
1. In the same **API Keys** section
2. Look for the **Android** section  
3. Find the key that starts with `goog_` (this is the production key)
4. Copy the entire key (it will look like: `goog_xxxxxxxxxxxxxxxxxxxxx`)

**Note:** If you don't see production keys yet, you may need to:
- Make sure you're on a paid RevenueCat plan (or free tier allows production)
- Or wait until you connect to app stores

---

## Step 3: Update Your Code

Once you have the production keys, I'll help you update `subscriptionService.js`:

**Current (Test Keys):**
```javascript
const REVENUECAT_API_KEY_IOS = 'test_dUUNiOeOwXcEMWFAsvnVGrKkMvp';
const REVENUECAT_API_KEY_ANDROID = 'test_dUUNiOeOwXcEMWFAsvnVGrKkMvp';
```

**Will become (Production Keys):**
```javascript
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_PRODUCTION_IOS_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_PRODUCTION_ANDROID_KEY_HERE';
```

---

## Step 4: Connect RevenueCat to App Stores

### Connect to App Store Connect (iOS):

1. In RevenueCat dashboard, go to: **Integrations** → **App Store Connect**
2. Click **Connect** or **Add Integration**
3. You'll need:
   - App Store Connect API Key (from Apple)
   - Or use App Store Connect login
4. Follow the setup wizard
5. Select your app: `com.fishinglure.analyzer`
6. RevenueCat will sync your subscription products

### Connect to Google Play Console (Android):

1. In RevenueCat dashboard, go to: **Integrations** → **Google Play**
2. Click **Connect** or **Add Integration**
3. You'll need:
   - Google Play Service Account JSON file
   - Or use OAuth login
4. Follow the setup wizard
5. Select your app: `com.fishinglure.analyzer`
6. RevenueCat will sync your subscription products

---

## Step 5: Verify Your Products

Make sure in RevenueCat dashboard you have:

### Entitlement:
- **Identifier:** `MyTackleBox Pro`
- **Display Name:** MyTackleBox Pro

### Products:
- **monthly_pro** - Auto-renewable subscription
- **yearly_pro** - Auto-renewable subscription

Both products should be attached to the `MyTackleBox Pro` entitlement.

### Offering:
- **Default offering** should include monthly and yearly packages only (no lifetime)

---

## Step 6: Create Products in App Stores

### App Store Connect (iOS):

1. Go to App Store Connect: https://appstoreconnect.apple.com/
2. Select your app: MyTackleBox
3. Go to: **Features** → **In-App Purchases**
4. Create subscription group (if first time)
5. Create two subscription products:
   - **Product ID:** `monthly_pro`
     - Type: Auto-Renewable Subscription
     - Price: CA$6.99/month (Canada)
   - **Product ID:** `yearly_pro`
     - Type: Auto-Renewable Subscription
     - Price: CA$49.99/year (Canada)

### Google Play Console (Android):

1. Go to Google Play Console: https://play.google.com/console/
2. Select your app: MyTackleBox
3. Go to: **Monetize** → **Subscriptions** (or **Products** → **In-app products**)
4. Create two products:
   - **Product ID:** `monthly_pro`
     - Type: Subscription
     - Price: CA$6.99/month (Canada)
   - **Product ID:** `yearly_pro`
     - Type: Subscription
     - Price: CA$49.99/year (Canada)

**Important:** Product IDs must match exactly: `monthly_pro`, `yearly_pro`

---

## Step 7: Test Production Build

After updating to production keys:

1. Build production app:
   ```bash
   cd FishingLureApp
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

2. Test on physical device:
   - Verify subscriptions load
   - Test purchase flow (will use sandbox/test accounts)
   - Verify PRO features unlock

---

## ⚠️ Important Notes

1. **Test vs Production:**
   - Test keys (`test_...`) work in development
   - Production keys (`appl_...` or `goog_...`) required for store builds
   - You can't use test keys in production builds

2. **Store Connection:**
   - RevenueCat must be connected to both stores
   - Products must exist in both App Store Connect and Google Play Console
   - Product IDs must match exactly

3. **Timing:**
   - You can get production keys before connecting stores
   - But subscriptions won't work until stores are connected
   - Best to do both before building for stores

---

## 🎯 Quick Checklist

- [ ] Get production iOS API key from RevenueCat
- [ ] Get production Android API key from RevenueCat
- [ ] Update `subscriptionService.js` with production keys
- [ ] Connect RevenueCat to App Store Connect
- [ ] Connect RevenueCat to Google Play Console
- [ ] Create products in App Store Connect
- [ ] Create products in Google Play Console
- [ ] Verify product IDs match exactly
- [ ] Test production build

---

**Ready to start?** Let me know when you have the production API keys and I'll help you update the code! 🚀

