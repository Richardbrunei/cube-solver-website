# Deploy Frontend and Backend as Separate Services

Guide for deploying when your frontend and backend are in different repositories.

## Architecture Overview

```
┌─────────────────────────────────┐
│  Frontend Repository (This one) │
│  Static Site on Render          │
│  https://rubiks-frontend.onrender.com
└─────────────────────────────────┘
                │
                │ API Calls
                ▼
┌─────────────────────────────────┐
│  Backend Repository (Separate)  │
│  Web Service on Render          │
│  https://rubiks-backend.onrender.com
└─────────────────────────────────┘
```

## Part 1: Deploy Backend (Separate Repo)

### Step 1: Prepare Your Backend Repository

Navigate to your backend repository and create these files:

#### 1.1 Create `Procfile`
```
web: gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 backend_api:app
```

**Note**: Adjust the filename if your main file isn't `backend_api.py`

#### 1.2 Create `runtime.txt`
```
python-3.9.18
```

#### 1.3 Create/Update `requirements.txt`
Make sure it includes:
```
flask>=2.0.0
flask-cors>=3.0.0
gunicorn>=20.1.0
opencv-python-headless>=4.5.0
numpy>=1.21.0
kociemba>=1.2.0
pillow>=8.0.0
requests>=2.25.0
```

#### 1.4 Update Your Backend to Enable CORS

In your backend's main file (e.g., `backend_api.py` or `app.py`), ensure CORS is enabled:

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS for your frontend domain
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:8000",  # Local development
            "https://rubiks-frontend.onrender.com",  # Production frontend
            "https://*.onrender.com"  # All Render domains
        ]
    }
})
```

### Step 2: Deploy Backend to Render

1. **Push backend to GitHub**:
   ```bash
   cd /path/to/your/backend/repo
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create Web Service on Render**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your **backend repository**
   - Configure:
     - **Name**: `rubiks-cube-backend`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 backend_api:app`
     - **Instance Type**: `Free`

3. **Wait for deployment** (5-10 minutes)

4. **Note your backend URL**: `https://rubiks-cube-backend.onrender.com`

5. **Test backend**:
   ```bash
   curl https://rubiks-cube-backend.onrender.com/api/health
   ```

## Part 2: Deploy Frontend (This Repo)

### Step 1: Update Frontend to Use Backend URL

You need to configure your frontend to call the backend API.

#### Option A: Environment Variable (Recommended)

Create a config file for API URLs:

**Create `scripts/config.js`**:
```javascript
// API Configuration
const API_CONFIG = {
    // Use environment variable or default to production backend
    BASE_URL: window.ENV?.API_URL || 'https://rubiks-cube-backend.onrender.com',
    
    // API endpoints
    ENDPOINTS: {
        HEALTH: '/api/health',
        TEST: '/api/test',
        DETECT_COLORS: '/api/detect-colors',
        DETECT_COLORS_FAST: '/api/detect-colors-fast',
        SOLVE_CUBE: '/api/solve-cube',
        COLOR_MAPPINGS: '/api/color-mappings',
        CAMERA_STATUS: '/api/camera-status'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}

export { API_CONFIG, getApiUrl };
```

#### Option B: Direct Configuration

Update your JavaScript files that make API calls:

**Find files that call the API** (likely in `scripts/` folder):
```javascript
// OLD (relative URLs - won't work with separate backend)
fetch('/api/health')

// NEW (absolute URLs to backend)
const BACKEND_URL = 'https://rubiks-cube-backend.onrender.com';
fetch(`${BACKEND_URL}/api/health`)
```

### Step 2: Update API Calls in Your Frontend

Let me check which files make API calls:

**Common files to update**:
- `scripts/camera-capture.js` - Camera API calls
- `scripts/cube-importer.js` - Import API calls
- Any file that uses `fetch('/api/...')`

**Example update**:
```javascript
// Before
fetch('/api/detect-colors', {
    method: 'POST',
    body: JSON.stringify(data)
})

// After
const BACKEND_URL = 'https://rubiks-cube-backend.onrender.com';
fetch(`${BACKEND_URL}/api/detect-colors`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
})
```

### Step 3: Deploy Frontend to Render

#### Option A: Static Site (Recommended for Frontend)

1. **Create `render.yaml` in frontend repo**:
```yaml
services:
  - type: web
    name: rubiks-cube-frontend
    env: static
    buildCommand: echo "No build needed"
    staticPublishPath: .
    headers:
      - path: /*
        name: Cache-Control
        value: public, max-age=3600
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

2. **Push to GitHub**:
```bash
git add .
git commit -m "Configure for Render static site"
git push origin main
```

3. **Deploy on Render**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Static Site"
   - Connect your **frontend repository**
   - Configure:
     - **Name**: `rubiks-cube-frontend`
     - **Build Command**: (leave empty)
     - **Publish Directory**: `.` (current directory)

4. **Note your frontend URL**: `https://rubiks-cube-frontend.onrender.com`

#### Option B: Web Service (Alternative)

If you want to use the Flask backend in this repo to serve static files:

1. **Keep the `api/` folder** in this repo
2. **Follow the original deployment guide** (QUICK-START-RENDER.md)
3. **Update `api/backend_api.py`** to proxy API calls to your real backend

## Part 3: Connect Frontend and Backend

### Update Frontend API Configuration

Create an environment-aware configuration:

**Create `scripts/api-config.js`**:
```javascript
// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

// API Base URLs
const API_BASE_URL = isDevelopment 
    ? 'http://localhost:5000'  // Local backend
    : 'https://rubiks-cube-backend.onrender.com';  // Production backend

// Export configuration
export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    
    // Helper to build full URL
    url(endpoint) {
        return `${this.BASE_URL}${endpoint}`;
    }
};

// Usage example:
// import { API_CONFIG } from './api-config.js';
// fetch(API_CONFIG.url('/api/health'))
```

### Update Your API Calls

**Example: Update `scripts/camera-capture.js`**:
```javascript
import { API_CONFIG } from './api-config.js';

// Old way
// fetch('/api/detect-colors', ...)

// New way
fetch(API_CONFIG.url('/api/detect-colors'), {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
})
```

## Testing

### Test Backend
```bash
# Health check
curl https://rubiks-cube-backend.onrender.com/api/health

# Test endpoint
curl https://rubiks-cube-backend.onrender.com/api/test
```

### Test Frontend
1. Open: `https://rubiks-cube-frontend.onrender.com`
2. Open browser console (F12)
3. Check for CORS errors
4. Test API calls

### Test CORS
```javascript
// Run in browser console on frontend site
fetch('https://rubiks-cube-backend.onrender.com/api/health')
    .then(r => r.json())
    .then(data => console.log('Success:', data))
    .catch(err => console.error('CORS Error:', err));
```

## Common Issues

### Issue: CORS Errors
**Symptom**: "Access to fetch has been blocked by CORS policy"

**Fix**: Update backend CORS configuration:
```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # Allow all origins (or specify your frontend domain)
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
```

### Issue: API Calls Fail
**Symptom**: 404 errors or connection refused

**Fix**: 
1. Verify backend URL is correct
2. Check backend is running: `curl https://rubiks-cube-backend.onrender.com/api/health`
3. Check frontend is using correct URL in API calls

### Issue: Backend Sleeps (Free Tier)
**Symptom**: First request takes 30-60 seconds

**Fix**: 
1. Use UptimeRobot to ping backend every 5 minutes
2. Or upgrade to paid tier ($7/month)

## File Checklist

### Backend Repository
- [ ] `Procfile` - Start command
- [ ] `runtime.txt` - Python version
- [ ] `requirements.txt` - Dependencies with gunicorn
- [ ] CORS enabled in Flask app
- [ ] Pushed to GitHub
- [ ] Deployed to Render

### Frontend Repository (This One)
- [ ] `scripts/api-config.js` - API URL configuration
- [ ] Updated all API calls to use backend URL
- [ ] Tested locally with backend
- [ ] Pushed to GitHub
- [ ] Deployed to Render

## Local Development

### Run Backend Locally
```bash
cd /path/to/backend/repo
python app.py
# Backend runs on http://localhost:5000
```

### Run Frontend Locally
```bash
cd /path/to/frontend/repo
python -m http.server 8000
# Frontend runs on http://localhost:8000
```

Frontend will automatically use `http://localhost:5000` for API calls (via `api-config.js`).

## Production URLs

After deployment:

- **Frontend**: `https://rubiks-cube-frontend.onrender.com`
- **Backend**: `https://rubiks-cube-backend.onrender.com`
- **API**: `https://rubiks-cube-backend.onrender.com/api/*`

## Cost

### Free Tier (Both Services)
- 750 hours/month total
- Can run 2 services if they share the hours
- Both will sleep after 15 minutes of inactivity

### Paid Tier ($7/month each)
- Always on
- Better performance
- Recommended for production

## Summary

1. ✅ Deploy backend as Web Service
2. ✅ Deploy frontend as Static Site (or Web Service)
3. ✅ Configure CORS on backend
4. ✅ Update frontend to use backend URL
5. ✅ Test both services
6. 🎉 Your app is live!

## Next Steps

1. **Deploy Backend First**: Follow Part 1
2. **Update Frontend API Calls**: Follow Part 2
3. **Deploy Frontend**: Follow Part 3
4. **Test Everything**: Follow Testing section
5. **Set Up Monitoring**: Use UptimeRobot for both services
