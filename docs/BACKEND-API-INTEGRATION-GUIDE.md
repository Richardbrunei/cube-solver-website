# Backend API Integration Guide

## Overview
This guide explains how the frontend camera capture integrates with the backend `/api/detect-colors` endpoint.

## Quick Start

### 1. Start the Backend
```bash
cd api
python start_backend.py
```

The backend will start on `http://localhost:5000`

### 2. Use the Camera Capture
```javascript
import { CameraCapture } from './scripts/camera-capture.js';
import { CubeState } from './scripts/cube-state.js';

const cubeState = new CubeState();
const camera = new CameraCapture(cubeState);

// Open camera interface
await camera.openCameraInterface();
```

## API Endpoint

### POST /api/detect-colors

Detects colors from a captured cube face image.

**Endpoint**: `http://localhost:5000/api/detect-colors`

**Request**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "face": "front"
}
```

**Parameters**:
- `image` (string, required): Base64-encoded JPEG image (600x600px recommended)
- `face` (string, required): Face name - one of: `front`, `back`, `left`, `right`, `top`, `bottom`

**Success Response** (200 OK):
```json
{
  "success": true,
  "colors": ["White", "Red", "Green", "Yellow", "Orange", "Blue", "White", "Red", "Green"],
  "cube_notation": ["U", "R", "F", "D", "L", "B", "U", "R", "F"],
  "face": "front",
  "confidence": [0.95, 0.92, 0.88, 0.91, 0.94, 0.89, 0.93, 0.90, 0.87],
  "message": "Colors detected successfully"
}
```

**Error Response** (4xx/5xx):
```json
{
  "success": false,
  "error": "Failed to decode image",
  "message": "The provided image data could not be decoded"
}
```

## Frontend Implementation

### detectColorsFromImage() Method

**Location**: `scripts/camera-capture.js`

**Usage**:
```javascript
const imageData = captureImageFromVideo(); // Returns base64 JPEG
const result = await cameraCapture.detectColorsFromImage(imageData, 'front');

if (result.success) {
  console.log('Detected colors:', result.colors);
  // Apply colors to cube state
  applyDetectedColors(result.colors, 'front');
} else {
  console.error('Detection failed:', result.error);
  // Show error message to user
}
```

**Features**:
- ✅ 5-second timeout
- ✅ Automatic error handling
- ✅ Response validation
- ✅ Structured error responses

### Timeout Handling

The method automatically times out after 5 seconds:

```javascript
// Timeout occurs after 5 seconds
const result = await detectColorsFromImage(imageData, 'front');

if (!result.success && result.error.includes('timeout')) {
  // Handle timeout
  console.log('Backend is taking too long');
}
```

### Error Handling

All errors return a structured response (no exceptions thrown):

```javascript
const result = await detectColorsFromImage(imageData, 'front');

// Always check success flag
if (result.success) {
  // Process colors
  const colors = result.colors; // Array of 9 color names
} else {
  // Handle error
  const errorMessage = result.error;
  const userMessage = result.message;
}
```

## Image Processing Pipeline

### Frontend Processing
1. Capture frame from video element
2. Mirror horizontally (for natural interaction)
3. Crop to square aspect ratio (centered)
4. Resize to 600x600 pixels
5. Convert to base64 JPEG (80% quality)

### Backend Processing
1. Decode base64 to OpenCV image
2. Mirror horizontally (matching frontend)
3. Crop to square (centered)
4. Resize to 600x600
5. Apply white balance correction
6. Apply adaptive brightness enhancement
7. Extract 9 color patches from 3x3 grid
8. Detect color for each patch using HSV ranges
9. Return color names and cube notation

## Color Mapping

### Color Names (Backend Output)
- `White` → Up face (U)
- `Red` → Right face (R)
- `Green` → Front face (F)
- `Yellow` → Down face (D)
- `Orange` → Left face (L)
- `Blue` → Back face (B)

### Cube Notation (Backend Output)
- `U` → White (Up)
- `R` → Red (Right)
- `F` → Green (Front)
- `D` → Yellow (Down)
- `L` → Orange (Left)
- `B` → Blue (Back)

## Testing

### Manual Testing
1. Open `tests/test-backend-api-integration.html` in browser
2. Ensure backend is running
3. Run each test case
4. Verify all tests pass

### Test Cases
- ✅ Basic API call with valid image
- ✅ Timeout handling (5 seconds)
- ✅ Error response handling
- ✅ Invalid image data handling
- ✅ Response validation

### Expected Results
- Test 1: Should return 9 colors in < 2 seconds
- Test 2: Should timeout after ~5 seconds
- Test 3: Should return error response
- Test 4: Should handle invalid data gracefully
- Test 5: Should validate all response fields

## Troubleshooting

### Backend Not Running
**Symptom**: Network error, connection refused
**Solution**: Start backend with `python api/start_backend.py`

### Timeout Errors
**Symptom**: "Request timeout: Backend took longer than 5 seconds"
**Possible Causes**:
- Backend is processing slowly
- Network latency is high
- Backend is under heavy load

**Solutions**:
- Check backend logs for errors
- Verify image size is reasonable (< 100KB)
- Restart backend server

### Invalid Response
**Symptom**: "Invalid response: expected 9 colors"
**Possible Causes**:
- Backend color detection failed
- Image quality is poor
- Lighting conditions are bad

**Solutions**:
- Improve lighting conditions
- Ensure cube is properly positioned
- Retake the photo

### CORS Errors
**Symptom**: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution**: Backend already has CORS enabled via Flask-CORS

## Performance

### Typical Response Times
- Local backend: 500-1500ms
- Network backend: 1000-3000ms
- Timeout threshold: 5000ms

### Image Size
- Resolution: 600x600 pixels
- Format: JPEG
- Quality: 80%
- Typical size: 50-100KB

### Optimization Tips
- Use 600x600 resolution (matches backend expectations)
- Use JPEG format (smaller than PNG)
- Use 80% quality (good balance of size/quality)
- Ensure good lighting (reduces processing time)

## Security Considerations

### Input Validation
- Backend validates base64 format
- Backend validates image decoding
- Backend validates image dimensions
- Backend limits processing time

### Error Messages
- Don't expose internal paths
- Don't expose stack traces
- Provide user-friendly messages
- Log detailed errors server-side

## Future Enhancements

### Potential Improvements
- [ ] Retry logic with exponential backoff
- [ ] Image compression before sending
- [ ] Confidence score display
- [ ] Multiple backend endpoints (load balancing)
- [ ] Offline mode with client-side detection
- [ ] WebSocket for real-time feedback

## References

- Design Document: `.kiro/specs/frontend-camera-capture/design.md`
- Requirements: `.kiro/specs/frontend-camera-capture/requirements.md`
- Backend API: `api/backend_api.py`
- Frontend Implementation: `scripts/camera-capture.js`
- Test Suite: `tests/test-backend-api-integration.html`
