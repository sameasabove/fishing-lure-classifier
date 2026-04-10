# 🔒 Security Checklist & Best Practices

## ⚠️ IMMEDIATE ACTION REQUIRED

### 🚨 Your OpenAI API Key Was Exposed
**Status:** The key `sk-proj--VjNq...` was visible in our conversation.

**Action Required:**
1. Go to: https://platform.openai.com/api-keys
2. Find the key starting with `sk-proj--VjNq...`
3. Click "Revoke" or delete it
4. Create a new key
5. Update your `.env` file with the new key
6. **Set spending limits** on your OpenAI account (Settings → Billing → Usage Limits)

**Why this matters:**
- Anyone with your key can use your OpenAI account
- You'll be charged for their usage
- Could rack up thousands in bills

---

## ✅ Current Security Status

### What's Protected (Good!):
- ✅ `.env` file is in `.gitignore`
- ✅ `.env` was NOT pushed to GitHub
- ✅ Supabase has Row Level Security enabled
- ✅ Backend validates API requests
- ✅ User authentication working

### What Needs Attention:
- ⚠️ API key exposed in this conversation → **ROTATE NOW**
- ⚠️ Currently using ngrok (development only)
- ⚠️ No rate limiting on OpenAI calls
- ⚠️ No spending cap set

---

## 🔐 Security Best Practices

### 1. API Keys & Secrets

**✅ DO:**
```bash
# Store in .env (NEVER commit to git)
OPENAI_API_KEY=sk-proj-your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

**❌ DON'T:**
```javascript
// NEVER hardcode keys in code
const API_KEY = "sk-proj-abc123...";  // ❌ WRONG!
```

**Best Practice:**
- Rotate keys every 90 days
- Use different keys for dev/production
- Set spending limits
- Monitor usage daily

---

### 2. Environment Variables

**Development (.env file):**
```env
OPENAI_API_KEY=sk-proj-dev-key-here
SUPABASE_SERVICE_ROLE_KEY=dev-service-key
```

**Production (Hosting Platform Dashboard):**
- Render.com: Environment → Add Variable
- Railway.app: Variables tab
- Heroku: `heroku config:set KEY=value`

**Never:**
- ❌ Commit `.env` to git
- ❌ Share keys via email/chat
- ❌ Screenshot keys
- ❌ Use production keys in development

---

### 3. Supabase Security

**✅ Already Implemented:**
- Row Level Security (RLS) policies
- User-specific data isolation
- Service role key on backend only
- Anon key in mobile app (safe)

**Additional Recommendations:**
```sql
-- Enable RLS on all tables (already done ✓)
ALTER TABLE catches ENABLE ROW LEVEL SECURITY;

-- Create policies (already done ✓)
CREATE POLICY "Users can only see their own data"
  ON catches FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 4. Mobile App Security

**✅ Current Setup:**
```javascript
// src/config/security.js
export const BACKEND_URL = 'https://your-backend.onrender.com';
// API key is on backend, NOT in mobile app ✓
```

**What's Safe to Include in Mobile App:**
- ✅ Backend URL
- ✅ Supabase URL
- ✅ Supabase Anon Key (public, rate-limited)

**NEVER Include:**
- ❌ OpenAI API Key
- ❌ Supabase Service Role Key
- ❌ Admin passwords
- ❌ Private keys

---

### 5. Backend Security (Flask)

**✅ Implemented:**
```python
# API key validation
if not mobile_classifier:
    return jsonify({'error': 'API key not configured'})

# User authentication
user_id = request.form.get('user_id')
if not user_id:
    return jsonify({'error': 'Unauthorized'}), 401
```

**Recommended Additions:**
```python
# Add rate limiting
from flask_limiter import Limiter

limiter = Limiter(
    app,
    default_limits=["100 per day", "10 per hour"]
)

@app.route('/upload', methods=['POST'])
@limiter.limit("5 per minute")  # Max 5 analyses per minute
def upload_file():
    # ... existing code
```

---

### 6. Cost Protection

**OpenAI Dashboard Settings:**
1. Go to: https://platform.openai.com/account/limits
2. Set **hard limit**: $20/month (or your budget)
3. Set **soft limit**: $15/month (get notified)
4. Enable **email alerts**

**Why This Matters:**
- gpt-4o-mini: ~$0.001 per analysis ✓ cheap
- If key is stolen: Could be used for expensive models
- Hard limit prevents surprise bills

**Monitoring:**
```python
# In mobile_lure_classifier.py (already tracked)
results['api_cost_usd'] = estimated_cost
results['tokens_used'] = token_count
```

---

### 7. Production Deployment Security

**Hosting Platform Checklist:**
- [ ] Use HTTPS only (auto on Render/Railway)
- [ ] Set environment variables (not in code)
- [ ] Enable auto-deploy from main branch only
- [ ] Set up health checks
- [ ] Monitor error logs
- [ ] Enable firewall if available

**DNS & SSL:**
- Use platform's domain first: `your-app.onrender.com`
- Later, add custom domain: `api.yourdomain.com`
- SSL certificate auto-provided

---

### 8. Git Security

**Current .gitignore (Good!):**
```gitignore
.env
.venv
*.pyc
__pycache__/
uploads/
analysis_results/
```

**Check for Leaks:**
```bash
# Search git history for secrets (run this)
git log --all --full-history -- .env
# Should return nothing ✓

# Check what's tracked
git ls-files | grep -E '\.(env|key|pem)$'
# Should return nothing ✓
```

**If .env was committed by accident:**
```bash
# Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Push changes
git push origin --force --all
```

---

### 9. User Authentication

**Current Setup (Good!):**
```javascript
// Supabase handles auth securely
const { user, error } = await supabase.auth.signUp({
  email: email,
  password: password  // Auto-hashed by Supabase
});
```

**Password Requirements:**
- ✅ Minimum 6 characters (Supabase default)
- ✅ Email verification required
- ✅ Secure password hashing (bcrypt)
- ✅ Session tokens (JWT)

**Recommendations:**
- Enable 2FA in Supabase dashboard
- Require email verification before access
- Implement "Forgot Password" flow

---

### 10. Network Security

**Development:**
```
Mobile App → ngrok (HTTPS) → Flask (localhost) → OpenAI
```
✅ ngrok provides HTTPS tunnel
❌ Not for production (see deployment guide)

**Production:**
```
Mobile App → HTTPS → Cloud Server → OpenAI
              ↓
         Supabase (HTTPS)
```
✅ All connections encrypted
✅ No local machine needed
✅ Scalable and secure

---

## 🎯 Security Action Items

### Immediate (Do Today):
- [ ] **Rotate OpenAI API key** ← CRITICAL
- [ ] Set OpenAI spending limit ($20/month)
- [ ] Enable email alerts for usage
- [ ] Verify `.env` not in git: `git ls-files | grep .env`

### Before Production (This Week):
- [ ] Deploy backend to Render/Railway/Heroku
- [ ] Use separate API keys for dev/production
- [ ] Add rate limiting to Flask
- [ ] Set up monitoring/alerts
- [ ] Test all endpoints with new keys

### Ongoing (Monthly):
- [ ] Review OpenAI usage/costs
- [ ] Check Supabase logs for suspicious activity
- [ ] Rotate API keys every 90 days
- [ ] Update dependencies for security patches
- [ ] Review access logs

---

## 📊 Security Monitoring

### What to Monitor:

**OpenAI Dashboard:**
- Daily API usage
- Cost per day
- Unusual patterns (sudden spikes)

**Supabase Dashboard:**
- User signups (any suspicious accounts?)
- Database queries (any unusual activity?)
- Storage usage (any large uploads?)

**Hosting Platform:**
- Error rates
- Response times
- Failed requests
- Resource usage

---

## 🆘 Security Incident Response

### If API Key is Compromised:
1. **Immediately revoke** the key in OpenAI dashboard
2. Generate new key
3. Update environment variables on all platforms
4. Review usage logs for unauthorized activity
5. Contact OpenAI support if fraudulent charges
6. Set spending limits if not already set

### If User Data is Breached:
1. Check Supabase logs for unauthorized access
2. Verify RLS policies are active
3. Review auth logs
4. Contact affected users if needed
5. Update security policies

---

## ✅ Security Checklist Summary

**Configuration:**
- [ ] `.env` in `.gitignore`
- [ ] No secrets in git history
- [ ] Environment variables on hosting platform
- [ ] Different keys for dev/prod

**API Security:**
- [ ] OpenAI key rotated after exposure
- [ ] Spending limits set
- [ ] Rate limiting implemented
- [ ] Usage monitoring enabled

**Database Security:**
- [ ] Row Level Security enabled
- [ ] User authentication required
- [ ] Service role key on backend only
- [ ] Regular backup enabled (Supabase auto)

**Deployment:**
- [ ] HTTPS only
- [ ] Production keys separate from dev
- [ ] Health monitoring
- [ ] Error logging

---

## 📚 Resources

**OpenAI Security:**
- API Keys: https://platform.openai.com/api-keys
- Usage Limits: https://platform.openai.com/account/limits
- Best Practices: https://platform.openai.com/docs/guides/safety-best-practices

**Supabase Security:**
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Auth Policies: https://supabase.com/docs/guides/auth

**General Security:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Python Security: https://python.readthedocs.io/en/stable/library/security_warnings.html

---

**🔒 Remember: Security is an ongoing process, not a one-time setup!**

**Priority 1: Rotate your OpenAI API key NOW** → https://platform.openai.com/api-keys

