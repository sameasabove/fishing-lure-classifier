# RevenueCat Subscription Setup Guide

Complete step-by-step guide to enable subscriptions in your Fishing Lure App.

---

## 📋 Prerequisites

- [ ] Apple Developer Account ($99/year)
- [ ] Google Play Developer Account ($25 one-time)
- [ ] App listing created in App Store Connect & Google Play Console
- [ ] Supabase project configured
- [ ] Backend deployed and running

---

## 🚀 Step 1: Install RevenueCat SDK

```bash
cd FishingLureApp
npm install react-native-purchases
cd ios && pod install && cd ..
```

---

## 🎯 Step 2: Create RevenueCat Account

1. Go to [https://app.revenuecat.com/signup](https://app.revenuecat.com/signup)
2. Create a free account
3. Create a new project: **"Fishing Lure App"**
4. Note your **Public SDK Key** (you'll need this later)

---

## 🍎 Step 3: Configure iOS (App Store Connect)

### 3.1 Create App Listing
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → **+** → New App
3. Fill in app details:
   - **Name**: Fishing Lure Identifier
   - **Bundle ID**: (your app's bundle ID)
   - **SKU**: fishing-lure-app
   - **User Access**: Full Access

### 3.2 Create Subscription Products
1. In your app → Features → **In-App Purchases**
2. Click **+** to create subscriptions

**Monthly Subscription:**
```
Reference Name: My Tackle Box PRO Monthly
Product ID: monthly_pro
Type: Auto-Renewable Subscription
Subscription Group: pro_access
Price: CA$6.99/month (Canada App Store)
```

**Yearly Subscription:**
```
Reference Name: My Tackle Box PRO Yearly
Product ID: yearly_pro
Type: Auto-Renewable Subscription
Subscription Group: pro_access
Price: CA$49.99/year (Canada App Store)
```

### 3.3 Connect to RevenueCat
1. RevenueCat Dashboard → **Project Settings** → **Apple App Store**
2. Click **Connect to App Store Connect**
3. Generate and upload App Store Connect API Key
4. Enter your Bundle ID
5. Select your app from the dropdown

---

## 🤖 Step 4: Configure Android (Google Play Console)

### 4.1 Create App Listing
1. Go to [Google Play Console](https://play.google.com/console)
2. Create app → Fill in details
3. Complete store listing

### 4.2 Create Subscription Products
1. Monetize → **Subscriptions** → Create subscription

**Monthly Subscription:**
```
Product ID: monthly_pro
Name: My Tackle Box PRO (Monthly)
Description: Unlimited lure scans and advanced features
Price: CA$6.99/month (set per region in Play Console)
Free trial: 7 days (optional)
Billing period: 1 month
```

**Yearly Subscription:**
```
Product ID: yearly_pro
Name: My Tackle Box PRO (Yearly)
Description: Unlimited lure scans - Save about 40%!
Price: CA$49.99/year (set per region in Play Console)
Billing period: 1 year
```

### 4.3 Connect to RevenueCat
1. RevenueCat Dashboard → **Project Settings** → **Google Play Store**
2. Upload Service Account JSON
3. Enter your Package Name
4. Verify connection

---

## ⚙️ Step 5: Configure RevenueCat Entitlements

1. RevenueCat Dashboard → **Entitlements**
2. Click **+ New Entitlement**
3. Create entitlement:
   ```
   Identifier: pro
   Display Name: PRO Access
   Description: Unlocks all PRO features
   ```

4. **Attach Products** to "MyTackleBox Pro" entitlement:
   - ✓ monthly_pro
   - ✓ yearly_pro

5. Click **Save**

---

## 🔧 Step 6: Configure React Native App

### 6.1 Update Subscription Service

Edit `FishingLureApp/src/services/subscriptionService.js`:

```javascript
// Replace these with your actual keys from RevenueCat Dashboard
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_KEY_HERE';

// Product IDs must match what you created in stores
export const PRODUCT_IDS = {
  MONTHLY: 'monthly_pro',
  YEARLY: 'yearly_pro',
};
```

### 6.2 Update App.js

Edit `FishingLureApp/App.js` to initialize subscriptions:

```javascript
import { initializeSubscriptions } from './src/services/subscriptionService';
import { getCurrentUser } from './src/services/supabaseService';

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);
  
  const initializeApp = async () => {
    try {
      // Wait for auth
      const user = await getCurrentUser();
      
      if (user) {
        // Initialize RevenueCat with user ID
        await initializeSubscriptions(user.id);
      }
    } catch (error) {
      console.error('App init error:', error);
    }
  };
  
  // ... rest of your app
}
```

### 6.3 Add Paywall to Navigation

Edit `FishingLureApp/App.js` (or your navigation file):

```javascript
import PaywallScreen from './src/screens/PaywallScreen';

// Add to your Stack.Navigator
<Stack.Screen 
  name="Paywall" 
  component={PaywallScreen}
  options={{ title: 'Upgrade to PRO' }}
/>
```

---

## 🗄️ Step 7: Set Up Supabase

Run the SQL in Supabase SQL Editor:

```bash
# 1. Open Supabase Dashboard → SQL Editor
# 2. Run: supabase_subscriptions_schema.sql
# 3. Verify tables created:
#    - user_subscriptions
#    - subscription_stats view
```

---

## 🌐 Step 8: Update Backend (Flask)

The backend endpoints are already added to `app.py`:

- ✅ `/api/verify-subscription` - Check if user is PRO
- ✅ `/api/check-scan-quota` - Check if user can scan
- ✅ `/api/subscription-stats` - Get subscription stats

Make sure your backend is deployed and accessible from the mobile app.

---

## 🧪 Step 9: Testing

### iOS Testing (Sandbox)
1. **Create Sandbox Tester:**
   - App Store Connect → Users and Access → Sandbox Testers
   - Create test account (use fake email)

2. **Test on Device:**
   - Sign out of App Store on test device
   - Run your app
   - Attempt purchase
   - Sign in with sandbox tester account
   - Purchase should go through (not charged)

3. **Verify:**
   - Check RevenueCat Dashboard → Customers
   - Check Supabase → user_subscriptions table
   - Test PRO features in app

### Android Testing
1. **Add License Testers:**
   - Google Play Console → Setup → License testing
   - Add test Gmail accounts

2. **Upload Internal Test Build:**
   - Build → Internal testing
   - Upload AAB
   - Add testers

3. **Test Purchases:**
   - Install from Play Store (internal test track)
   - Make test purchase
   - Verify in RevenueCat Dashboard

---

## 📱 Step 10: Integrate Quota Checking

Update your camera/scan screen to check quota before scanning:

```javascript
import { canUserScan } from '../services/subscriptionService';

const handleScan = async (imageUri) => {
  // Check if user can scan
  const scanCheck = await canUserScan();
  
  if (!scanCheck.canScan) {
    // Show paywall
    navigation.navigate('Paywall', {
      message: "You've used all 10 free scans this month!"
    });
    return;
  }
  
  // Proceed with scan
  const result = await analyzeLure(imageUri);
  // ... rest of code
};
```

---

## 🎨 Step 11: Add Quota Display

Show scan count in your UI:

```javascript
import { getQuotaStatus } from '../services/subscriptionService';

function Header() {
  const [quota, setQuota] = useState(null);
  
  useEffect(() => {
    loadQuota();
  }, []);
  
  const loadQuota = async () => {
    const status = await getQuotaStatus();
    setQuota(status);
  };
  
  return (
    <View>
      <Text>{quota?.message}</Text>
      {!quota?.unlimited && (
        <Text>{quota?.subtitle}</Text>
      )}
    </View>
  );
}
```

---

## ✅ Pre-Launch Checklist

### RevenueCat
- [ ] Account created
- [ ] Project configured
- [ ] iOS app connected
- [ ] Android app connected
- [ ] Entitlements configured
- [ ] Products attached to entitlements

### App Stores
- [ ] iOS: Subscription products approved
- [ ] Android: Subscription products active
- [ ] Tested in sandbox/internal testing
- [ ] Screenshots include PRO features

### Code
- [ ] RevenueCat SDK installed
- [ ] API keys configured
- [ ] Subscription service implemented
- [ ] Paywall screen created
- [ ] Quota checking added
- [ ] App initialization updated

### Backend
- [ ] Supabase schema deployed
- [ ] Backend endpoints working
- [ ] Subscription validation tested

### Legal
- [ ] Privacy policy updated (mentions subscriptions)
- [ ] Terms of service created
- [ ] Auto-renewal terms disclosed

---

## 🐛 Troubleshooting

### "No packages found"
- Check RevenueCat dashboard for product status
- Verify products are attached to entitlements
- Make sure products are "Ready to Submit" in App Store Connect

### "Purchase failed"
- Check sandbox tester account (iOS)
- Verify test account added (Android)
- Check RevenueCat logs in dashboard

### "Quota not working"
- Verify Supabase connection
- Check user_subscriptions table exists
- Test backend endpoint: `/api/check-scan-quota?user_id=XXX`

### "Subscription not syncing"
- Check Supabase service_role key is correct
- Verify RLS policies allow inserts
- Check mobile app logs for sync errors

---

## 📊 Monitoring

### RevenueCat Dashboard
- Customer list
- Revenue charts
- Churn analysis
- Active subscriptions

### Supabase
```sql
-- Get subscription stats
SELECT * FROM subscription_stats;

-- Find PRO users
SELECT * FROM user_subscriptions WHERE is_pro = true;

-- Check quota usage
SELECT user_id, COUNT(*) as scans_this_month
FROM lure_analyses
WHERE created_at >= date_trunc('month', NOW())
GROUP BY user_id
ORDER BY scans_this_month DESC;
```

---

## 💰 Revenue Tracking

RevenueCat provides:
- Real-time revenue tracking
- Charts and analytics
- Cohort analysis
- Churn prediction
- Webhook integration

Access at: https://app.revenuecat.com/charts

---

## 🚀 Going Live

1. **Submit for Review:**
   - iOS: App Store Connect → Submit for Review
   - Android: Google Play Console → Promote to Production

2. **Wait for Approval:**
   - iOS: 1-3 days typically
   - Android: Usually faster, sometimes hours

3. **Launch!**
   - Monitor RevenueCat dashboard
   - Watch for user feedback
   - Track conversion rates

---

## 📞 Support

- **RevenueCat Docs**: https://docs.revenuecat.com
- **RevenueCat Support**: support@revenuecat.com
- **Slack Community**: https://community.revenuecat.com

---

**Estimated Setup Time**: 3-4 hours

**Questions?** Check the troubleshooting section or RevenueCat docs!

