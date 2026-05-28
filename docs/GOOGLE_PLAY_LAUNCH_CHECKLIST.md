# My Tackle Box – Google Play launch checklist (Canada only)

**One file. Follow in order. Check off as you go.**

Mirrors `LAUNCH_CHECKLIST.md` (Apple). Same product IDs, pricing, and legal URLs.

---

## Prerequisites

- [ ] **Google Play Developer account** ($25 one-time) – [play.google.com/console](https://play.google.com/console)
- [ ] **Developer identity verified** (can take 1–3 days on new accounts)
- [ ] **Backend** live: `https://fishing-lure-backend.onrender.com/health` returns OK
- [ ] **RevenueCat** project with entitlement **MyTackleBox Pro** and products `monthly_pro`, `yearly_pro`
- [ ] **EAS secrets** set on [expo.dev](https://expo.dev) → your project → **Secrets** (see Phase 8)
- [ ] **Package name** matches app forever: `com.fishinglure.analyzer` (verify in local `app.config` / `app.json`)

**Legal URLs (use everywhere in Play Console):**

| | URL |
|---|-----|
| Privacy | `https://sameasabove.github.io/fishing-lure-classifier/backend/PRIVACY_POLICY.html` |
| Terms | `https://sameasabove.github.io/fishing-lure-classifier/backend/TERMS_OF_SERVICE.html` |
| Support | `mytackleboxapp@gmail.com` |

**Free vs paid (do not confuse):**

- **Free tier:** 10 lure scans **per calendar month** in the app (not a Play subscription).
- **PRO:** `monthly_pro` / `yearly_pro` — paid auto-renewing subscriptions.
- **No** 7-day free trial or intro offer on Play subscriptions unless you add one on iOS too.

---

## Phase 1: Create the app (Play Console)

1. [play.google.com/console](https://play.google.com/console) → **Create app**
2. [ ] **App name:** My Tackle Box
3. [ ] **Default language:** English (Canada) or English (US)
4. [ ] **App or game:** App · **Free**
5. [ ] Complete declarations → **Create app**
6. [ ] **Package name** when prompted: `com.fishinglure.analyzer` (must match EAS/Android config)

---

## Phase 2: Subscriptions (do this before first production test)

**Monetize → Products → Subscriptions**

### `monthly_pro`

- [ ] **Product ID:** `monthly_pro` (exact)
- [ ] **Name:** My Tackle Box PRO (Monthly)
- [ ] **Description:** Unlimited lure scans, full catch tracking, all premium features. Billed monthly.
- [ ] **Base plan:** 1 month, auto-renewing
- [ ] **Price:** **CA$6.99/month** — **Canada only**
- [ ] **Free trial:** None
- [ ] **Intro offer:** None
- [ ] **Activate** subscription + base plan

### `yearly_pro`

- [ ] **Product ID:** `yearly_pro` (exact)
- [ ] **Name:** My Tackle Box PRO (Yearly)
- [ ] **Description:** Save about 40%. Unlimited lure scans and all PRO features. Billed annually.
- [ ] **Base plan:** 1 year, auto-renewing
- [ ] **Price:** **CA$49.99/year** — **Canada only**
- [ ] **Free trial:** None
- [ ] **Intro offer:** None
- [ ] **Activate** subscription + base plan

**Do not** create a lifetime product.

---

## Phase 3: RevenueCat ↔ Google Play

1. Play Console → **Setup → API access** → link Google Cloud project
2. [ ] Create **service account** → grant access to Play Console (RevenueCat docs: Finance / release permissions as required)
3. [ ] Download **JSON key**
4. RevenueCat → **Project settings → Google Play** → upload JSON
5. [ ] Package name: `com.fishinglure.analyzer`
6. [ ] Verify RevenueCat lists `monthly_pro` and `yearly_pro` attached to **MyTackleBox Pro**

---

## Phase 4: Store listing

**Grow → Store presence → Main store listing**

- [ ] **App name:** My Tackle Box
- [ ] **Short description** (80 chars): `AI-powered fishing lure identification and catch tracking for anglers`
- [ ] **Full description:** Copy from `docs/APP_STORE_ASSETS_MYTACKLEBOX.md` (use **Canada** / CAD wording, not “App Store only”)
- [ ] **App icon:** 512×512 PNG
- [ ] **Feature graphic:** 1024×500 PNG (required)
- [ ] **Phone screenshots:** Min 2 (recommend 4–8), 1080×1920 or taller
- [ ] **Category:** Sports
- [ ] **Email:** mytackleboxapp@gmail.com
- [ ] **Privacy policy URL:** sameasabove link above

**Grow → Store presence → Store settings** (or **Countries/regions**)

- [ ] **Countries:** **Canada only**

---

## Phase 5: Policy & compliance

**Policy → App content** — complete every required section:

| Section | Action |
|---------|--------|
| Privacy policy | sameasabove URL |
| Ads | No ads (if accurate) |
| App access | Demo account **or** all features without login — see Phase 6 |
| Content rating | Complete IARC questionnaire |
| Target audience | Not primarily children |
| Data safety | Photos, account, location (if used), purchases — match app behavior |
| Financial features | In-app subscriptions declared |
| Photo/video | Camera / gallery for lure photos |

- [ ] Dashboard shows **no blocking** policy tasks

---

## Phase 6: Demo account & reviewer notes

Same pattern as Apple (`docs/LAUNCH_CHECKLIST.md` Phase 3).

1. [ ] Create review user in Supabase (e.g. `appreview@yourdomain.com`)
2. [ ] Optional PRO for full feature test — SQL in Apple checklist + RevenueCat promotional entitlement **MyTackleBox Pro**
3. [ ] **Policy → App access:** provide email + password if login required
4. [ ] Note **account deletion:** Profile → Account & data → Delete Account → Permanently Delete

---

## Phase 7: Build & upload (EAS)

From repo `frontend/` (requires local `eas.json` + `app.config`):

```bash
cd frontend
eas login
eas build --platform android --profile production
```

When build succeeds:

```bash
eas submit --platform android --latest
```

Or: Play Console → **Release → Testing → Internal testing** → upload `.aab` from [expo.dev](https://expo.dev) builds.

- [ ] **Play App Signing** enabled (recommended default)
- [ ] **versionCode** incremented vs any prior upload

---

## Phase 8: EAS secrets (expo.dev → Project → Secrets)

Set each name; values from Supabase / RevenueCat / Render / GitHub Pages:

| Secret | Source |
|--------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → anon public key |
| `EXPO_PUBLIC_RC_ANDROID_PRODUCTION_KEY` | RevenueCat → `goog_...` |
| `EXPO_PUBLIC_RC_IOS_PRODUCTION_KEY` | RevenueCat → `appl_...` (if building iOS too) |
| `EXPO_PUBLIC_BACKEND_URL` | `https://fishing-lure-backend.onrender.com` |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | sameasabove privacy URL |
| `EXPO_PUBLIC_TERMS_OF_USE_URL` | sameasabove terms URL |
| `EXPO_PUBLIC_PASSWORD_RESET_URL` | See `frontend/.env.example` |
| `EXPO_PUBLIC_EMAIL_CONFIRM_REDIRECT_URL` | See `frontend/.env.example` |

CLI alternative: `eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "..." --scope project`

---

## Phase 9: Internal testing (recommended)

1. **Release → Testing → Internal testing** → create release → attach AAB
2. [ ] Add testers (email list)
3. **Setup → License testing** → add your Google account for sandbox purchases
4. [ ] Install via Play Store opt-in link (not sideloaded APK)
5. Test: sign up, 10 free scans, paywall, subscribe, restore, delete account

---

## Phase 10: Production release

1. **Release → Production** → create release → same or newer AAB
2. [ ] Release notes: e.g. “Initial release – AI lure ID and catch tracking (Canada).”
3. [ ] **Countries:** Canada only
4. [ ] All policy tasks complete
5. [ ] **Start rollout** / send for review

First review: often a few days (longer for brand-new developer accounts).

---

## Quick reference

| Item | Value |
|------|--------|
| Package | `com.fishinglure.analyzer` |
| Product IDs | `monthly_pro`, `yearly_pro` |
| Entitlement (RevenueCat) | `MyTackleBox Pro` |
| Free tier | 10 scans / month (in-app, not Play) |
| PRO prices (Canada) | CA$6.99/mo, CA$49.99/yr |
| Play subscriptions | No free trial |
| Privacy | sameasabove GitHub Pages URLs |
| Android build | `eas build --platform android --profile production` |

---

**Apple checklist:** `docs/LAUNCH_CHECKLIST.md`  
**Store copy:** `docs/APP_STORE_ASSETS_MYTACKLEBOX.md`
