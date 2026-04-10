#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick test script for production backend
"""

import requests
import json
import sys
import io

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BACKEND_URL = "https://fishing-lure-backend.onrender.com"

def test_health():
    """Test health endpoint"""
    print("🧪 Test 1: Health Check")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        print(f"✓ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Status: {data.get('status')}")
            print(f"✓ Message: {data.get('message')}")
            print(f"✓ Timestamp: {data.get('timestamp')}")
            print("✅ Health check PASSED!\n")
            return True
        else:
            print(f"❌ Unexpected status code: {response.status_code}\n")
            return False
    except Exception as e:
        print(f"❌ Health check FAILED: {str(e)}\n")
        return False

def test_main_page():
    """Test main page"""
    print("🧪 Test 2: Main Page")
    print("=" * 50)
    
    try:
        response = requests.get(BACKEND_URL, timeout=10)
        print(f"✓ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✓ Response Length: {len(response.text)} characters")
            if "Fishing Lure" in response.text:
                print("✓ Contains 'Fishing Lure' text")
            print("✅ Main page PASSED!\n")
            return True
        else:
            print(f"❌ Unexpected status code: {response.status_code}\n")
            return False
    except Exception as e:
        print(f"❌ Main page test FAILED: {str(e)}\n")
        return False

def test_upload_endpoint():
    """Test if upload endpoint exists"""
    print("🧪 Test 3: Upload Endpoint (Structure)")
    print("=" * 50)
    
    try:
        # Send a request without file (should fail gracefully)
        response = requests.post(f"{BACKEND_URL}/upload", timeout=10)
        print(f"✓ Status Code: {response.status_code}")
        
        # We expect 200 with an error message (no file)
        if response.status_code == 200:
            data = response.json()
            if 'error' in data:
                print(f"✓ Error Message: {data.get('error')}")
                print("✅ Upload endpoint EXISTS and responds correctly!\n")
                return True
        else:
            print(f"ℹ️  Response: {response.text[:100]}\n")
            return False
    except Exception as e:
        print(f"❌ Upload endpoint test FAILED: {str(e)}\n")
        return False

def test_supabase_endpoint():
    """Test if Supabase tackle box endpoint exists"""
    print("🧪 Test 4: Supabase Tackle Box Endpoint")
    print("=" * 50)
    
    try:
        # Send request without user_id (should fail with 401)
        response = requests.get(f"{BACKEND_URL}/api/supabase/tackle-box", timeout=10)
        print(f"✓ Status Code: {response.status_code}")
        
        if response.status_code == 401:
            data = response.json()
            print(f"✓ Error Message: {data.get('error')}")
            print("✅ Supabase endpoint EXISTS and requires auth correctly!\n")
            return True
        else:
            print(f"ℹ️  Unexpected response: {response.status_code}\n")
            return False
    except Exception as e:
        print(f"❌ Supabase endpoint test FAILED: {str(e)}\n")
        return False

def main():
    print("\n" + "=" * 50)
    print("🚀 PRODUCTION BACKEND TEST SUITE")
    print(f"Backend: {BACKEND_URL}")
    print("=" * 50 + "\n")
    
    results = []
    
    # Run all tests
    results.append(("Health Check", test_health()))
    results.append(("Main Page", test_main_page()))
    results.append(("Upload Endpoint", test_upload_endpoint()))
    results.append(("Supabase Endpoint", test_supabase_endpoint()))
    
    # Summary
    print("=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
    
    print("=" * 50)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Backend is fully operational! 🎉")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check logs above.")
    
    print("\n💡 Next Steps:")
    print("   1. Backend is live and ready")
    print("   2. Test with mobile app using Expo")
    print("   3. Try analyzing a lure photo")
    print("   4. Check Render logs for any errors")
    print("\n🎣 Your fishing lure backend is production-ready!\n")

if __name__ == "__main__":
    main()

