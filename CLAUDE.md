# My Tackle Box — Claude Instructions

## What This Is
A freemium mobile app (React Native / Expo) that lets users photograph fishing lures and get AI-powered identification and fishing advice. Monetized via RevenueCat subscriptions. Backend is a Flask API on Render.com. Database and auth via Supabase.

## Repo Structure
```
frontend/   — Expo mobile app
  src/
    screens/          — UI only, no business logic
    services/         — feature services (auth, lures, subscription, etc.)
    core/config/      — single source of truth for all env vars and constants
    components/       — shared UI components
    contexts/         — React contexts (auth state)
    config/           — Supabase client, security utilities
backend/    — Flask API, OpenAI integration, Supabase client
database/   — SQL migrations (run manually in Supabase dashboard)
docs/       — guides, app store assets, screenshots
```

## Running Things
```bash
# Mobile
cd frontend && npm install && npm start   # Expo dev server
cd frontend && npm test                   # Jest unit tests
cd frontend && npm run test:watch         # Watch mode

# Backend
cd backend && pip install -r requirements.txt
cp .env.example .env                      # fill in values
python app.py
```

## Environment Variables
- **Mobile:** copy `frontend/.env.example` → `frontend/.env`, fill in values
- **Backend:** copy `backend/.env.example` → `backend/.env`, fill in values
- **Builds:** secrets live in EAS (mobile) and Render.com env vars (backend) — never in source

All mobile config flows through `frontend/src/core/config/index.js`. Do not import env vars anywhere else.

## Key Rules

### Security — non-negotiable
- Never hardcode API keys, tokens, or UUIDs anywhere in source
- All secrets go through `core/config/index.js` (mobile) or `config.py` (backend)
- Never commit `.env` files — they are in `.gitignore`
- Backend must validate Supabase JWTs — do not trust `X-User-ID` headers alone

### Architecture
- Screens call services, never Supabase or the backend directly
- `core/config/index.js` is the only place env vars are read on the mobile side
- Backend is data-in/data-out — business logic lives in services, not Flask routes
- Constants (quota limits, product IDs, entitlement IDs) live in `core/config/index.js`, not scattered across files

### Tests
- New logic in `core/` needs unit tests in a sibling `__tests__/` folder
- Run `npm test` before committing anything in `frontend/`
- Tests use `jest.resetModules()` + dynamic `require()` when testing env var behavior

### Git
- Feature branches only — do not commit directly to `main`
- PRs require passing tests before merge
- Commit messages describe the why, not just the what

## External Services
| Service | Purpose | Keys in |
|---------|---------|---------|
| Supabase | DB, auth, storage | `EXPO_PUBLIC_SUPABASE_*` / `SUPABASE_*` |
| OpenAI | Lure ID via GPT-4o-mini Vision | `OPENAI_API_KEY` (backend only) |
| RevenueCat | iOS/Android subscriptions | `EXPO_PUBLIC_RC_*` |
| Render.com | Flask backend hosting | env vars in Render dashboard |
| Expo EAS | Mobile builds | EAS Secrets |

## Known TODOs (prioritized)
1. Add Flask-Limiter rate limiting to `/upload` endpoint
2. Add Supabase JWT verification to Flask (replace header trust)
3. Add CORS config to Flask
4. Strip remaining `console.log` / `print()` calls with user data
5. Add MIME + magic-byte validation on image upload
6. Split `subscriptionService.js` (1100+ lines) into focused modules
7. Split `mobile_lure_classifier.py` (1500+ lines) into focused modules
