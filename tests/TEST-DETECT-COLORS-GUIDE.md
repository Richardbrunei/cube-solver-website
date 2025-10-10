# Testing Guide: /api/detect-colors Endpoint

## Quick Start

### 1. Start the Backend Server

```bash
cd api
python start_backend.py
```

The server will start on `http://localhost:5000`

### 2. Run Tests

#### Option A: Python Test Script
```bash
python tests/test_detect_colors_api.py
```

This will:
- Create a synthetic test image with known colors
- Send it to the API
- Display detected colors and confidence scores
- Test error handling

#### Option B: HTML Test Page
```bash
# Open in browser
http://localhost:5000/tests/test-detect-colors-api.html
```

This provides:
- Interactive testing interface
- Synthetic image generation
- Real image upload capability
- Visual results display
- Error handling tests

## Manual Testing with cURL

### Test 1: Valid Request
```bash
# Create a simple test (requires base64 encoded image)
curl -X POST http://localhost:5000/api/detect-colors \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,YOUR_BASE64_IMAGE_HERE",
    "face": "front"
  }'
```

### Test 2: Missing Image
```bash
curl -X POST http://localhost:5000/api/detect-colors \
  -H "Content-Type: application/json" \
  -d '{
    "face": "front"
  }'
```

Expected: 400 error with "No image data provided"

### Test 3: Invalid Base64
```bash
curl -X POST http://localhost:5000/api/detect-colors \
  -H "Content-Type: application/json" \
  -d '{
    "image": "invalid_base64",
    "face": "front"
  }'
```

Expected: 400 error with "Failed to decode image"

## Expected Response Format

### Success Response
```json
{
  "success": true,
  "colors": [
    "White", "Red", "Green",
    "Yellow", "Orange", "Blue",
    "White", "Red", "Green"
  ],
  "cube_notation": [
    "U", "R", "F",
    "D", "L", "B",
    "U", "R", "F"
  ],
  "face": "front",
  "confidence": [
    0.95, 0.92, 0.88,
    0.91, 0.89, 0.93,
    0.96, 0.90, 0.87
  ],
  "message": "Colors detected successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to decode image"
}
```

## Testing with Real Images

### Using Python
```python
import requests
import base64

# Read image file
with open('cube_face.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# Send to API
response = requests.post('http://localhost:5000/api/detect-colors', json={
    'image': f'data:image/jpeg;base64,{image_data}',
    'face': 'front'
})

print(response.json())
```

### Using JavaScript (Browser)
```javascript
// Capture from canvas
const canvas = document.getElementById('myCanvas');
const base64Image = canvas.toDataURL('image/jpeg', 0.8);

// Send to API
fetch('http://localhost:5000/api/detect-colors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        image: base64Image,
        face: 'front'
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Troubleshooting

### Backend Not Available
**Error**: `Backend modules not available`

**Solution**: 
1. Check that backend path is correct in `backend_api.py`
2. Ensure backend modules are installed
3. Verify `config.py`, `color_detection.py`, etc. are accessible

### Camera Not Detected
**Error**: `Camera not accessible`

**Solution**:
1. Check camera permissions
2. Ensure no other application is using the camera
3. Try different camera index (0, 1, 2)

### Low Confidence Scores
**Issue**: Confidence scores below 0.7

**Solution**:
1. Improve lighting conditions
2. Ensure cube face is clearly visible
3. Position cube closer to camera
4. Clean cube stickers

### Wrong Colors Detected
**Issue**: Colors don't match actual cube

**Solution**:
1. Check white balance (lighting conditions)
2. Ensure proper cube positioning in grid
3. Verify grid alignment matches backend specs
4. Test with different lighting

## Performance Benchmarks

Expected processing times:
- Image decoding: < 50ms
- Preprocessing: < 100ms
- Color detection: < 200ms
- Total: < 500ms

If processing takes longer:
1. Check image size (should be ~600x600)
2. Verify backend modules are loaded
3. Check system resources

## Next Steps

After verifying the endpoint works:
1. Proceed to Task 3: Update CameraCapture class
2. Integrate frontend camera capture
3. Test end-to-end workflow

## Support

For issues or questions:
1. Check `tests/TASK2-DETECT-COLORS-API-SUMMARY.md`
2. Review `api/README.md`
3. Examine backend logs for errors
