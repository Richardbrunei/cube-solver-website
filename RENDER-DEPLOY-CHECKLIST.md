# Render Deployment Checklist

Quick checklist for deploying to Render.

## Pre-Deployment

- [ ] Code is committed to Git
- [ ] Repository is pushed to GitHub
- [ ] `requirements.txt` includes all dependencies
- [ ] `Procfile` is configured correctly
- [ ] Backend path is configured for both local and production:
  - ✅ Local testing: Uses `C:\Users\Liang\OneDrive\Documents\cube_code_backend`
  - ✅ Render deployment: Uses built-in fallbacks (no external backend needed)

## Render Setup

### Option A: Simple Single Service (Easiest)

1. [ ] Go to https://dashboard.render.com
2. [ ] Click "New +" → "Web Service"
3. [ ] Connect your GitHub repository
4. [ ] Configure:
   - **Name**: `rubiks-cube-app` (or your choice)
   - **Environment**: `Python 3`
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave blank
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --chdir api --bind 0.0.0.0:$PORT --workers 2 --timeout 120 backend_api:app`
   - **Instance Type**: `Free`
5. [ ] Click "Create Web Service"
6. [ ] Wait for deployment (5-10 minutes)

### Option B: Blueprint (render.yaml)

1. [ ] Go to https://dashboard.render.com
2. [ ] Click "New +" → "Blueprint"
3. [ ] Connect your GitHub repository
4. [ ] Render detects `render.yaml` automatically
5. [ ] Review services and click "Apply"

## Post-Deployment Testing

After deployment, Render provides a URL like: `https://your-app-name.onrender.com`

Test these URLs (replace `your-app-name` with your actual service name):

- [ ] **Main App**: `https://your-app-name.onrender.com/`
- [ ] **Health Check**: `https://your-app-name.onrender.com/api/health`
- [ ] **Test Endpoint**: `https://your-app-name.onrender.com/api/test`
- [ ] **Color Mappings**: `https://your-app-name.onrender.com/api/color-mappings`
- [ ] **About Page**: `https://your-app-name.onrender.com/about.html`

**How to find your URL:**
1. Go to Render Dashboard
2. Click on your service
3. URL is shown at the top of the page
4. Click to open in browser

**Note**: First request may take 30-60 seconds if the free tier service was sleeping.

## Expected Behavior

✅ **What WILL work:**
- Main cube visualization (3D and Net views)
- Manual color editing
- Reset functionality
- Cube solving (if kociemba installs successfully)
- API endpoints for color detection

⚠️ **What might NOT work:**
- Camera capture (requires local hardware)
- OpenCV camera access (no camera on server)
- Any features requiring the local backend path

## Troubleshooting

### Build fails with "opencv-python" error
- The `requirements.txt` uses `opencv-python-headless` which should work
- If it still fails, try removing OpenCV temporarily

### App crashes on startup
- Check logs in Render dashboard
- Verify the start command is correct
- Ensure `backend_api.py` doesn't require missing files

### 404 errors for static files
- Check that Flask is serving static files correctly
- Verify file paths in `backend_api.py`

### Free tier spins down
- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Upgrade to paid tier ($7/month) for always-on service

## Configuration Files Created

- ✅ `Procfile` - Tells Render how to start the app
- ✅ `runtime.txt` - Specifies Python version
- ✅ `render.yaml` - Blueprint configuration (optional)
- ✅ `requirements.txt` - Updated with gunicorn and opencv-headless
- ✅ `DEPLOYMENT.md` - Full deployment guide
- ✅ `api/production_start.py` - Production startup script

## Next Steps After Deployment

1. [ ] Test all functionality
2. [ ] Update frontend API URLs if needed
3. [ ] Configure custom domain (optional)
4. [ ] Set up monitoring
5. [ ] Consider upgrading to paid tier if needed

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Flask Deployment: https://flask.palletsprojects.com/en/2.3.x/deploying/

## Quick Commands

```bash
# Test locally before deploying
cd api
python production_start.py

# Or with gunicorn
gunicorn --chdir api --bind 0.0.0.0:5000 backend_api:app

# Check requirements
pip install -r requirements.txt

# Test API
curl http://localhost:5000/api/health
```
