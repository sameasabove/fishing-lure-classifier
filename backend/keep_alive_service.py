#!/usr/bin/env python3
"""
Keep-Alive Service for Render Free Tier
Pings your backend every 10 minutes to keep it awake

Run this on:
- Your computer (when testing)
- A separate free service (Render, Railway, etc.)
- Cron job service (cron-job.org, EasyCron)
"""

import requests
import time
import schedule
from datetime import datetime

# Your Render backend URL
BACKEND_URL = "https://fishing-lure-backend.onrender.com/health"

def ping_backend():
    """Ping the backend to keep it alive"""
    try:
        response = requests.get(BACKEND_URL, timeout=10)
        if response.status_code == 200:
            print(f"[{datetime.now()}] ✅ Backend is alive - Status: {response.status_code}")
        else:
            print(f"[{datetime.now()}] ⚠️  Backend responded with: {response.status_code}")
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Failed to ping backend: {str(e)}")

def main():
    print("🚀 Starting Keep-Alive Service")
    print(f"Target: {BACKEND_URL}")
    print("Pinging every 10 minutes to keep backend awake...")
    print("-" * 50)
    
    # Ping immediately on start
    ping_backend()
    
    # Schedule pings every 10 minutes
    schedule.every(10).minutes.do(ping_backend)
    
    # Run forever
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()

