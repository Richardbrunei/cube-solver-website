# Live Preview Backend Integration Guide

## Overview
The live preview feature now uses the backend's `detect_color_advanced` function with fast mode (`use_fast=True`) for real-time color detection. This provides more accurate color recognition compared to the previous client-side RGB distance calculation, especially in low-brightness conditions.

## Architecture

### Backend Endpoint: `/api/detect-colors-fast`

**Purpose**: Fast color detection optimized for live preview performance

**Method**: POST

**Request Format**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "face": "front"
}
```

**Response Format**:
```json
{
  "success": true,
  "colors": ["White", "Red", "Green", "Yellow", "Orange", "Blue", "White", "Red", "Green"],
  "cube_notation": ["U", "R", "F", "D", "L", "B", "U", "R", "F"],
  "face": "front"
}
```

### Key Differences from `/api/detect-colors`

| Feature | `/api/detect-colors` | `/api/detect-colors-fast` |
|---------|---------------------|---------------------------|
| **Purpose** | Final capture | Live preview |
| **Detection Mode** | `use_fast=False` (KMeans) | `use_fast=True` (averaging) |
| **Timeout** | 5 seconds | 2 seconds |
| **Image Quality** | 600x600, 80% quality | 300x300, 60% quality |
| **Confidence Scores** | Yes | No |
| **Error Handling** | Strict validation | Silently fails |

## Frontend Implementation

### Live Preview Flow

```
Video Frame
    ↓
captureImageFromVideoForPreview()
    ↓ (300x300, 60% quality)
detectColorsForLivePreview()
    ↓ (2 second timeout)
Backend: /api/detect-colors-fast
    ↓ (use_fast=True)
detect_color_advanced()
    ↓
displayLiveColors()
    ↓
Update Grid Cells
```

### Performance Optimizations

1. **Lower Resolution**: 300x300 instead of 600x600
   - Reduces data transfer by ~75%
   - Faster image processing
   - Still sufficient for color detection

2. **Lower Quality**: 60% JPEG instead of 80%
   - Smaller file size (~20-30KB vs 50-100KB)
   - Faster encoding/decoding
   - Minimal impact on color accuracy

3. **Shorter Timeout**: 2 seconds instead of 5
   - Prevents preview lag
   - Skips slow frames gracefully
   - Maintains smooth user experience

4. **Fast Detection Mode**: `use_fast=True`
   - Uses simple averaging instead of KMeans clustering
   - ~3-5x faster processing
   - Sufficient accuracy for preview

5. **Silent Failures**: Errors don't disrupt preview
   - Timeout errors are ignored
   - Network errors don't show alerts
   - Next frame will retry automatically

## Color Detection Methods

### Standard Mode (`use_fast=False`)
Used by `/api/detect-colors` for final capture:
- KMeans clustering to find dominant colors
- More accurate but slower (~200-500ms per patch)
- Better for complex lighting conditions
- Handles color variations better

### Fast Mode (`use_fast=True`)
Used by `/api/detect-colors-fast` for live preview:
- Simple color averaging
- Much faster (~50-100ms per patch)
- Good enough for preview feedback
- Still uses `detect_color_low_brightness` when V < 80

## Low Brightness Handling

Both endpoints automatically use `detect_color_low_brightness()` when brightness (V) is less than 80:

**Detection Method**:
- Calculates BGR channel ratios
- Uses hue ranges for confirmation
- Applies color-specific thresholds
- Distinguishes red vs green in low light
- Falls back to BGR distance if needed

**Automatic Activation**:
```python
# In detect_color_advanced()
if v < 80:
    return detect_color_low_brightness(dominant_bgr, h, s, v)
```

## Usage Example

### Frontend Code
```javascript
// Start live preview
camera.startLivePreview();

// Live preview updates every 500ms
setInterval(() => {
    camera.updateLivePreview();
}, 500);

// Stop live preview
camera.stopLivePreview();
```

### Backend Processing
```python
# Fast detection for live preview
color = detect_color_advanced(patch, use_fast=True)

# Automatic low brightness handling
if v < 80:
    color = detect_color_low_brightness(dominant_bgr, h, s, v)
```

## Testing

### Manual Testing
1. Start backend: `cd api && python start_backend.py`
2. Open camera interface in browser
3. Observe live preview updating in real-time
4. Test in different lighting conditions:
   - Bright light (V > 80)
   - Low light (V < 80)
   - Mixed lighting

### Expected Behavior
- Preview updates every ~500ms
- Colors appear in grid cells
- Smooth transitions between frames
- No lag or freezing
- Accurate color detection in most conditions

### Performance Metrics
- **Frame Capture**: ~10-20ms
- **Network Transfer**: ~50-100ms
- **Backend Processing**: ~100-200ms
- **Total Latency**: ~200-400ms
- **Update Frequency**: 2 updates/second

## Troubleshooting

### Preview Not Updating
**Symptoms**: Grid cells remain empty
**Possible Causes**:
- Backend not running
- Network timeout
- Camera not initialized

**Solutions**:
- Check backend is running on port 5000
- Check browser console for errors
- Verify video element is active

### Slow Preview Updates
**Symptoms**: Preview lags behind video
**Possible Causes**:
- Backend processing too slow
- Network latency high
- Image size too large

**Solutions**:
- Reduce preview image size (currently 300x300)
- Increase update interval (currently 500ms)
- Check backend performance

### Inaccurate Colors
**Symptoms**: Wrong colors detected in preview
**Possible Causes**:
- Poor lighting conditions
- Fast mode less accurate than standard
- Camera white balance issues

**Solutions**:
- Improve lighting
- Use final capture for accuracy (standard mode)
- Adjust camera settings

### Backend Errors
**Symptoms**: Console shows backend errors
**Possible Causes**:
- Missing backend modules
- Image decoding failures
- Processing exceptions

**Solutions**:
- Check backend logs
- Verify all dependencies installed
- Test with `/api/health` endpoint

## Configuration

### Adjustable Parameters

**Frontend** (`scripts/camera-capture.js`):
```javascript
// Preview image size (default: 300x300)
const previewSize = 300;

// Preview image quality (default: 0.6)
const quality = 0.6;

// Preview timeout (default: 2000ms)
const timeout = 2000;

// Update interval (default: 500ms)
const interval = 500;
```

**Backend** (`api/backend_api.py`):
```python
# Grid specifications
GRID_START = 200
GRID_STEP = 100
DETECTION_SIZE = 20

# Brightness adjustment
BRIGHTNESS_ADJUSTMENT = 40

# Fast mode enabled
use_fast = True
```

## Benefits of Backend Integration

### Accuracy Improvements
- ✅ Uses same color detection as final capture
- ✅ Handles low brightness automatically
- ✅ Applies white balance correction
- ✅ Uses HSV color space (better than RGB)
- ✅ Distinguishes similar colors (red vs orange)

### Consistency
- ✅ Preview matches final capture results
- ✅ Same preprocessing pipeline
- ✅ Same grid positions
- ✅ Same color mapping

### User Experience
- ✅ Real-time feedback while positioning cube
- ✅ Confidence in color detection
- ✅ Fewer retakes needed
- ✅ Faster overall capture process

## Future Enhancements

### Potential Improvements
- [ ] Adaptive update frequency based on motion
- [ ] Client-side caching of recent detections
- [ ] Progressive image quality (start low, increase)
- [ ] WebSocket for real-time streaming
- [ ] Confidence indicators in preview
- [ ] Color correction suggestions

## References

- Backend Documentation: `Backend_Reference/Backend_documentation.txt`
- Color Detection: `detect_color_advanced()` with `use_fast=True`
- Low Brightness: `detect_color_low_brightness()` (automatic)
- Image Processing: `prepare_frame()` pipeline
- API Endpoint: `POST /api/detect-colors-fast`
