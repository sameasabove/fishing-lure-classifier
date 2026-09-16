# Social auth setup (Apple + Google) — My Tackle Box

Native **Continue with Apple** and **Continue with Google** use Supabase `signInWithIdToken`.
Same buttons work for **new accounts and returning users** (modern one-tap auth — no separate signup,
no confirmation email for social). Email/password still works (with Autofill on Login & Signup).

App version **1.0.3** unlocks editing the App Store **Description** (fix CAD prices to **CA$6.99/mo** and **CA$49.99/yr** — see `docs/APP_STORE_DESCRIPTION_CLEAN.md`). You can also set **Promotional Text** anytime without a new build.

## 1. Supabase Dashboard

### Apple
1. Authentication → Providers → **Apple** → Enable
2. For native iOS, client ID is usually your bundle ID: `com.fishinglure.analyzer`
3. Follow [Supabase Apple docs](https://supabase.com/docs/guides/auth/social-login/auth-apple) for Secret Key (JWT) if required for your setup

### Google
1. Authentication → Providers → **Google** → Enable
2. Add **Client IDs** from Google Cloud (Web + iOS + Android as applicable)
3. Follow [Supabase Google docs](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 2. Google Cloud Console

Create OAuth clients for package `com.fishinglure.analyzer`:

| Client type | Used for |
|-------------|----------|
| **Web** application | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (required — ID token audience) |
| **iOS** | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` + URL scheme |
| **Android** | SHA-1 from Play App Signing + package name |

**iOS URL scheme:** from the iOS client (reversed client id), e.g. `com.googleusercontent.apps.xxxxx`  
Set as `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` for the Expo Google Sign-In plugin.

## 3. Apple Developer

1. Identifiers → App ID `com.fishinglure.analyzer` → enable **Sign In with Apple**
2. Rebuild the app after enabling (capability is in `app.json` / `app.config.js`)

## 4. Env / EAS secrets

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=....apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=....apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps....
```

Add the same names in EAS → Environment variables (production), visibility **Sensitive**.

Until `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set, the Google button is hidden. Apple button shows on real iOS devices when available.

**Native linking:** Google Sign-In is linked only when `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` is present at build time (`app.config.js` + `react-native.config.js`). Without it, CocoaPods skips Google and the iOS build still succeeds (email + Apple). Set the EAS secrets **before** the production EAS build so Google is included in the binary.

## 5. Email deliverability (less junk)

1. Paste updated HTML from `docs/supabase/email-templates/` into Supabase Email templates
2. Prefer **custom SMTP** (Resend/SendGrid) with SPF/DKIM — see `docs/SUPABASE_EMAIL_BRANDING.md`
3. Sender name: **My Tackle Box**

## 6. Password Autofill branding note

Login/Signup now use proper Autofill attributes and the Expo display name is **My Tackle Box**. If Keychain still labels an old credential as `sameasabove`, that is from the `sameasabove.github.io` host used for confirm/reset pages. Delete the old saved password and save again, or later move auth pages to a custom domain with Associated Domains (`webcredentials`).
