#!/usr/bin/env python3
"""
Test script to verify the API is working with your backend
"""

import requests
import json
import base64
import cv2
import numpy as np

def create_test_image():
    """Create a simple test image for color detection"""
    # Create a 300x300 test image with colored squares (simulating a cube face)
    img = np.zeros((300, 300, 3), dtype=np.uint8)
    
    # Create a 3x3 grid of colors
    colors = [
        (255, 255, 255),  # White
        (0, 0, 255),      # Red  
        (0, 255, 0),      # Green
        (0, 255, 255),    # Yellow
        (255, 165, 0),    # Orange
        (255, 0, 0),      # Blue
        (255, 255, 255),  # White
        (0, 0, 255),      # Red
        (0, 255, 0)       # Green
    ]
    
    for i in range(3):
        for j in range(3):
            color_idx = i * 3 + j
            color = colors[color_idx]
            
            # Draw colored square
            x1, y1 = j * 100, i * 100
            x2, y2 = (j + 1) * 100, (i + 1) * 100
            cv2.rectangle(img, (x1, y1), (x2, y2), color, -1)
    
    return img

def image_to_base64(image):
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode('.jpg', image)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{img_base64}"

def test_api_health():
    """Test API health endpoint"""
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ API Health Check: PASSED")
            return True
        else:
            print(f"❌ API Health Check: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API Health Check: FAILED (Error: {e})")
        return False

def test_api_test_endpoint():
    """Test API test endpoint"""
    try:
        response = requests.get('http://localhost:5000/api/test', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ API Test Endpoint: PASSED")
            print(f"   Message: {data.get('message', 'N/A')}")
            print(f"   Supported Colors: {data.get('supported_colors', 'N/A')}")
            return True
        else:
            print(f"❌ API Test Endpoint: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API Test Endpoint: FAILED (Error: {e})")
        return False

def test_color_detection():
    """Test color detection endpoint"""
    try:
        # Create test image
        test_img = create_test_image()
        img_base64 = image_to_base64(test_img)
        
        # Prepare request
        payload = {
            "image": img_base64,
            "face": "front"
        }
        
        # Send request
        response = requests.post(
            'http://localhost:5000/api/detect-colors',
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Color Detection: PASSED")
            print(f"   Success: {data.get('success', False)}")
            print(f"   Colors: {data.get('colors', [])}")
            print(f"   Cube Notation: {data.get('cube_notation', [])}")
            print(f"   Face: {data.get('face', 'N/A')}")
            print(f"   Message: {data.get('message', 'N/A')}")
            return True
        else:
            print(f"❌ Color Detection: FAILED (Status: {response.status_code})")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Color Detection: FAILED (Error: {e})")
        return False

def main():
    """Run all API tests"""
    print("🧪 Testing Rubik's Cube API")
    print("=" * 50)
    
    # Test 1: Health check
    health_ok = test_api_health()
    
    # Test 2: Test endpoint
    test_ok = test_api_test_endpoint()
    
    # Test 3: Color detection
    detection_ok = test_color_detection()
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    
    tests_passed = sum([health_ok, test_ok, detection_ok])
    total_tests = 3
    
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All tests PASSED! API is working correctly.")
        print("\n💡 You can now use the web interface:")
        print("   1. Open index.html or test-interactivity.html")
        print("   2. Click the camera button")
        print("   3. Test color detection with your cube")
    else:
        print("⚠️ Some tests FAILED. Check the API server.")
        print("\n💡 Troubleshooting:")
        print("   1. Make sure the API server is running: python backend_api.py")
        print("   2. Check for error messages in the server console")
        print("   3. Verify your backend modules are properly imported")

if __name__ == "__main__":
    main()