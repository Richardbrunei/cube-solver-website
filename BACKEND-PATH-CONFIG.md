# Backend Path Configuration

This document explains how the backend path is configured for different environments.

## How It Works

The app automatically detects the environment and uses the appropriate backend path:

### Priority Order:
1. **Environment Variable** (`BACKEND_PATH`) - highest priority
2. **Local Development Path** - `C:\Users\Liang\OneDrive\Documents\cube_code_backend`
3. **Built-in Fallbacks** - production mode with no external backend

## Environment-Specific Behavior

### Local Testing (Windows)
```python
# Automatically uses your local backend path
LOCAL_DEV_PATH = r"C:\Users\Liang\OneDrive\Documents\cube_code_backend"
```

**What happens:**
- ✅ Checks if the local path exists
- ✅ If found, imports backend modules (config.py, camera_interface.py, etc.)
- ✅ Full functionality with camera support

### Render Deployment (Production)
```python
# No local path exists, uses built-in fallbacks
BACKEND_PATH = None
```

**What happens:**
- ✅ Local path doesn't exist on Render
- ✅ Uses fallback COLOR_TO_CUBE mappings
- ✅ Uses fallback color detection functions
- ✅ API works without external backend
- ⚠️ Camera features disabled (no hardware)

## Configuration Options

### Option 1: Default (Recommended)
No configuration needed. The app automatically detects the environment.

**Local testing:**
```bash
cd api
python start_backend.py
# Uses: C:\Users\Liang\OneDrive\Documents\cube_code_backend
```

**Render deployment:**
```bash
# Automatically uses built-in fallbacks
# No environment variables needed
```

### Option 2: Custom Backend Path (Advanced)
Set the `BACKEND_PATH` environment variable to override the default.

**Local testing with custom path:**
```bash
# Windows
set BACKEND_PATH=D:\my-custom-backend
python api/start_backend.py

# Linux/Mac
export BACKEND_PATH=/path/to/custom/backend
python api/start_backend.py
```

**Render with custom path:**
1. Go to Render Dashboard → Your Service → Environment
2. Add environment variable:
   - Key: `BACKEND_PATH`
   - Value: `/opt/render/project/src/custom-backend`

## Code Implementation

### Backend Path Setup (api/backend_api.py)
```python
# Local development path (Windows) - kept for testing
LOCAL_DEV_PATH = r"C:\Users\Liang\OneDrive\Documents\cube_code_backend"

# Check environment variable first (for Render/production)
BACKEND_PATH = os.environ.get('BACKEND_PATH', LOCAL_DEV_PATH)

# Try to add backend path to Python path
if os.path.exists(BACKEND_PATH):
    sys.path.insert(0, BACKEND_PATH)
    print(f"[SUCCESS] Added backend path: {BACKEND_PATH}")
else:
    # Production mode - no external backend, use built-in fallbacks
    BACKEND_PATH = None
    print(f"[INFO] Running in production mode with built-in fallbacks")
```

### Fallback Functions
When backend modules aren't available, the app uses built-in fallbacks:

- **COLOR_TO_CUBE**: Hardcoded color-to-notation mappings
- **detect_color_advanced**: Simple HSV-based color detection
- **correct_white_balance**: Gray world algorithm
- **adaptive_brighten_image**: Basic brightness adjustment

## Testing

### Test Local Backend
```bash
cd api
python start_backend.py
# Should see: [SUCCESS] Added backend path: C:\Users\Liang\...
```

### Test Production Mode (Simulate Render)
```bash
# Temporarily rename your backend folder to test fallbacks
cd api
python start_backend.py
# Should see: [INFO] Running in production mode with built-in fallbacks
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Test endpoint (shows backend status)
curl http://localhost:5000/api/test

# Color mappings
curl http://localhost:5000/api/color-mappings
```

## Troubleshooting

### "Backend path not found" warning
**Cause**: Local backend path doesn't exist
**Solution**: 
- Verify the path in `LOCAL_DEV_PATH` is correct
- Or set `BACKEND_PATH` environment variable
- Or ignore if deploying to Render (fallbacks will be used)

### "Could not import config.py" error
**Cause**: Backend modules not found
**Solution**:
- Check that backend path exists and contains config.py
- Or ignore if deploying to Render (fallbacks will be used)

### Camera features don't work on Render
**Expected behavior**: Camera requires local hardware
**Solution**: 
- Use camera features only in local development
- Deploy without camera features for production
- Or use a VPS with camera hardware support

## Summary

✅ **Local testing**: Keeps your original Windows path for full functionality
✅ **Render deployment**: Automatically uses built-in fallbacks
✅ **No configuration needed**: Works out of the box in both environments
✅ **Flexible**: Can override with environment variable if needed
