# Social auth setup (Apple + Google) — My Tackle Box

Native Sign in with Apple and Continue with Google use Supabase `signInWithIdToken`.
Email/password still works.

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

**iOS builds:** native Google Sign-In is only linked when `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` is set in EAS. Without it, the module is skipped so CocoaPods can succeed (email + Apple still work). After adding the scheme, rebuild.

## 5. Email deliverability (less junk)

1. Paste updated HTML from `docs/supabase/email-templates/` into Supabase Email templates
2. Prefer **custom SMTP** (Resend/SendGrid) with SPF/DKIM — see `docs/SUPABASE_EMAIL_BRANDING.md`
3. Sender name: **My Tackle Box**
