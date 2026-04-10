#!/usr/bin/env python3
"""
Simple test script to verify upload functionality
"""

import requests
import os

def test_upload():
    """Test the upload endpoint"""
    url = "http://localhost:5000/upload"
    
    # Test with a sample image
    test_image = "sample_spinnerbait.jpg"
    
    if not os.path.exists(test_image):
        print(f"❌ Test image not found: {test_image}")
        return
    
    print(f"🧪 Testing upload with: {test_image}")
    
    # Prepare the upload
    with open(test_image, 'rb') as f:
        files = {'file': (test_image, f, 'image/jpeg')}
        data = {'analysis_type': 'traditional'}
        
        try:
            print("📤 Sending upload request...")
            response = requests.post(url, files=files, data=data)
            
            print(f"📊 Response status: {response.status_code}")
            print(f"📄 Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Upload successful!")
                print(f"🎯 Result: {result}")
            else:
                print(f"❌ Upload failed with status {response.status_code}")
                print(f"📄 Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error during upload: {str(e)}")

def test_flask_running():
    """Test if Flask app is responding"""
    try:
        response = requests.get("http://localhost:5000/")
        print(f"🌐 Flask app status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Flask app not responding: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Upload Functionality")
    print("=" * 40)
    
    # Check if Flask is running
    if test_flask_running():
        print("✅ Flask app is running")
        test_upload()
    else:
        print("❌ Flask app is not responding")
        print("💡 Make sure to run: python app.py")
