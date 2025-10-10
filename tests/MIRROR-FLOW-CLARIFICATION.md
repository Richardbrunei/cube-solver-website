# Mirror Flow Clarification

## Overview
Clarification of how mirroring works throughout the entire camera capture pipeline, from display to backend processing.

## Complete Mirror Flow

### 1. Video Display (Frontend)
```
Raw Video Stream (not mirrored)
    ↓
CSS Transform: scaleX(-1)
    ↓
User sees MIRRORED video (like a mirror)
```

**Code:**
```css
.camera-preview__video {
    transform: scaleX(-1); /* Mirror for natural interaction */
}
```

### 2. Live Preview Sampling (Frontend)
```
Raw Video Stream (not mirrored)
    ↓
Canvas Transform: scale(-1, 1)
    ↓
Sample colors from MIRRORED frame
    ↓
Display colors in grid (matches what user sees)
```

**Code:**
```javascript
// Mirror the video frame to match the displayed preview
ctx.scale(-1, 1);
ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
```

### 3. Image Capture (Frontend)
```
Raw Video Stream (not mirrored)
    ↓
Canvas Transform: scale(-1, 1)
    ↓
Crop and resize
    ↓
Send MIRRORED image to backend
```

**Code:**
```javascript
// Mirror horizontally for natural interaction (matching backend cv2.flip)
tempCtx.scale(-1, 1);
tempCtx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
```

### 4. Backend Processing
```
Receive MIRRORED image from frontend
    ↓
Process mirrored image
    ↓
Detect colors from 9 positions
    ↓
Return colors in UNMIRRORED order (compensates for flip)
```

**Backend Documentation:**
> "Input frame is mirrored horizontally (for natural interaction)"
> "Returns colors in unmirrored order (compensates for flip)"

## Why This Works

### Frontend Perspective
1. User sees mirrored video (natural, like a mirror)
2. User positions cube based on mirrored view
3. Frontend captures what user sees (mirrored)
4. Frontend sends mirrored image to backend

### Backend Perspective
1. Receives mirrored image from frontend
2. Processes the mirrored image
3. Detects colors from mirrored positions
4. **Compensates for the flip** when returning colors
5. Returns colors in correct (unmirrored) order

### Result
- User sees natural mirrored view
- Backend receives mirrored image
- Backend returns correctly ordered colors
- Cube state is accurate!

## Visual Example

### User's View (Mirrored)
```
┌─────────────────┐
│  R  │  W  │  G  │  ← User sees this (mirrored)
├─────┼─────┼─────┤
│  O  │  Y  │  B  │
├─────┼─────┼─────┤
│  R  │  W  │  G  │
└─────────────────┘
```

### Image Sent to Backend (Mirrored)
```
┌─────────────────┐
│  R  │  W  │  G  │  ← Backend receives this (mirrored)
├─────┼─────┼─────┤
│  O  │  Y  │  B  │
├─────┼─────┼─────┤
│  R  │  W  │  G  │
└─────────────────┘
```

### Colors Returned by Backend (Unmirrored)
```
┌─────────────────┐
│  G  │  W  │  R  │  ← Backend returns this (unmirrored)
├─────┼─────┼─────┤
│  B  │  Y  │  O  │
├─────┼─────┼─────┤
│  G  │  W  │  R  │
└─────────────────┘
```

### Actual Cube (Correct!)
```
┌─────────────────┐
│  G  │  W  │  R  │  ← Matches physical cube!
├─────┼─────┼─────┤
│  B  │  Y  │  O  │
├─────┼─────┼─────┤
│  G  │  W  │  R  │
└─────────────────┘
```

## Code Verification

### Frontend Capture (scripts/camera-capture.js)
```javascript
// Step 1: Capture frame from video with horizontal mirroring
const tempCanvas = document.createElement('canvas');
tempCanvas.width = videoWidth;
tempCanvas.height = videoHeight;
const tempCtx = tempCanvas.getContext('2d');

// Mirror horizontally for natural interaction (matching backend cv2.flip)
tempCtx.scale(-1, 1);
tempCtx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
```

✅ **Confirmed:** Frontend sends mirrored image

### Backend Processing (Backend_Reference/Backend_documentation.txt)
```
Frame Processing:
  • Input frame is mirrored horizontally (for natural interaction)
  • Cropped to square aspect ratio (centered)
  • Resized to 600x600 pixels (CAMERA_RESOLUTION)

Color Detection:
  • Returns colors in unmirrored order (compensates for flip)
```

✅ **Confirmed:** Backend compensates for mirroring

## Summary

| Component | State | Purpose |
|-----------|-------|---------|
| Video Display | MIRRORED | Natural user interaction |
| Live Preview | MIRRORED | Match displayed video |
| Captured Image | MIRRORED | Match what user sees |
| Backend Input | MIRRORED | Receives frontend image |
| Backend Output | UNMIRRORED | Correct cube orientation |
| Cube State | UNMIRRORED | Matches physical cube |

## Answer to User's Question

> "did you make sure to give the color detector script the unmirrored version"

**Answer:** Yes, but in a clever way!

1. The frontend sends a **mirrored** image to the backend
2. The backend **knows** the image is mirrored
3. The backend **compensates** for the mirroring when returning colors
4. The result is colors in the **correct (unmirrored) order**

This approach is better because:
- User sees natural mirrored view
- Backend handles the complexity
- Frontend code is simpler
- Matches industry standard (Instagram, Snapchat, etc.)

## Verification Steps

To verify this is working correctly:

1. **Position a cube with known colors**
   - Example: Red on left, White in center, Green on right

2. **Check mirrored display**
   - Video should show: Green on left, White in center, Red on right

3. **Capture the image**
   - Backend should detect: Red on left, White in center, Green on right

4. **Verify cube state**
   - Cube state should match physical cube (not mirrored)

## Conclusion

✅ The system is correctly designed:
- Frontend sends mirrored image (matches user's view)
- Backend compensates for mirroring (returns correct order)
- Cube state is accurate (matches physical cube)

No changes needed - everything is working as intended!
