# Deployment Guide for Render

This guide walks you through deploying the Rubik's Cube Interactive app to Render.

## Prerequisites

- GitHub account (to connect your repository)
- Render account (free tier available at https://render.com)
- Your code pushed to a GitHub repository

## Deployment Options

### Option 1: Single Web Service (Recommended for Free Tier)

Deploy both frontend and backend together in one service.

#### Steps:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create a New Web Service on Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `rubiks-cube-app`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `cd api && gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 backend_api:app`
     - **Instance Type**: `Free`

3. **Add Environment Variables** (optional - not required)
   - Click "Environment" tab
   - No environment variables are required for basic deployment
   - The app automatically handles different environments:
     - **Local testing**: Uses `C:\Users\Liang\OneDrive\Documents\cube_code_backend`
     - **Render deployment**: Uses built-in fallback functions

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - Your app will be available at `https://your-app-name.onrender.com`

### Option 2: Blueprint Deployment (render.yaml)

Use the included `render.yaml` for automated deployment.

#### Steps:

1. **Push code to GitHub** (same as above)

2. **Create Blueprint on Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`
   - Click "Apply"

3. **Configure Services**
   - Render will create both frontend and backend services
   - Update the backend URL in frontend if needed

## Important Notes

### Camera Functionality Limitations

⚠️ **Camera capture will NOT work on Render's free tier** because:
- OpenCV requires system libraries that may not be available
- Camera access requires local hardware
- The backend path `C:\Users\Liang\...` is hardcoded and won't exist on Render

**Recommended approach:**
- Deploy the app for visualization and manual color editing
- Remove or disable camera features for production
- Or use a local development setup for camera features

### Static File Serving

The Flask backend serves static files (HTML, CSS, JS) from the root directory. Make sure:
- `index.html` is in the root directory
- `scripts/` and `styles/` folders are accessible
- Update any hardcoded paths in `backend_api.py`

### CORS Configuration

CORS is already enabled in `backend_api.py` for all origins. For production, consider restricting to your frontend domain:

```python
CORS(app, resources={r"/api/*": {"origins": "https://your-frontend-domain.com"}})
```

## Testing Your Deployment

After deployment, test these endpoints:

1. **Health Check**: `https://your-app.onrender.com/api/health`
2. **Test Endpoint**: `https://your-app.onrender.com/api/test`
3. **Main App**: `https://your-app.onrender.com/`

## Troubleshooting

### Build Fails

- Check that `requirements.txt` is in the root directory
- Verify Python version compatibility (3.9+ recommended)
- Check build logs for specific errors

### App Crashes on Startup

- Verify the start command is correct
- Check that `backend_api.py` doesn't require local files
- Review application logs in Render dashboard

### Camera Features Don't Work

- This is expected on Render (see limitations above)
- Consider deploying without camera features
- Or use a VPS with camera hardware support

### Static Files Not Loading

- Ensure Flask routes for static files are configured
- Check that file paths are relative, not absolute
- Verify files are committed to Git

## Cost Considerations

- **Free Tier**: 750 hours/month, spins down after 15 minutes of inactivity
- **Paid Tier**: $7/month for always-on service with more resources
- **Bandwidth**: 100GB/month on free tier

## Alternative Deployment Options

If Render doesn't meet your needs:

- **Heroku**: Similar to Render, good Python support
- **Railway**: Modern platform with generous free tier
- **Vercel/Netlify**: For frontend only (static hosting)
- **DigitalOcean App Platform**: More control, starts at $5/month
- **AWS/GCP/Azure**: Full control but more complex setup

## Next Steps

After successful deployment:

1. Update frontend API URLs if using separate services
2. Configure custom domain (optional)
3. Set up monitoring and error tracking
4. Enable HTTPS (automatic on Render)
5. Consider adding authentication if needed
