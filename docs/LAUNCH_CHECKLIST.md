# My Tackle Box – Apple App Store launch checklist (Canada only)

**One file. Follow in order. Check off as you go.**

---

## Prerequisites

- [x] **Apple Developer Program** ($99/year) – [developer.apple.com](https://developer.apple.com/programs/)
- [x] **App** created in App Store Connect (My Apps → + → New App): name **My Tackle Box**, Bundle ID matches your app
- [x] **Backend** live: `https://fishing-lure-backend.onrender.com/health` returns OK
- [x] **RevenueCat** account and project created

---

## Phase 1: App Store Connect – In-App Purchases (do this first)

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **My Tackle Box** → **Features** → **In-App Purchases**.
2. **Subscription group**
   - [ ] Use your **existing** subscription group, or create one (e.g. "My Tackle Box Subscriptions"). You can add or edit subscriptions inside it.

3. **Monthly subscription**
   - [ ] Add subscription → **Auto-Renewable**.
   - [ ] **Product ID:** `monthly_pro` (must match exactly).
   - [ ] **Reference name:** Monthly Pro Subscription.
   - [ ] **Duration:** 1 month.
   - [ ] **Price:** Add price for **Canada (CAD)** – e.g. ~$6.99 CAD (or use Apple’s equivalent to $4.99 USD). Early adoption.
   - [ ] **Display name:** Monthly Pro.
   - [ ] **Description:** Unlimited lure scans, full catch tracking, all premium features. Billed monthly.
   - [ ] **Availability:** This subscription → **Availability** → **Select specific countries** → **Canada only**.
   - [ ] Save / submit for review with app.

4. **Yearly subscription**
   - [ ] Add subscription → **Auto-Renewable**.
   - [ ] **Product ID:** `yearly_pro` (must match exactly).
   - [ ] **Reference name:** Yearly Pro Subscription.
   - [ ] **Duration:** 1 year.
   - [ ] **Price:** Add price for **Canada (CAD)** – e.g. ~$54.99 CAD (or Apple’s equivalent to $39.99 USD). Early adoption.
   - [ ] **Display name:** Yearly Pro.
   - [ ] **Description:** Save 33%! Unlimited lure scans, full catch tracking, all premium features. Billed annually.
   - [ ] **Availability:** **Canada only**.
   - [ ] Save / submit for review with app.

---

## Phase 2: App Store Connect – App information

1. **My Apps** → **My Tackle Box** → **App Store** tab → select **English (U.S.)** (or add English (Canada)).
2. Fill in (copy from below or adjust):

   - [ ] **Name:** My Tackle Box
   - [ ] **Subtitle** (30 chars): AI Lure ID & Catch Tracker
   - [ ] **Promotional Text** (170 chars, optional): The ultimate fishing companion! Identify any lure with AI, track your catches, and organize your tackle box.
   - [ ] **Keywords** (100 chars): fishing,lure,bass,tackle,fish,identify,catalog,catch,angler,bait,tacklebox
   - [ ] **Support URL:** https://ericfernandes71.github.io/fishing-lure-classifier/
   - [ ] **Privacy Policy URL:** https://ericfernandes71.github.io/fishing-lure-classifier/PRIVACY_POLICY.html
   - [ ] **Category:** Sports (or Lifestyle)
   - [ ] **Age rating:** Complete questionnaire (likely 4+)

3. **Description** (4000 chars max) – paste the block below (correct pricing: $4.99 / $39.99, 10 free scans, no lifetime):

   ```
   MY TACKLE BOX - YOUR DIGITAL FISHING COMPANION

   Transform your fishing experience with My Tackle Box: AI-powered lure identification, catch tracking, and tackle box management.

   KEY FEATURES

   AI-POWERED LURE IDENTIFICATION
   - Photo any lure for instant AI analysis
   - Lure type, target species, techniques, best conditions
   - Built with Canadian fishing in mind

   DIGITAL TACKLE BOX
   - Organize lures with notes and photos
   - Favorites, filters, cloud sync

   CATCH TRACKING
   - Log catches with photos, species, location, conditions
   - See which lures perform best

   CLOUD SYNC
   - Data syncs across devices; secure backup

   SUBSCRIPTION OPTIONS (early adoption pricing)

   FREE:
   - 10 lure scans per month
   - Basic tackle box and catch tracking

   PRO MONTHLY - $4.99/month:
   - Unlimited lure scans
   - Full catch tracking and tackle box features
   - All premium features

   PRO YEARLY - $39.99/year:
   - Save 33% vs monthly
   - All PRO features

   PRIVACY & SECURITY
   - Your data is private and secure; we don’t sell user data.

   Download My Tackle Box and take your fishing to the next level.

   SUPPORT: mytackleboxapp@gmail.com
   Privacy: https://ericfernandes71.github.io/fishing-lure-classifier/PRIVACY_POLICY.html
   Terms: https://ericfernandes71.github.io/fishing-lure-classifier/TERMS_OF_SERVICE.html
   ```

   - [ ] **Description** pasted and saved.

---

## Phase 3: App Store Connect – Screenshots, version, review, privacy, availability

- [ ] **Screenshots:** Upload at least **3** for **iPhone 6.7"** (1290 × 2796 px). Ideas: Home/scan, analysis result, tackle box, catch tracking, paywall.
- [ ] **Version:** Set (e.g. 1.0.0). **What’s New:** e.g. "Initial release – AI lure ID and catch tracking (Canada)."
- [ ] **Build:** Leave empty for now; you’ll select the build after uploading (Phase 5).
- [ ] **Review information:**
  - [ ] **Contact:** Your name, phone, email.
  - [ ] **Demo account (PRO access for reviewers):** Create a test account so Apple can sign in and see all paywalled features. Use the steps below, then put that account’s **username (email)** and **password** in the App Review section.
  - [ ] **Notes:** e.g. "Demo account has PRO access so reviewers can test all features. Subscriptions can also be tested with a Sandbox Apple ID. App is Canada-only for launch."

**Demo account with PRO (for App Review):**
1. **Create the account:** Sign up in your app (or Supabase Auth) with an email and password you’ll give to Apple (e.g. `appreview@yourdomain.com`). Note the user’s **UUID** from Supabase → Authentication → Users.
2. **Grant PRO in Supabase** (so backend allows unlimited scans): In Supabase → SQL Editor, run (replace `USER_UUID_HERE` with the user’s UUID):
   ```sql
   INSERT INTO public.user_subscriptions (user_id, is_pro, subscription_type, product_identifier, will_renew)
   VALUES ('USER_UUID_HERE', true, 'yearly', 'yearly_pro', true)
   ON CONFLICT (user_id) DO UPDATE SET is_pro = true, subscription_type = 'yearly', product_identifier = 'yearly_pro', will_renew = true, updated_at = NOW();
   ```
3. **Grant PRO in RevenueCat** (so the app shows PRO in the UI): Open the app once signed in as that user (so RevenueCat has the customer). In RevenueCat → **Customers** → find that user (by App User ID = the same UUID) → **Grant promotional entitlement** "MyTackleBox Pro" (or your entitlement ID). If you don’t see the user yet, sign in on a device with that account and open the app, then refresh RevenueCat.
4. **Give Apple:** In App Review Information, set **Username** = that email, **Password** = that password.
- [ ] **App Privacy:** Declare data types (e.g. Photos, User Content, Identifiers, Purchases).
- [ ] **Pricing and availability:**
  - [ ] **Price:** Free (with in-app purchases).
  - [ ] **Availability:** **Edit** → **Select specific countries and regions** → **deselect all** → select **Canada only** → Save.

---

## Phase 4: RevenueCat

- [ ] **Products:** In RevenueCat, products with IDs `monthly_pro` and `yearly_pro` (match App Store Connect). No lifetime.
- [ ] **Entitlement:** "MyTackleBox Pro" (or your ID) attached to both products.
- [ ] **Apple connection:** Project Settings → Apple App Store → connected with **App-Specific Shared Secret** from App Store Connect (My Apps → My Tackle Box → App Information → App-Specific Shared Secret).
- [ ] **App code:** `FishingLureApp/src/services/subscriptionService.js` – `REVENUECAT_API_KEY_IOS_PRODUCTION` is your production key (starts with `appl_`).

---

## Phase 5: Build and upload

- [ ] **Version & build:** In `FishingLureApp/app.json`: `expo.version` is the user-facing version (e.g. **1.0.0** for first release). iOS `buildNumber` must be **higher** than any build already in App Store Connect (e.g. **3**). Bump `buildNumber` for every new build you upload.
- [ ] From project root:
  ```bash
  cd FishingLureApp
  eas build --platform ios --profile production-ios
  ```
- [ ] When build succeeds, submit to App Store:
  ```bash
  eas submit --platform ios --latest
  ```
  (Or download the .ipa from EAS and upload in App Store Connect → TestFlight → build → Distribute App.)
- [ ] In App Store Connect → **My Tackle Box** → **App Store** tab → your version (e.g. 1.0.0) → **Build** → **+** → select the build you just uploaded.
- [ ] Complete **Export Compliance**, **Content Rights**, **Advertising Identifier** if prompted.

---

## Phase 6: Test (recommended)

- [ ] Install via **TestFlight** (yourself or internal testers).
- [ ] Sign in → use **free tier** (10 scans) → open **Paywall** → **Subscribe** with a **Sandbox** account → confirm unlimited scans and cancel flow.
- [ ] Backend health: `https://fishing-lure-backend.onrender.com/health` returns OK.

---

## Phase 7: Submit for review

- [ ] In App Store Connect, on the app version page, click **Submit for Review**.
- [ ] Answer any **encryption / ads** questionnaire.
- [ ] After approval, the app goes **live in Canada only**.

---

## Quick reference

| What | Where |
|------|--------|
| Canada-only app | App Store Connect → Pricing and Availability → Availability → Canada only |
| Canada-only subscriptions | Each subscription → Availability → Canada only |
| CAD prices | Each subscription → Subscription Prices → Add Canada (CAD) |
| Product IDs | Exactly `monthly_pro`, `yearly_pro` (app + RevenueCat) |
| Demo login for Apple | Review Information → Demo account (Sandbox tester) |

---

**This is the only step-by-step file you need for Apple launch (Canada).**  
For long-form copy variants or Google Play later, see `APP_STORE_ASSETS_MYTACKLEBOX.md` (update pricing there to $4.99 / $39.99 and remove lifetime if you use it).
