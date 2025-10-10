"""
Test script for /api/detect-colors endpoint
Tests base64 image decoding, preprocessing, and color detection
"""

import requests
import base64
import json
import cv2
import numpy as np

# API endpoint
API_URL = "http://localhost:5000/api/detect-colors"

def create_test_image():
    """
    Create a simple test image with a 3x3 grid of colored squares
    This simulates a cube face with known colors
    """
    # Create 600x600 image
    img = np.zeros((600, 600, 3), dtype=np.uint8)
    
    # Define test colors (BGR format)
    test_colors = [
        (255, 255, 255),  # White
        (0, 0, 255),      # Red
        (0, 255, 0),      # Green
        (0, 255, 255),    # Yellow
        (0, 165, 255),    # Orange
        (255, 0, 0),      # Blue
        (255, 255, 255),  # White
        (0, 0, 255),      # Red
        (0, 255, 0),      # Green
    ]
    
    # Fill grid positions with colors
    GRID_START = 200
    GRID_STEP = 100
    DETECTION_SIZE = 20
    
    for i, color in enumerate(test_colors):
        row = i // 3
        col = i % 3
        
        # Calculate center position
        center_x = GRID_START + 50 + (col * GRID_STEP)
        center_y = GRID_START + 50 + (row * GRID_STEP)
        
        # Draw colored square
        x1 = center_x - DETECTION_SIZE
        y1 = center_y - DETECTION_SIZE
        x2 = center_x + DETECTION_SIZE
        y2 = center_y + DETECTION_SIZE
        
        cv2.rectangle(img, (x1, y1), (x2, y2), color, -1)
    
    return img

def encode_image_to_base64(image):
    """Encode OpenCV image to base64 string"""
    _, buffer = cv2.imencode('.jpg', image)
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{jpg_as_text}"

def test_detect_colors():
    """Test the /api/detect-colors endpoint"""
    print("=" * 60)
    print("Testing /api/detect-colors endpoint")
    print("=" * 60)
    
    # Create test image
    print("\n1. Creating test image...")
    test_image = create_test_image()
    print("✅ Test image created (600x600 with colored grid)")
    
    # Encode to base64
    print("\n2. Encoding image to base64...")
    base64_image = encode_image_to_base64(test_image)
    print(f"✅ Image encoded ({len(base64_image)} characters)")
    
    # Prepare request
    print("\n3. Sending request to API...")
    payload = {
        "image": base64_image,
        "face": "front"
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=10)
        
        print(f"✅ Response received (Status: {response.status_code})")
        
        # Parse response
        result = response.json()
        
        print("\n4. Response data:")
        print(json.dumps(result, indent=2))
        
        # Validate response
        print("\n5. Validation:")
        if result.get('success'):
            print("✅ Success: True")
            print(f"✅ Colors detected: {len(result.get('colors', []))}")
            print(f"✅ Cube notation: {len(result.get('cube_notation', []))}")
            print(f"✅ Face: {result.get('face')}")
            
            colors = result.get('colors', [])
            cube_notation = result.get('cube_notation', [])
            confidence = result.get('confidence', [])
            
            print("\n6. Detected colors:")
            for i, (color, notation, conf) in enumerate(zip(colors, cube_notation, confidence)):
                print(f"   Position {i}: {color} ({notation}) - Confidence: {conf}")
            
            print("\n✅ Test PASSED")
            return True
        else:
            print(f"❌ Success: False")
            print(f"❌ Error: {result.get('error')}")
            print("\n❌ Test FAILED")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Is the backend server running?")
        print("   Start it with: python api/start_backend.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_error_handling():
    """Test error handling with invalid requests"""
    print("\n" + "=" * 60)
    print("Testing error handling")
    print("=" * 60)
    
    # Test 1: No data
    print("\n1. Testing with no data...")
    try:
        response = requests.post(API_URL, json={}, timeout=5)
        result = response.json()
        if not result.get('success') and 'error' in result:
            print("✅ Correctly rejected empty request")
        else:
            print("❌ Should have rejected empty request")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Invalid base64
    print("\n2. Testing with invalid base64...")
    try:
        response = requests.post(API_URL, json={
            "image": "invalid_base64_data",
            "face": "front"
        }, timeout=5)
        result = response.json()
        if not result.get('success') and 'error' in result:
            print("✅ Correctly rejected invalid base64")
        else:
            print("❌ Should have rejected invalid base64")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n✅ Error handling tests completed")

if __name__ == "__main__":
    print("Rubik's Cube Color Detection API Test")
    print("Make sure the backend server is running on http://localhost:5000")
    print()
    
    # Run tests
    success = test_detect_colors()
    
    if success:
        test_error_handling()
    
    print("\n" + "=" * 60)
    print("Test completed")
    print("=" * 60)
