# How to Confirm RevenueCat Is Connected

You’re “connected to RevenueCat” when the app can talk to RevenueCat’s servers and the SDK is configured. Here’s how to confirm that.

---

## 1. In the app (easiest): Run Diagnostics

1. **Sign in** (RevenueCat is initialized only after login).
2. Open **Subscription Test** (dev only): from the app menu/navigation go to the **Subscription Test** screen.
3. Tap **Run diagnostics** (or the button that runs `diagnoseSubscriptions()`).
4. In the alert, check:
   - **Configured: ✅** → The SDK is configured and **connected to RevenueCat**.  
   - **Configured: ❌** → Not connected (see “If it’s not connected” below).
   - **Offerings: ✅** → Products/offerings are set up in the RevenueCat dashboard and the app can fetch them.  
   - **Offerings: ❌** → Connected, but no offerings (or wrong app/API key). Fix in RevenueCat dashboard.

So: **Configured: ✅ = connected to RevenueCat.** Offerings: ✅ = products are available.

---

## 2. In the code: What “connected” means

Connection is confirmed when the SDK can reach RevenueCat and return data:

- **Initialization** (on login):  
  `Purchases.configure({ apiKey, appUserID: userId })` is called in `AuthContext` after sign-in. If it doesn’t throw, configuration ran.
- **Proof of connection**:  
  Right after that we call `Purchases.getCustomerInfo()`. If that **succeeds**, the app has:
  - Reached RevenueCat’s servers  
  - Authenticated with your API key  
  - Created or found a customer for `userId`  

So in code, **“connected properly” = `Purchases.getCustomerInfo()` succeeds** (no throw).  
The **Diagnostics** screen does exactly that and reports it as **Configured: ✅/❌**.

---

## 3. In the RevenueCat dashboard

After you’ve signed in and the app has run at least once with RevenueCat initialized:

1. Open [RevenueCat Dashboard](https://app.revenuecat.com) → your project.
2. Go to **Customers**.
3. Search for your app user ID (same as your Supabase/auth user ID).

If you see that customer and (optionally) “First seen” / “Last seen” updated when you use the app, RevenueCat is receiving requests from your app — i.e. **connected**.

---

## 4. Console logs (development)

In dev, the app logs to the Metro/console:

- `[Subscriptions] Initializing with API key: test_dUUNi...` (or your key prefix)  
- `[Subscriptions] ✓ Initialized successfully, customer ID: <your-user-id>`  

If you see **Initialized successfully** and a **customer ID**, the SDK is configured and has successfully called RevenueCat (i.e. **connected**).

---

## Quick checklist

| Check | What it means |
|-------|----------------|
| **Configured: ✅** in Diagnostics | App is **connected to RevenueCat**. |
| **Offerings: ✅** in Diagnostics | Products are set up; paywall can load packages. |
| Customer appears in RevenueCat dashboard | RevenueCat is receiving requests from your app. |
| Console: “Initialized successfully, customer ID: …” | Init and first API call to RevenueCat succeeded. |

---

## If it’s not connected (Configured: ❌)

- **Not signed in**  
  RevenueCat is only initialized after login. Sign in and try again.

- **Wrong or placeholder API key**  
  In `subscriptionService.js`, `getApiKey()` must return the key for your RevenueCat project (test key in dev, production key in production builds). If the key is wrong or a placeholder, configuration can fail or not connect.

- **Network / firewall**  
  The device must be able to reach RevenueCat (e.g. `api.revenuecat.com`). Try another network or disable VPN.

- **SDK not configured yet**  
  If `Purchases.getCustomerInfo()` throws (e.g. “not configured”), the SDK wasn’t configured. That usually means `initializeSubscriptions(userId)` wasn’t called or failed before `Purchases.configure()` (e.g. no `userId`). Check `AuthContext` and that you’re logged in.

Running **Diagnostics** and checking **Configured** is the single place in the app that directly answers: “Is the app connected to RevenueCat?”
