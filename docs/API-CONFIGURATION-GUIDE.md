# API Configuration Guide

## Overview
The application uses a centralized configuration system for managing API endpoints and other settings. This makes it easy to change the backend URL or other configuration values in one place.

## Configuration File

**Location:** `scripts/config.js`

This file contains all application configuration including:
- API base URL
- API endpoints
- Camera settings
- Validation settings

## Changing the Backend URL

### Method 1: Edit config.js (Recommended)

Open `scripts/config.js` and modify the `API_BASE_URL`:

```javascript
export const CONFIG = {
    API_BASE_URL: 'http://localhost:5000',  // Change this line
    // ...
};
```

**Examples:**

```javascript
// Local development (default)
API_BASE_URL: 'http://localhost:5000'

// Different port
API_BASE_URL: 'http://localhost:8080'

// Production server
API_BASE_URL: 'https://api.yourdomain.com'

// Different host
API_BASE_URL: 'http://192.168.1.100:5000'
```

### Method 2: Runtime Configuration

You can also change the API URL at runtime using the browser console:

```javascript
import { setApiBaseUrl } from './scripts/config.js';
setApiBaseUrl('http://localhost:8080');
```

## Configuration Options

### API Settings

```javascript
CONFIG = {
    // Backend server URL
    API_BASE_URL: 'http://localhost:5000',
    
    // API endpoint paths (relative to base URL)
    API_ENDPOINTS: {
        COLOR_MAPPINGS: '/api/color-mappings',
        VALIDATE_CUBE: '/api/validate-cube',
        DETECT_COLORS: '/api/detect-colors',
        DETECT_COLORS_FAST: '/api/detect-colors-fast'
    }
}
```

### Camera Settings

```javascript
CAMERA: {
    // Video preview resolution
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    
    // Image capture resolution (sent to backend)
    CAPTURE_WIDTH: 600,
    CAPTURE_HEIGHT: 600,
    
    // Live preview update frequency (milliseconds)
    PREVIEW_INTERVAL: 500,
    
    // API request timeouts (milliseconds)
    DETECTION_TIMEOUT: 5000,    // Full color detection
    PREVIEW_TIMEOUT: 2000        // Live preview
}
```

### Validation Settings

```javascript
VALIDATION: {
    // Enable backend validation by default
    USE_BACKEND: true,
    
    // Expected cubestring length
    CUBESTRING_LENGTH: 54,
    
    // Valid cube notation characters
    VALID_CHARS: ['U', 'R', 'F', 'D', 'L', 'B']
}
```

## Usage in Code

### Importing Configuration

```javascript
import { CONFIG, getApiUrl, setApiBaseUrl } from './config.js';
```

### Accessing Configuration

```javascript
// Get base URL
const baseUrl = CONFIG.API_BASE_URL;

// Get camera settings
const videoWidth = CONFIG.CAMERA.VIDEO_WIDTH;

// Get validation settings
const useBackend = CONFIG.VALIDATION.USE_BACKEND;
```

### Building API URLs

```javascript
// Method 1: Manual concatenation
const url = `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.VALIDATE_CUBE}`;

// Method 2: Using helper function
const url = getApiUrl('VALIDATE_CUBE');
```

### Changing Configuration at Runtime

```javascript
// Change API base URL
setApiBaseUrl('http://localhost:8080');

// Change other settings
CONFIG.CAMERA.PREVIEW_INTERVAL = 1000;
CONFIG.VALIDATION.USE_BACKEND = false;
```

## Files Using Configuration

### scripts/cube-state.js
- Uses `CONFIG.API_BASE_URL` for API requests
- Uses validation settings for cube validation

### scripts/camera-capture.js
- Uses `CONFIG.API_BASE_URL` for API requests
- Uses camera settings for video capture

### Future Files
Any new files that need to make API calls should import and use the centralized configuration.

## Benefits

### 1. Single Source of Truth
- All configuration in one place
- Easy to find and modify settings
- No need to search through multiple files

### 2. Environment Flexibility
- Easy to switch between development and production
- Can configure for different deployment scenarios
- Runtime configuration changes possible

### 3. Maintainability
- Changes propagate automatically to all files
- Reduces risk of missing hardcoded values
- Clear documentation of all settings

### 4. Type Safety
- Centralized configuration makes it easier to add TypeScript types
- Consistent configuration structure across the application

## Migration Notes

### Before (Hardcoded URLs)
```javascript
// In cube-state.js
const response = await fetch('http://localhost:5000/api/validate-cube', {
    // ...
});

// In camera-capture.js
const response = await fetch('http://localhost:5000/api/detect-colors', {
    // ...
});
```

### After (Centralized Configuration)
```javascript
// In config.js
export const CONFIG = {
    API_BASE_URL: 'http://localhost:5000',
    // ...
};

// In cube-state.js
import { CONFIG } from './config.js';
const response = await fetch(`${CONFIG.API_BASE_URL}/api/validate-cube`, {
    // ...
});

// In camera-capture.js
import { CONFIG } from './config.js';
const response = await fetch(`${CONFIG.API_BASE_URL}/api/detect-colors`, {
    // ...
});
```

## Troubleshooting

### Backend Connection Issues

If you see "Could not connect to backend validation service":

1. **Check the backend is running:**
   ```bash
   cd api
   python start_backend.py
   ```

2. **Verify the URL in config.js:**
   - Open `scripts/config.js`
   - Check `API_BASE_URL` matches your backend server
   - Default is `http://localhost:5000`

3. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for network errors
   - Verify the URL being requested

4. **Test the backend directly:**
   - Open `http://localhost:5000/api/test` in your browser
   - Should see a JSON response if backend is working

### CORS Issues

If you see CORS errors in the console:

1. **Ensure backend has CORS enabled:**
   - Check `api/backend_api.py` has `CORS(app)` configured
   - Backend should allow requests from your frontend origin

2. **Check URL protocol:**
   - If frontend is HTTPS, backend must be HTTPS
   - Mixed content (HTTPS → HTTP) is blocked by browsers

### Port Conflicts

If backend won't start on port 5000:

1. **Change backend port:**
   - Modify `api/start_backend.py` or `api/backend_api.py`
   - Change `app.run(port=5000)` to different port

2. **Update frontend configuration:**
   - Open `scripts/config.js`
   - Change `API_BASE_URL` to match new port
   - Example: `'http://localhost:8080'`

## Best Practices

### 1. Don't Hardcode URLs
❌ **Bad:**
```javascript
fetch('http://localhost:5000/api/validate-cube')
```

✅ **Good:**
```javascript
import { CONFIG } from './config.js';
fetch(`${CONFIG.API_BASE_URL}/api/validate-cube`)
```

### 2. Use Configuration for All Settings
❌ **Bad:**
```javascript
const timeout = 5000;  // Hardcoded
```

✅ **Good:**
```javascript
import { CONFIG } from './config.js';
const timeout = CONFIG.CAMERA.DETECTION_TIMEOUT;
```

### 3. Document Configuration Changes
When adding new configuration options:
- Add clear comments explaining the setting
- Provide example values
- Update this documentation

### 4. Environment-Specific Configuration
For production deployments, consider:
- Using environment variables
- Build-time configuration injection
- Separate config files for dev/prod

## Future Enhancements

Potential improvements to the configuration system:

1. **Environment Detection**
   - Auto-detect development vs production
   - Load appropriate configuration automatically

2. **Configuration Validation**
   - Validate configuration on startup
   - Warn about missing or invalid settings

3. **TypeScript Support**
   - Add TypeScript types for configuration
   - Compile-time type checking

4. **Configuration UI**
   - Settings panel in the application
   - Change configuration without editing code

5. **Local Storage Persistence**
   - Save user preferences to localStorage
   - Remember custom API URLs

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Related**: Backend Validation Update, API Integration
