#!/usr/bin/env python3
"""
Supabase Keep-Alive Service
Pings your backend's /keep-alive endpoint every 5 days to prevent Supabase from pausing

Supabase free tier pauses databases after 7 days of inactivity.
This script pings every 5 days to keep it active.

Setup Options:
1. Free Cron Service: https://cron-job.org (recommended - FREE)
   - Create account → Add cron job → URL: https://your-backend.onrender.com/keep-alive
   - Schedule: Every 5 days
   - No server needed!

2. Run locally (when testing):
   python supabase_keep_alive.py

3. Deploy to Render/Railway (as a separate service)
"""

import requests
import time
from datetime import datetime

# Your Render backend URL
BACKEND_URL = "https://fishing-lure-backend.onrender.com/keep-alive"

# How often to ping (in days) - every 5 days to prevent 7-day pause
PING_INTERVAL_DAYS = 5

def ping_supabase():
    """Ping the backend to keep Supabase active"""
    try:
        print(f"[{datetime.now()}] 🔄 Pinging Supabase keep-alive endpoint...")
        response = requests.get(BACKEND_URL, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            supabase_status = data.get('supabase', 'unknown')
            
            if supabase_status == 'connected':
                print(f"[{datetime.now()}] ✅ Supabase is active!")
                print(f"   Message: {data.get('message', 'OK')}")
            elif supabase_status == 'disabled':
                print(f"[{datetime.now()}] ⚠️  Backend OK, but Supabase not enabled")
            else:
                print(f"[{datetime.now()}] ⚠️  Backend responded: {data.get('message', 'OK')}")
        else:
            print(f"[{datetime.now()}] ⚠️  Backend responded with status: {response.status_code}")
            
    except requests.exceptions.Timeout:
        print(f"[{datetime.now()}] ❌ Timeout - Backend may be sleeping")
        print(f"   This is normal for Render free tier (sleeps after 15 min inactivity)")
        print(f"   First request after sleep takes ~30 seconds")
    except requests.exceptions.ConnectionError:
        print(f"[{datetime.now()}] ❌ Connection error - Check your BACKEND_URL")
        print(f"   Current URL: {BACKEND_URL}")
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error: {str(e)}")

def main():
    """Main function - pings once when run directly"""
    print("=" * 60)
    print("Supabase Keep-Alive Service")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Interval: Every {PING_INTERVAL_DAYS} days")
    print()
    
    ping_supabase()
    
    print()
    print("=" * 60)
    print("✅ Keep-alive ping sent!")
    print()
    print("To automate this:")
    print("  1. Go to https://cron-job.org (FREE)")
    print("  2. Create account → Add cron job")
    print("  3. URL: " + BACKEND_URL)
    print(f"  4. Schedule: Every {PING_INTERVAL_DAYS} days")
    print("  5. Save and activate!")
    print("=" * 60)

if __name__ == "__main__":
    main()



