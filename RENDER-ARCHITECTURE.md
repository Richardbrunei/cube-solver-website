# Render Deployment Architecture

Visual guide to how your app works on Render.

## Single Service Architecture

Your app uses a **single Flask service** that serves both frontend and backend:

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│         https://your-app-name.onrender.com                    │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │     Render Web Service (Free Tier)     │
        │                                        │
        │  ┌───────────────────────────────────┐ │
        │  │   Flask App (backend_api.py)      │ │
        │  │   Port: $PORT (assigned by Render)│ │
        │  │                                   │ │
        │  │   ┌─────────────┐  ┌───────────┐  │ │
        │  │   │  Frontend   │  │  Backend  │  │ │
        │  │   │   Routes    │  │    API    │  │ │
        │  │   │             │  │           │  │ │
        │  │   │ /           │  │ /api/*    │  │ │
        │  │   │ /about.html │  │           │  │ │
        │  │   │ /scripts/*  │  │           │  │ │
        │  │   │ /styles/*   │  │           │  │ │
        │  │   │ /assets/*   │  │           │  │ │
        │  │   └─────────────┘  └───────────┘  │ │
        │  └───────────────────────────────────┘ │
        └────────────────────────────────────────┘
```

## Request Flow

### Frontend Request (HTML/CSS/JS)
```
User Browser
    │
    │ GET https://your-app-name.onrender.com/
    │
    ▼
Flask App
    │
    │ serve_index() → send_from_directory()
    │
    ▼
Returns: index.html
    │
    ▼
Browser loads HTML
    │
    ├─→ GET /scripts/main.js → Flask serves JS
    ├─→ GET /styles/main.css → Flask serves CSS
    └─→ GET /assets/icon.png → Flask serves assets
```

### API Request (Backend)
```
Frontend JavaScript
    │
    │ POST /api/detect-colors
    │ Body: { image: "base64...", face: "front" }
    │
    ▼
Flask App
    │
    │ detect_colors() → process image
    │
    ▼
Returns: JSON
    │ { success: true, colors: [...], cube_notation: [...] }
    │
    ▼
Frontend updates UI
```

## File Structure on Render

```
/opt/render/project/src/          # Your repository root
│
├── api/
│   ├── backend_api.py             # Main Flask app ⭐
│   ├── start_backend.py           # Startup script
│   └── production_start.py        # Production startup
│
├── scripts/                       # Frontend JS (served by Flask)
│   ├── main.js
│   ├── cube-state.js
│   └── ...
│
├── styles/                        # Frontend CSS (served by Flask)
│   ├── main.css
│   ├── cube.css
│   └── ...
│
├── index.html                     # Main page (served by Flask)
├── about.html                     # About page (served by Flask)
│
├── requirements.txt               # Python dependencies
├── Procfile                       # Tells Render how to start
└── runtime.txt                    # Python version
```

## Startup Process

```
1. Render detects new commit
   │
   ▼
2. Build Phase
   │ pip install -r requirements.txt
   │ - Installs Flask, opencv-python-headless, numpy, etc.
   │
   ▼
3. Start Phase
   │ Reads Procfile:
   │ gunicorn --chdir api --bind 0.0.0.0:$PORT backend_api:app
   │
   ▼
4. Flask App Starts
   │ - Loads backend_api.py
   │ - Checks for backend path (not found → uses fallbacks)
   │ - Initializes routes
   │ - Binds to port $PORT
   │
   ▼
5. Service Live 🎉
   │ https://your-app-name.onrender.com
   │
   ▼
6. Ready to Accept Requests
```

## Environment Variables

```
┌─────────────────────────────────────────┐
│  Render Environment Variables           │
├─────────────────────────────────────────┤
│  PORT=10000                             │  ← Automatically set by Render
│  PYTHON_VERSION=3.9.18                  │  ← From runtime.txt
│  RENDER=true                            │  ← Automatically set
│  BACKEND_PATH=(not set)                 │  ← Optional, uses fallbacks
└─────────────────────────────────────────┘
```

## URL Routing

All requests go to the same Flask app:

| URL Pattern | Handler | Returns |
|------------|---------|---------|
| `/` | `serve_index()` | index.html |
| `/about.html` | `serve_about()` | about.html |
| `/scripts/*.js` | `serve_scripts()` | JavaScript files |
| `/styles/*.css` | `serve_styles()` | CSS files |
| `/assets/*` | `serve_assets()` | Images, icons |
| `/api/health` | `health_check()` | JSON status |
| `/api/test` | `test_endpoint()` | JSON test data |
| `/api/detect-colors` | `detect_colors()` | JSON color data |
| `/api/solve-cube` | `solve_cube()` | JSON solution |
| `/api/*` | Various API handlers | JSON responses |

## Comparison: Local vs Render

### Local Development
```
┌─────────────────┐     ┌─────────────────┐
│  Frontend       │     │  Backend        │
│  localhost:8000 │────▶│  localhost:5000 │
│  (Python HTTP)  │     │  (Flask)        │
└─────────────────┘     └─────────────────┘
     Separate              Separate
     Process               Process
```

### Render Deployment
```
┌──────────────────────────────────────┐
│  Single Flask App                    │
│  your-app-name.onrender.com          │
│                                      │
│  Frontend Routes + Backend API       │
└──────────────────────────────────────┘
         Single Process
```

## Benefits of Single Service

✅ **Simpler Deployment**
- One service to manage
- One URL to remember
- No CORS configuration needed

✅ **Cost Effective**
- Free tier: 750 hours/month
- Enough for one always-on service
- No need for separate frontend/backend services

✅ **Easier Configuration**
- No environment variables needed
- Automatic HTTPS
- Built-in load balancing

✅ **Better Performance**
- No cross-origin requests
- Faster API calls (same domain)
- Single SSL handshake

## Limitations on Render

⚠️ **Camera Features**
- No camera hardware on server
- Camera endpoints will return errors
- Use manual color editing instead

⚠️ **Free Tier Spin Down**
- Service sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Upgrade to $7/month for always-on

⚠️ **Resource Limits**
- 512 MB RAM on free tier
- Shared CPU
- 100 GB bandwidth/month

⚠️ **Build Time**
- OpenCV installation takes 5-10 minutes
- Subsequent deploys use cached dependencies
- First deploy is slowest

## Monitoring

### Health Check
```
GET /api/health

Response:
{
  "status": "healthy",
  "message": "Rubik's Cube Color Detection API is running"
}
```

### Test Endpoint
```
GET /api/test

Response:
{
  "success": true,
  "message": "API is working correctly",
  "backend_available": true,
  "supported_colors": ["White", "Red", "Green", "Yellow", "Orange", "Blue"],
  "cube_notation": ["U", "R", "F", "D", "L", "B"]
}
```

## Troubleshooting

### Service Won't Start
1. Check build logs for errors
2. Verify Procfile is correct
3. Test locally with gunicorn
4. Check Python version compatibility

### 404 Errors
1. Verify file paths in backend_api.py
2. Check that files exist in repository
3. Test static file routes locally

### 500 Errors
1. Check application logs
2. Test API endpoints individually
3. Verify dependencies installed

### Slow First Request
- Expected on free tier (service sleeping)
- Wait 30-60 seconds
- Use UptimeRobot to keep alive
- Or upgrade to paid tier

## Summary

✅ Single Flask service serves everything
✅ One URL for frontend and backend
✅ No CORS issues
✅ Automatic HTTPS
✅ Free tier available
✅ Easy to deploy and manage

Your app is production-ready and will work seamlessly on Render! 🎉

