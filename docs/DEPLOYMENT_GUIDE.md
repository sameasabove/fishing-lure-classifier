# 🚀 Production Deployment Guide

## ⚠️ SECURITY FIRST

### Before Deploying:
1. ✅ **Rotate your OpenAI API key** (the current one was exposed)
   - Go to: https://platform.openai.com/api-keys
   - Revoke old key
   - Generate new key
2. ✅ Verify `.env` is in `.gitignore` (already done ✓)
3. ✅ Never commit secrets to git
4. ✅ Use environment variables on your hosting platform

---

## 🌐 Production Architecture

### Current Setup (Development Only):
```
Mobile App → ngrok → Your Laptop (Flask) → OpenAI API
              ↓
         Supabase
```
❌ **Problems:**
- Your laptop must be on 24/7
- ngrok free tier has limits
- Not scalable
- Security risks

### Production Setup (Recommended):
```
Mobile App → Cloud Server (Flask) → OpenAI API
              ↓
         Supabase
```
✅ **Benefits:**
- Always available
- Scalable
- Secure
- Professional

---

## 🚀 Deployment Options

### Option 1: Render.com (Easiest, Free Tier)

#### Steps:
1. **Sign up:** https://render.com
2. **Create New Web Service**
3. **Connect GitHub:** Link your repo
4. **Configure:**
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
5. **Add Environment Variables:**
   ```
   OPENAI_API_KEY=your-new-key-here
   SUPABASE_URL=https://wisqqrerjbfbdiorlxtn.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   FLASK_HOST=0.0.0.0
   FLASK_PORT=10000
   FLASK_DEBUG=False
   ```
6. **Deploy!**

**Result:** You'll get a URL like: `https://fishing-lure-backend.onrender.com`

---

### Option 2: Railway.app (Easy, Free Tier)

#### Steps:
1. **Sign up:** https://railway.app
2. **New Project** → Deploy from GitHub
3. **Select your repo**
4. **Add Variables:**
   ```
   OPENAI_API_KEY=your-new-key-here
   SUPABASE_URL=https://wisqqrerjbfbdiorlxtn.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. **Deploy automatically**

**Result:** You'll get a URL like: `https://fishing-lure-backend.railway.app`

---

### Option 3: Heroku (Paid but Reliable)

#### Steps:
1. **Install Heroku CLI:** https://devcenter.heroku.com/articles/heroku-cli
2. **Login:**
   ```bash
   heroku login
   ```
3. **Create app:**
   ```bash
   heroku create fishing-lure-backend
   ```
4. **Set environment variables:**
   ```bash
   heroku config:set OPENAI_API_KEY=your-new-key-here
   heroku config:set SUPABASE_URL=https://wisqqrerjbfbdiorlxtn.supabase.co
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. **Deploy:**
   ```bash
   git push heroku main
   ```

---

## 📱 Update Mobile App with Production URL

After deploying, update your mobile app:

### File: `FishingLureApp/src/config/security.js`

```javascript
// PRODUCTION
export const BACKEND_URL = 'https://your-app-name.onrender.com';

// DEVELOPMENT (keep commented in production)
// export const BACKEND_URL = 'https://your-ngrok-url.ngrok-free.app';
```

---

## 🧪 Testing Production

### 1. Test Backend Health:
```bash
curl https://your-app-name.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Backend is running",
  "timestamp": "2025-10-20T..."
}
```

### 2. Test in Mobile App:
1. Update `BACKEND_URL` in `security.js`
2. Rebuild app: `npx expo start --clear`
3. Take a photo of a lure
4. Should work without your laptop running!

---

## 🔒 Security Best Practices

### ✅ DO:
- Use environment variables for all secrets
- Rotate API keys regularly
- Enable rate limiting (already in your app)
- Use HTTPS only (hosting platforms provide this)
- Monitor API usage on OpenAI dashboard
- Set spending limits on OpenAI account

### ❌ DON'T:
- Commit `.env` to git
- Share API keys in chat/email
- Use development keys in production
- Expose service role keys to mobile app
- Run production on your laptop

---

## 💰 Cost Estimates

### Hosting:
- **Render.com:** Free tier (750 hours/month) - perfect for starting
- **Railway.app:** $5/month after free tier
- **Heroku:** ~$7/month for basic dyno

### OpenAI API:
- **gpt-4o-mini:** ~$0.001 per analysis
- **Expected:** $5-20/month for moderate usage
- **Tip:** Set spending limits in OpenAI dashboard

### Supabase:
- **Free tier:** Good for 50,000+ users
- **Paid:** Starts at $25/month if needed

### Total: ~$0-15/month to start

---

## 🎯 Quick Start (Recommended: Render.com)

1. **Rotate your OpenAI API key** ← DO THIS FIRST!
2. Go to https://render.com and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub: `ericfernandes71/fishing-lure-classifier`
5. Configure:
   - Name: `fishing-lure-backend`
   - Branch: `main`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
6. Add environment variables (from .env file)
7. Click "Create Web Service"
8. Wait 2-3 minutes for deployment
9. Get your URL: `https://fishing-lure-backend.onrender.com`
10. Update mobile app with this URL
11. Test!

---

## ❓ FAQ

**Q: Why can't I just use ngrok for production?**
A: ngrok free tier has limits, URLs change, and it's not reliable for 24/7 apps.

**Q: Will my API key be safe on Render/Railway?**
A: Yes! They use encrypted environment variables. Much safer than ngrok.

**Q: Can users see my OpenAI API key?**
A: No! The key stays on your server. Mobile app only talks to your Flask backend.

**Q: What about iOS App Store requirements?**
A: Hosting on Render/Railway gives you a proper HTTPS URL that Apple approves.

**Q: How do I update the production app?**
A: Just push to GitHub. Render/Railway auto-deploy on new commits.

---

## 🆘 Need Help?

1. Check deployment logs on your hosting platform
2. Test `/health` endpoint first
3. Verify all environment variables are set
4. Check OpenAI API key is valid
5. Monitor Supabase connection

---

## 📝 Pre-Deployment Checklist

- [ ] Rotate OpenAI API key
- [ ] Choose hosting platform (Render recommended)
- [ ] Sign up for hosting account
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy backend
- [ ] Test `/health` endpoint
- [ ] Update mobile app `BACKEND_URL`
- [ ] Test lure analysis
- [ ] Set OpenAI spending limit
- [ ] Monitor first 24 hours

---

**Ready to deploy? Start with Render.com - it's the easiest!** 🚀

