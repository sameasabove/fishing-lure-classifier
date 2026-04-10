# 🔑 App Store Connect API Key Setup for RevenueCat

## ⚠️ Correct Order

You **CANNOT** complete RevenueCat setup without:

1. ✅ **Apple Developer Program membership** ($99/year)
2. ✅ **App listing created** in App Store Connect
3. ✅ **App Store Connect API key generated**

Then you can:
4. ✅ **Connect to RevenueCat** using the API key

---

## 📋 Step-by-Step: Generate App Store Connect API Key

### Prerequisites
- [ ] Apple Developer Program membership ($99/year)
- [ ] App listing created in App Store Connect
- [ ] Account Admin or App Manager role in App Store Connect

---

### Step 1: Create API Key in App Store Connect

1. **Go to App Store Connect:**
   - Visit: https://appstoreconnect.apple.com
   - Sign in with your Apple Developer account

2. **Navigate to Users and Access:**
   - Click your name/account in top right
   - Select **"Users and Access"** from dropdown
   - Or go directly: https://appstoreconnect.apple.com/access/users

3. **Go to Keys Tab:**
   - Click on **"Keys"** tab at the top
   - You'll see "App Store Connect API" section

4. **Generate New API Key:**
   - Click **"+ Generate API Key"** button
   - **Name**: `RevenueCat Integration` (or any descriptive name)
   - **Access**: Select **"App Manager"** or **"Developer"**
     - This key needs access to read subscriptions/products
   - Click **"Generate"**

5. **Download the Key:**
   - ⚠️ **IMPORTANT**: You can only download this ONCE!
   - Click **"Download API Key"** immediately
   - The file will be named: `AuthKey_XXXXXXXXXX.p8`
   - Save it somewhere secure (you'll need it for RevenueCat)
   - Note the **Key ID** shown (you'll need this too)

6. **Save These Details:**
   ```
   Key ID: ABCDEFGHIJ (example - yours will be different)
   Issuer ID: 12345678-1234-1234-1234-123456789012
   Key File: AuthKey_XXXXXXXXXX.p8
   ```

---

### Step 2: Get Your Issuer ID

1. **Still in App Store Connect:**
   - Stay on the **"Keys"** tab
   - Look at the top right of the page
   - You'll see: **"Issuer ID: 12345678-1234-1234-1234-123456789012"**
   - Copy this (it's shown at the top of the Keys page)

---

### Step 3: Connect to RevenueCat

1. **Go back to RevenueCat:**
   - You're on Step 2: "Set up App Store Connect API Configuration"

2. **Enter Your Details:**
   - **Key ID**: Paste the Key ID from Step 1
   - **Issuer ID**: Paste the Issuer ID from Step 2
   - **Private Key**: Open the `.p8` file you downloaded
     - Copy the entire contents (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
     - Paste it into RevenueCat

3. **Click Continue/Connect**

4. **Select Your App:**
   - RevenueCat will fetch your apps from App Store Connect
   - Select **"MyTackleBox"** (or your app name)
   - Click **Continue**

---

## 🎯 What You Need Before This Step

### Must Have:
- ✅ Apple Developer Program membership
- ✅ App listing created in App Store Connect
- ✅ Account access to App Store Connect

### Can Skip For Now:
- ❌ Subscription products (can create later)
- ❌ Google Play setup (can do separately)

---

## 💡 Alternative: Skip App Store Connect Setup (Temporarily)

**You CAN skip this step in RevenueCat for now:**

1. Click **"Skip"** or **"I'll do this later"** in RevenueCat
2. Set up Google Play first (if you have that account)
3. Come back to App Store Connect setup later

**RevenueCat allows partial setup** - you can:
- Set up iOS later
- Set up Android now (if ready)
- Complete iOS setup when you have Apple Developer account

---

## 📝 Quick Checklist

### Before RevenueCat:
- [ ] Apple Developer Program membership ($99/year)
- [ ] App listing in App Store Connect
- [ ] App Store Connect API key generated
- [ ] Key ID copied
- [ ] Issuer ID copied  
- [ ] `.p8` file downloaded

### In RevenueCat:
- [ ] Enter Key ID
- [ ] Enter Issuer ID
- [ ] Paste private key (.p8 file contents)
- [ ] Select your app
- [ ] Continue to next step

---

## ⚠️ Important Notes

1. **You can only download the `.p8` file ONCE** - save it securely!
2. **Key ID and Issuer ID are different** - you need both
3. **The private key includes the header/footer lines** - copy the entire file
4. **You can skip this step** and come back later if you don't have Apple Developer account yet

---

## 🔄 Correct Order Summary

### Option A: Complete Setup (Recommended)
1. Get Apple Developer Program
2. Create app listing
3. Generate API key
4. Connect to RevenueCat
5. Create subscription products
6. Finish RevenueCat setup

### Option B: Partial Setup (If No Apple Account Yet)
1. Create RevenueCat account ✅ (done!)
2. Skip App Store Connect step
3. Set up Google Play (if ready)
4. Come back to iOS setup later

---

## ❓ Common Questions

**Q: Can I skip this step?**
A: Yes! Click "Skip" or "I'll do this later" - RevenueCat allows partial setup.

**Q: Do I need subscription products first?**
A: No! You can create products after connecting. RevenueCat will discover them.

**Q: Can I set up Android first?**
A: Yes! You can configure Google Play independently in RevenueCat.

**Q: What if I lose the .p8 file?**
A: You'll need to create a new API key and revoke the old one.

---

**Bottom Line:** If you don't have an Apple Developer account yet, **skip this step** and set up Android first, or come back to it later! 🚀

