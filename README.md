# 🎣 Fishing Lure Identifier App

AI-powered fishing lure identification app with cloud sync, subscription management, and catch tracking.

---

## 🚀 Features

- **AI Lure Identification** - GPT-4o Vision API analyzes lure photos
- **Cloud Sync** - Supabase backend for multi-device access
- **Subscriptions** - RevenueCat integration (iOS & Android)
- **Freemium Model** - 10 free scans/month, unlimited with PRO
- **Catch Tracking** - Log catches with photos and details
- **Favorites** - Mark and filter favorite lures
- **Offline Support** - Works without internet (local storage fallback)

---

## 📱 Tech Stack

### Mobile App
- **React Native** (Expo)
- **Supabase** - Auth, database, storage
- **RevenueCat** - Subscription management
- **React Navigation** - Navigation

### Backend
- **Flask** - Python web server
- **OpenAI API** - GPT-4o-mini for lure analysis
- **Supabase** - PostgreSQL database

---

## 🛠️ Setup

### Prerequisites
- Node.js 16+
- Python 3.8+
- Supabase account
- OpenAI API key

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd "Fishing Lure"

# Backend (Flask) — from repo root
cd backend
pip install -r requirements.txt

# Mobile app (Expo) — from repo root
cd ../frontend
npm install
```

### 2. Configure Environment

- **Flask / OpenAI / Supabase (server):** copy `backend/.env.example` to `backend/.env` and fill in values.
- **Expo app (public keys only):** copy `frontend/.env.example` to `frontend/.env` and set `EXPO_PUBLIC_*` variables as documented there.

### 3. Set Up Supabase Database

Run these SQL files from the `database/` folder in the Supabase SQL Editor (in order):

```text
1. database/supabase_schema.sql
2. database/supabase_subscriptions_schema.sql
3. database/supabase_security_patch.sql
4. database/supabase_add_favorites.sql
5. database/supabase_soft_delete.sql
```

### 4. Run Backend

```bash
cd backend
python app.py
# Server runs on http://localhost:5000 (or FLASK_PORT from .env)
```

### 5. Run Mobile App

```bash
cd frontend
npx expo start

# Press 'a' for Android, 'i' for iOS
```

---

## 💰 Subscription Setup (For App Store Launch)

### 1. Developer Accounts
- **Apple Developer**: $99/year - https://developer.apple.com/programs/
- **Google Play Console**: $25 one-time - https://play.google.com/console/signup

### 2. RevenueCat Setup (FREE)
1. Sign up at https://app.revenuecat.com/signup
2. Create project
3. Get API keys for iOS and Android
4. Configure RevenueCat keys via `frontend/.env` (`EXPO_PUBLIC_RC_*`) and `frontend/src/services/subscriptionService.js` as needed:

```javascript
const REVENUECAT_API_KEY_IOS = 'your-ios-key';
const REVENUECAT_API_KEY_ANDROID = 'your-android-key';
```

### 3. Create Subscription Products

**Product IDs (same for both stores):** `monthly_pro`, `yearly_pro` (no lifetime).
- `monthly_pro` - CA$6.99/month (Canada App Store; other regions may differ)
- `yearly_pro` - CA$49.99/year (Canada App Store; other regions may differ)

**Early adoption pricing** — locked in for our first wave of users.

**iOS:** Create in App Store Connect → In-App Purchases
**Android:** Create in Google Play Console → Monetization → Subscriptions

### 4. Configure RevenueCat
1. Dashboard → Entitlements → Create "pro"
2. Attach monthly and yearly products to "pro" entitlement
3. Connect Apple App Store & Google Play Store

**Full guide:** See `frontend/SUBSCRIPTION_SETUP.md`

---

## 📊 Pricing Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 scans/month, basic features |
| **PRO Monthly** | CA$6.99/mo | Unlimited scans, catches, advanced features |
| **PRO Yearly** | CA$49.99/yr | Save ~40%, all PRO features |

*Current PRO prices are early adoption pricing and stay for our first wave of users.*

**Cost per scan:** ~$0.001 (GPT-4o-mini)
**Profit margin:** ~90% on PRO subscriptions

---

## 🗂️ Project Structure

```
Fishing Lure/
├── frontend/                    # Expo React Native app
│   ├── src/
│   │   ├── screens/
│   │   ├── services/
│   │   └── contexts/
│   └── package.json
│
├── backend/                     # Flask API
│   ├── app.py
│   ├── mobile_lure_classifier.py
│   ├── supabase_client.py
│   ├── config.py
│   ├── requirements.txt
│   └── templates/
│
├── database/                    # Supabase SQL migrations
├── docs/                        # Guides and legal copy
└── render.yaml                  # Render Blueprint (rootDir: backend)
```

---

## 🔐 Security

- ✅ Row Level Security (RLS) enabled on all Supabase tables
- ✅ API keys stored in environment variables (never in code)
- ✅ Service role key used server-side only
- ✅ SQL injection protection (parameterized queries)
- ✅ Rate limiting on API endpoints
- ✅ Monthly budget caps for API costs

**Security patches applied:**
- Function search_path security
- Storage bucket policies
- View security_invoker settings

---

## 🧪 Testing

### Test Subscriptions

**iOS (Sandbox):**
1. Create sandbox tester in App Store Connect
2. Sign out of App Store on device
3. Run app and make test purchase
4. Sign in with sandbox account (no real charge)

**Android (Internal Testing):**
1. Add test accounts in Google Play Console
2. Upload internal test build
3. Install and test purchases

### Test Backend

```bash
cd backend
python test_production.py
python test_supabase_connection.py
# Unit tests (install once: pip install pytest)
pytest tests/
```

---

## 📱 Build & Deploy

### Mobile App (Expo EAS)

```bash
cd frontend

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Backend (Render)

Set environment variables on the web service. **Root Directory** in Render should be `backend` (or use the repo-root `render.yaml` Blueprint with `rootDir: backend`).

**Environment Variables to Set:**
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FLASK_HOST=0.0.0.0`
- `FLASK_PORT=5000`

**Start command:** `gunicorn --bind 0.0.0.0:$PORT app:app`

---

## 🐛 Troubleshooting

### "Supabase credentials not found"
- Create `backend/.env` from `backend/.env.example`
- Add your Supabase URL and keys

### "Failed to save to Supabase"
- Run all SQL schema files in Supabase SQL Editor
- Check Supabase service_role key is correct

### "No packages found" (RevenueCat)
- Verify subscription products created in App Store/Play Console
- Check products are attached to "pro" entitlement in RevenueCat
- Ensure products are "Ready to Submit" status

### App won't build
```bash
cd frontend
rm -rf node_modules
npm install
npx expo start -c
```

---

## 📊 Analytics & Monitoring

### Track via Supabase
```sql
-- Get subscription stats
SELECT * FROM subscription_stats;

-- Most scanned lure types
SELECT lure_type, COUNT(*) as scans
FROM lure_analyses
GROUP BY lure_type
ORDER BY scans DESC;

-- PRO conversion rate
SELECT 
  COUNT(*) FILTER (WHERE is_pro) * 100.0 / COUNT(*) as conversion_rate
FROM user_subscriptions;
```

### RevenueCat Dashboard
- Revenue charts
- Subscriber count
- Churn rate
- Trial conversions

---

## 🚀 Launch Checklist

- [ ] Developer accounts created (Apple + Google)
- [ ] RevenueCat configured
- [ ] Subscription products created
- [ ] Supabase database set up
- [ ] Backend deployed
- [ ] Mobile app built
- [ ] Test purchases verified
- [ ] Privacy policy created
- [ ] App Store screenshots ready
- [ ] Submit for review

---

## 💡 Tips

- **Start with Android** - Cheaper ($25 vs $99), faster approval
- **Use sandbox testing** - Test purchases thoroughly before launch
- **Monitor costs** - Set budget caps in `config.py`
- **Check logs** - Supabase Dashboard → Logs for errors
- **A/B test pricing** - Try different price points

---

## 📞 Support & Resources

- **RevenueCat Docs**: https://docs.revenuecat.com
- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **OpenAI API**: https://platform.openai.com/docs

---

## 📄 License

[Your License Here]

---

## 🤝 Contributing

[Your contribution guidelines]

---

**Built with ❤️ for fishermen everywhere** 🎣


