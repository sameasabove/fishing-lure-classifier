# 🛡️ Supabase Keep-Alive Setup

## Problem
Supabase free tier **pauses databases after 7 days of inactivity**. This means:
- First request after pause takes 30+ seconds (wakes up database)
- Users experience slow app performance
- Potentially lost connection during critical moments

## Solution
We've added a **keep-alive endpoint** that queries Supabase every 5 days to prevent pausing.

---

## ✅ What's Already Set Up

1. ✅ **Backend Endpoint**: `/keep-alive` endpoint in `app.py`
   - Queries Supabase database to keep it active
   - Accessible at: `https://fishing-lure-backend.onrender.com/keep-alive`

2. ✅ **Keep-Alive Script**: `supabase_keep_alive.py`
   - Can test the endpoint manually
   - Can be run via cron job

---

## 🚀 Quick Setup (2 minutes)

### **Option 1: Free Cron Service (RECOMMENDED - FREE)**

1. Go to **https://cron-job.org** (free, no credit card needed)
2. Click **"Create account"** → Sign up (free)
3. Click **"Create cronjob"**
4. Fill in:
   - **Title**: `Supabase Keep-Alive`
   - **Address (URL)**: `https://fishing-lure-backend.onrender.com/keep-alive`
   - **Schedule**: 
     - Select **"Every"** → **"5"** → **"Days"**
   - **Request method**: `GET`
   - **Active**: ✅ Checked
5. Click **"Create cronjob"**
6. ✅ Done! Your Supabase database will stay active forever!

**Alternative free services:**
- **EasyCron**: https://www.easycron.com (free tier available)
- **UptimeRobot**: https://uptimerobot.com (free tier: 50 monitors)

---

### **Option 2: Test Locally First**

Test the endpoint works:

```bash
python supabase_keep_alive.py
```

You should see:
```
✅ Supabase is active!
```

---

## 🧪 Test the Endpoint

**In Browser:**
```
https://fishing-lure-backend.onrender.com/keep-alive
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Supabase database is active",
  "supabase": "connected",
  "timestamp": "2025-01-20T10:30:00"
}
```

---

## 📋 How It Works

1. **Cron job** runs every 5 days
2. **Pings** `https://fishing-lure-backend.onrender.com/keep-alive`
3. **Backend** queries Supabase (`SELECT id FROM lure_analyses LIMIT 1`)
4. **Supabase** records activity → **No pause!** ✅

---

## ⚠️ Important Notes

- **5-day interval**: Pings every 5 days to prevent the 7-day pause
- **Free tier friendly**: Uses minimal database resources (simple SELECT)
- **Automatic**: Once set up, works forever (no maintenance needed)
- **Backend must be running**: If Render free tier sleeps, first ping wakes it up

---

## 🔧 Troubleshooting

### Endpoint Returns Error
- Check Supabase is enabled in your `.env` file
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### Cron Job Not Working
- Verify URL is correct: `https://fishing-lure-backend.onrender.com/keep-alive`
- Check cron service logs for errors
- Test endpoint manually in browser first

### Database Still Pauses
- Make sure cron job is **active** and **running**
- Check cron job logs to confirm pings are successful
- Verify schedule is set to **every 5 days** (not 7+ days)

---

## 💰 Cost

- **FREE** - All solutions use free services
- **No database impact** - Simple query uses minimal resources
- **Prevents costly downtime** - Users always have fast access

---

**Setup complete! Your Supabase database will never pause again!** 🎉



