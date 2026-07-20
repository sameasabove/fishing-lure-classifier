# Supabase auth emails — My Tackle Box branding

Confirmation, password reset, and other auth emails are configured in the **Supabase Dashboard**, not in the mobile app. Use the HTML templates in this repo and a hosted “success” page so links match your app.

## Quick checklist

- [ ] Paste branded HTML into **Confirm signup** (and **Reset password**) from `docs/supabase/email-templates/`
- [ ] Set subject lines from `docs/supabase/email-templates/subjects.txt`
- [ ] Set **Sender name** to `My Tackle Box` (Authentication → Emails → SMTP / sender settings)
- [ ] Host `backend/confirm-email-success.html` on GitHub Pages (same site as password reset)
- [ ] Add confirm URL to **Redirect URLs** in Supabase
- [ ] Set `EXPO_PUBLIC_EMAIL_CONFIRM_REDIRECT_URL` in EAS / `.env`
- [ ] (Strongly recommended) Custom SMTP so emails come from your domain instead of `noreply@mail.app.supabase.io` — this is the main fix for spam/junk
- [ ] Social login: see `docs/SOCIAL_AUTH_SETUP.md` (Apple + Google)

---

## 1. Branded email templates (Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Emails** → **Templates**.
2. Open **Confirm signup**.
3. **Subject:** `Confirm your My Tackle Box account 🎣`
4. **Message body:** Copy the full HTML from:

   `docs/supabase/email-templates/confirm-signup.html`

   Keep the variables exactly as written: `{{ .ConfirmationURL }}`, `{{ .Email }}`.

5. Save. Repeat for **Reset password** using `docs/supabase/email-templates/reset-password.html` if you want matching branding (subject: `Reset your My Tackle Box password`).

**Preview:** Use “Send test email” in the template editor to check layout in Gmail/Apple Mail.

**Note:** Some in-app email clients strip HTML — the template includes a plain link fallback. Ask users to open the link in Safari/Chrome if needed.

---

## 2. Sender name & address

Under **Authentication** → **Emails** (or **SMTP Settings**):

| Setting | Suggested value |
|--------|------------------|
| Sender name | `My Tackle Box` |
| Default from | Supabase default is fine for launch; for production consider custom SMTP |

### Optional: Custom SMTP (professional “from” address)

Use [Resend](https://resend.com), [SendGrid](https://sendgrid.com), or similar:

1. Verify your domain (e.g. `mytacklebox.app` or your GitHub Pages domain).
2. Supabase → **Project Settings** → **Authentication** → enable **Custom SMTP**.
3. From address: `My Tackle Box <noreply@yourdomain.com>`.

Emails will still use the HTML templates above; only the “From” line changes.

---

## 3. Confirmation link landing page

After the user taps **Confirm my account**, Supabase redirects to your **redirect URL** with a token. Host a small branded page (included in repo):

**File:** `backend/confirm-email-success.html`

Deploy next to `password-reset-success.html` on GitHub Pages, e.g.:

`https://YOUR_USER.github.io/fishing-lure-classifier/confirm-email-success.html`

### Supabase URL configuration

**Authentication** → **URL Configuration**:

| Field | Example |
|-------|---------|
| Site URL | `https://YOUR_USER.github.io/fishing-lure-classifier/` |
| Redirect URLs | Add your confirm page URL (and existing password reset URL) |

Example redirect allowlist entries:

```
https://YOUR_USER.github.io/fishing-lure-classifier/confirm-email-success.html
https://YOUR_USER.github.io/fishing-lure-classifier/password-reset-success.html
```

### App environment variable

In `frontend/.env` and **EAS Secrets**:

```bash
EXPO_PUBLIC_EMAIL_CONFIRM_REDIRECT_URL=https://YOUR_USER.github.io/fishing-lure-classifier/confirm-email-success.html
```

The app passes this to `signUp()` as `emailRedirectTo` so confirmation links open your branded page instead of the generic Supabase default.

---

## 4. Confirm email is required

**Authentication** → **Providers** → **Email**:

- Enable **Confirm email** if you want users to verify before signing in (matches the signup message in the app).

If you disable confirmation, users can sign in immediately and the confirm email is skipped.

---

## 5. Files in this repo

| File | Purpose |
|------|---------|
| `docs/supabase/email-templates/confirm-signup.html` | Signup confirmation email body |
| `docs/supabase/email-templates/reset-password.html` | Password reset email body |
| `docs/supabase/email-templates/subjects.txt` | Suggested subject lines |
| `backend/confirm-email-success.html` | Branded page after user clicks confirm link |
| `backend/password-reset-success.html` | Branded password reset (already in use) |

Brand colors match the app signup screen: greens `#e8f5e9`, `#2e7d32`, `#1b5e20`, and 🎣 header.

---

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| Email still says “Supabase” / plain text | Template not saved; or HTML disabled — re-paste HTML and save |
| Link goes to wrong page | Set `EXPO_PUBLIC_EMAIL_CONFIRM_REDIRECT_URL` and add URL to Redirect URLs |
| “Invalid link” on confirm page | Open in Safari/Chrome; check Redirect URLs and Site URL match hosted domain |
| User never gets email | Check spam; confirm Email provider enabled; check Supabase Auth logs |

For password reset branding only, you already use `EXPO_PUBLIC_PASSWORD_RESET_URL` — apply the reset-password HTML template the same way in the dashboard.
