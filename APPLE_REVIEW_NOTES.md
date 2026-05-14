# Apple App Review — MyTackleBox (My Tackle Box)

## App Store Connect → App Review Information → Notes (paste this)

**Character limit:** 4000. The block below is ~1,200 characters before you add your link and credentials.

1. Replace `PASTE_LINK_HERE` with your **screen recording** (Apple requested a physical-device recording). Use a **private/unlisted** link (e.g. iCloud, Dropbox, YouTube unlisted) if Notes does not accept a file upload.
2. Replace the demo **email** and **password** with the real review-only account.
3. Paste the whole block into **App Store Connect → your app version → App Review Information → Notes**.

```
APP REVIEW — Guidelines 5.1.1(ii) & 5.1.1(v)

5.1.1(ii) LOCATION: Updated iOS purpose strings (When In Use, Always When In Use, Always) to clearly describe use of location for fishing spots, nearby lakes, weather, and region-specific fishing information, including the Lake Simcoe example.

5.1.1(v) ACCOUNT DELETION: In-app permanent deletion (no website required). Removes Supabase auth user, user storage folder, and local session.

SCREEN RECORDING (physical device — iPhone or iPad):
PASTE_LINK_HERE
Shows: sign in or sign up → Profile tab → Account & data → Delete Account → Permanently Delete → login screen; same credentials no longer work.

DEMO ACCOUNT (replace with yours before submit):
Email: YOUR_REVIEW_EMAIL@example.com
Password: YOUR_REVIEW_PASSWORD

DELETE ACCOUNT — STEPS:
1) Sign in with demo OR Sign up with a disposable email.
2) Tap Profile (bottom) → under Account tap Account & data.
3) Tap Delete Account → Permanently Delete in the confirmation alert.
4) App returns to login; same email/password cannot sign in again.

Sign-up: first screen → Sign up (email, password, name).

We verified delete + failed re-login on production before this submission.

Thank you.
```

---

Use the note in **App Store Connect → App Review Information → Notes**. Replace placeholder credentials with the real demo account you create before submission.

## Demo account (create before review)

Create a dedicated user in the [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Users** → **Add user** (or sign up once inside the app and record the password).

| Field | Value |
|--------|--------|
| **Email** | `REPLACE_ME_APPLE_REVIEW_DELETE@yourdomain.com` |
| **Password** | `REPLACE_ME_STRONG_PASSWORD` |

**Important:** Use an email you control so you can reset the password if needed. Do **not** reuse a production customer account.

## Exact steps to delete the account (in-app)

1. Install the build under review and open the app.
2. Sign in with the demo credentials above (or use **Sign up** with a disposable email, then continue with the same flow).
3. Tap the **Profile** tab (bottom navigation, person icon).
4. You are on **Settings** (stack title). Under **Account**, tap **Account & data**.
5. On the **Account** screen, tap **Delete Account**.
6. In the system confirmation dialog, read the warning, then tap **Permanently Delete**.
7. The app returns to the login/sign-up screen. The session and local cache are cleared.

**Path summary:** Profile → Settings → Account & data → Account → Delete Account → Permanently Delete.

## Developer verification (pre-submission)

The following was confirmed against the **production** backend (`EXPO_PUBLIC_BACKEND_URL`) before this submission:

- **Account deletion:** Completed successfully from **Profile → Settings → Account & data → Delete Account → Permanently Delete** (no error; returned to login).
- **Post-deletion sign-in:** Signing in again with the **same email and password** **fails** (account no longer exists), as required for Guideline 5.1.1(v).

Reviewers should follow the steps in **Exact steps to delete the account** using the demo account below (or sign up once, then delete that account).

## Notes for the reviewer

- **Account creation:** Available from the auth screen via **Sign up** (email + password + name).
- **Account deletion:** Implemented as above; deletion calls the production API `DELETE /api/account` with the user’s Supabase JWT, removes objects under the user’s folder in Supabase Storage (`lure-images/{user_id}/`), then deletes the Supabase **auth user**. Tables that reference `auth.users` (e.g. profiles, lure analyses, catches, subscription sync row) are removed by database foreign-key rules where configured.
- **After deletion:** The same email/password **cannot** sign in again unless a **new** user is created with that email.
- **Subscriptions:** Subscription state is also managed in Apple/RevenueCat; canceling a paid subscription for a test account is separate from in-app account deletion (deletion removes app-side sync data and auth; the reviewer may use a free test account to avoid billing).

## Pre-review checklist (copy into your own QA)

- [x] **Account creation works** (sign up → lands in main app).
- [x] **Account deletion works** (full flow above completes without error). *(Verified on production backend before submit.)*
- [x] **Deleted account cannot log back in** (same credentials → invalid login or “user not found”). *(Verified before submit.)*
- [ ] Backend `DELETE /api/account` is deployed to the same server URL the app uses (`EXPO_PUBLIC_BACKEND_URL` / production).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` are set on the server so JWT verification and admin delete succeed.

## Privacy / account handling (quick compliance scan)

- Location is used for map centering and tagging catches; purpose strings are in `frontend/app.json` (`NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`).
- Legal links for subscriptions are driven from `frontend/src/core/config/index.js` (`EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_OF_USE_URL`) and appear on the paywall per App Store subscription guidance.
- Password reset uses Supabase email + your configured redirect URL (`EXPO_PUBLIC_PASSWORD_RESET_URL`).
