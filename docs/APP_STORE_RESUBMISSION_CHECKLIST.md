# App Store resubmission checklist (subscriptions)

Use this before uploading a new iOS build for **My Tackle Box** (`com.fishinglure.analyzer`). It reflects Apple feedback on auto-renewable subscriptions (3.1.2) and IAP completeness (2.1).

---

## 1. Agreements & account (App Store Connect)

- [x] **Account Holder** has accepted the **Paid Apps Agreement** (App Store Connect → **Agreements, Tax, and Banking** → Business). Status must be **Active**, not Pending.
- [x] **Banking and tax** forms are complete if the agreement requires them.

---

## 2. App metadata (App Store Connect)

- [ ] **Privacy Policy URL** (App Privacy / privacy policy field) is set to a **working HTTPS** URL that shows your full privacy policy in a browser (not a login wall, not a 404).
- [ ] **Terms of Use (EULA)** URL is in the place Apple expects for your listing (**App Description** and/or **EULA** field — use whichever Apple shows for your app type). Same URL the app opens for “Terms of Use (EULA)” is best.
- [ ] URLs match what you ship in the binary (`EXPO_PUBLIC_PRIVACY_POLICY_URL` / `EXPO_PUBLIC_TERMS_OF_USE_URL` in EAS secrets, or the documented fallbacks in `frontend/src/core/config/index.js`).

---

## 3. In-app subscription purchase screen

Confirm on a **release/TestFlight build** (not only Expo Go), on **iPhone and iPad**:

- [ ] **Title** of the subscription (or product name) is visible before purchase.
- [ ] **Length** (e.g. monthly / annual) is visible.
- [ ] **Price** (localized string from the store) is visible.
- [ ] **Privacy Policy** is a tappable link that opens in Safari (or in-app browser) and loads correctly.
- [ ] **Terms of Use (EULA)** is a tappable link and loads correctly.
- [ ] Short **auto-renewal** copy is present (you already have renewal/charge language on the paywall).

Implementation reference: `frontend/src/screens/PaywallScreen.js` + `LEGAL` in `frontend/src/core/config/index.js`.

---

## 4. Hosted legal pages

- [ ] Opening the **exact** production URLs shows readable terms and privacy (prefer **standalone HTML**; avoid fragile redirects to raw `.md` if you can).
- [ ] After any doc change, redeploy GitHub Pages (or your host) **before** recording video for Apple.

---

## 5. In-App Purchases & RevenueCat

**App Store Connect**

- [ ] Auto-renewable subscriptions exist for the same products the app sells (e.g. align with RevenueCat / app config — currently `monthly_pro` and `yearly_pro` in `frontend/src/core/config/index.js`).
- [ ] Each IAP has **complete metadata** (display name, description, pricing, localization as required).
- [ ] **App Review screenshot** is attached to **each** subscription/IAP (required to submit IAPs for review).
- [ ] All subscription IAPs are **submitted for review** together with this app version (new binary after attaching IAPs if needed).

**RevenueCat dashboard**

- [ ] iOS **production** API key matches EAS secret `EXPO_PUBLIC_RC_IOS_PRODUCTION_KEY` for **store** builds.
- [ ] **Offering** includes the live App Store products; entitlement id matches app (`MyTackleBox Pro` in config).
- [ ] No mismatch between App Store Connect product IDs and RevenueCat / app `SUBSCRIPTION.productIds`.

---

## 6. Purchase flow (sandbox)

On **iPad** (Apple reviewed on iPad Air) and iPhone:

- [ ] Sign in with a **Sandbox** Apple ID for testing purchases.
- [ ] Paywall loads **real** packages (not only fallback placeholders — if subscribe always errors, check RevenueCat offerings and ASC product state).
- [ ] **Subscribe** completes or shows a normal cancel flow; no generic “configuration” / broken purchase for reviewers.
- [ ] **Restore purchases** runs without a misleading hard error for a valid subscriber.

---

## 7. Build & version

- [ ] `version` / `ios.buildNumber` in `frontend/app.json` incremented appropriately for this submission (`buildNumber` must increase for each App Store upload).
- [ ] EAS **production** / **production-ios** profile used for the store binary.
- [ ] Required `EXPO_PUBLIC_*` secrets present for that profile (Supabase, backend, RevenueCat iOS production, legal URLs).

---

## 8. App Review Information

- [ ] **Notes** field summarizes: legal links on paywall; metadata URLs; IAPs submitted; Paid Apps Agreement active; tested purchase on iPad sandbox.
- [ ] Optional but recommended: attach or link a **short screen recording** (paywall → privacy → terms → subscribe test) in the reply to Apple’s last message when resubmitting.

---

## 9. Final smoke test before “Submit for Review”

- [ ] Fresh install (or delete app) → sign up / sign in → open paywall → legal links → purchase test.
- [ ] No debug-only subscription overrides in release builds (`subscriptionService` test overrides are dev-only; confirm no accidental staging keys).

---

*Last aligned with Apple feedback: subscriptions disclosure in-app, IAP submitted with binary, purchase errors on iPad, Paid Apps Agreement.*
