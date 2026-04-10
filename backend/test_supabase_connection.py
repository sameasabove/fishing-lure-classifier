#!/usr/bin/env python3
"""
Test Supabase Connection
Run this script to verify your Supabase setup is working correctly
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("Supabase Connection Test")
print("=" * 60)
print()

# Check if .env file exists
if not os.path.exists('.env'):
    print("❌ ERROR: .env file not found!")
    print()
    print("Solution:")
    print("  1. Copy env_template.txt to create .env:")
    print("     Windows: copy env_template.txt .env")
    print("     Mac/Linux: cp env_template.txt .env")
    print("  2. Edit .env and add your Supabase credentials")
    print()
    exit(1)

# Check environment variables
url = os.getenv("SUPABASE_URL")
anon_key = os.getenv("SUPABASE_ANON_KEY")
service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("Step 1: Checking environment variables...")
print("-" * 60)

if not url or url == "your-project-url-here":
    print("❌ SUPABASE_URL not set or is placeholder")
    print("   Get it from: https://supabase.com/dashboard/project/_/settings/api")
    print()
    exit(1)
else:
    # Mask the URL for security but show enough to verify
    masked_url = url[:30] + "..." if len(url) > 30 else url
    print(f"✓ SUPABASE_URL: {masked_url}")

if not service_role_key or service_role_key == "your-service-role-key-here":
    print("❌ SUPABASE_SERVICE_ROLE_KEY not set or is placeholder")
    print("   Get it from: https://supabase.com/dashboard/project/_/settings/api")
    print("   (Click 'Reveal' to see the service_role key)")
    print()
    exit(1)
else:
    print(f"✓ SUPABASE_SERVICE_ROLE_KEY: {service_role_key[:20]}...")

print()

# Try to import Supabase
print("Step 2: Checking dependencies...")
print("-" * 60)

try:
    from supabase import create_client
    print("✓ supabase package installed")
except ImportError:
    print("❌ supabase package not installed")
    print("   Run: pip install -r requirements.txt")
    print()
    exit(1)

print()

# Try to create client
print("Step 3: Initializing Supabase client...")
print("-" * 60)

try:
    client = create_client(url, service_role_key)
    print("✓ Supabase client initialized successfully!")
except Exception as e:
    print(f"❌ Failed to initialize Supabase client")
    print(f"   Error: {str(e)}")
    print()
    print("Common issues:")
    print("  - Invalid URL format")
    print("  - Wrong service_role key")
    print("  - Network connectivity issues")
    print()
    exit(1)

print()

# Test database connection
print("Step 4: Testing database connection...")
print("-" * 60)

try:
    # Try to query lure_analyses table
    response = client.table('lure_analyses').select('*').limit(1).execute()
    print("✓ Database connection working!")
    print(f"  Found table: lure_analyses")
    
    # Try to query profiles table
    response = client.table('profiles').select('*').limit(1).execute()
    print(f"  Found table: profiles")
    
except Exception as e:
    error_msg = str(e)
    print(f"❌ Database query failed")
    print(f"   Error: {error_msg}")
    
    if "relation" in error_msg.lower() or "does not exist" in error_msg.lower():
        print()
        print("Solution:")
        print("  1. Go to Supabase Dashboard → SQL Editor")
        print("  2. Copy contents of supabase_schema.sql")
        print("  3. Paste and run in SQL Editor")
        print()
    exit(1)

print()

# Test storage
print("Step 5: Testing storage...")
print("-" * 60)

try:
    buckets = client.storage.list_buckets()
    print(f"✓ Storage working! Found {len(buckets)} bucket(s)")
    
    # Check for lure-images bucket
    bucket_names = [b.name for b in buckets]
    if 'lure-images' in bucket_names:
        print("  ✓ Found 'lure-images' bucket")
    else:
        print("  ⚠ 'lure-images' bucket not found")
        print("    Run supabase_schema.sql to create it")
        
except Exception as e:
    print(f"⚠ Storage check failed: {str(e)}")
    print("  This might be okay - storage will be created when needed")

print()
print("=" * 60)
print("✓ Supabase connection test PASSED!")
print("=" * 60)
print()
print("Your Supabase setup is ready to use.")
print("You can now run the Flask app: python app.py")
print()

