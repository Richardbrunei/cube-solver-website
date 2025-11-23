# Quick Start: Deploy to Render in 5 Minutes

The fastest way to get your Rubik's Cube app live on Render.

## Prerequisites

- ✅ GitHub account
- ✅ Render account (free at https://render.com)
- ✅ Your code pushed to GitHub

## Step 1: Push to GitHub (2 minutes)

```bash
# Add all files
git add .

# Commit changes
git commit -m "Ready for Render deployment"

# Push to GitHub
git push origin main
```

## Step 2: Create Web Service on Render (2 minutes)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** (if not already connected)
4. Find and select your repository
5. Click **"Connect"**

## Step 3: Configure Service (1 minute)

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `rubiks-cube-app` (or your choice) |
| **Environment** | `Python 3` |
| **Branch** | `main` |
| **Root Directory** | (leave blank) |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn --chdir api --bind 0.0.0.0:$PORT --workers 2 --timeout 120 backend_api:app` |
| **Instance Type** | `Free` |

Click **"Create Web Service"**

## Step 4: Wait for Deployment (5-10 minutes)

Render will:
1. ✅ Clone your repository
2. ✅ Install Python dependencies (this takes the longest)
3. ✅ Start your Flask app
4. ✅ Assign a URL

Watch the logs for:
```
==> Your service is live 🎉
    https://rubiks-cube-app.onrender.com
```

## Step 5: Test Your App (30 seconds)

Open these URLs in your browser:

1. **Main App**: `https://your-app-name.onrender.com/`
   - Should show the Rubik's cube interface ✅

2. **Health Check**: `https://your-app-name.onrender.com/api/health`
   - Should return: `{"status":"healthy"}` ✅

3. **Test Endpoint**: `https://your-app-name.onrender.com/api/test`
   - Should show backend status ✅

## Done! 🎉

Your app is now live at: `https://your-app-name.onrender.com`

## What Works

✅ 3D cube visualization
✅ Net view
✅ Manual color editing
✅ Reset functionality
✅ Cube solving (Kociemba algorithm)
✅ API endpoints
✅ Responsive design

## What Doesn't Work

⚠️ Camera capture (requires local hardware)
⚠️ First request after 15 minutes takes 30-60 seconds (free tier sleeps)

## Next Steps

### Keep Your App Awake (Optional)
Free tier sleeps after 15 minutes. To keep it awake:

1. Go to https://uptimerobot.com (free)
2. Add new monitor
3. URL: `https://your-app-name.onrender.com/api/health`
4. Interval: 5 minutes

### Upgrade to Always-On (Optional)
- **Cost**: $7/month
- **Benefits**: No sleep, faster performance, dedicated resources
- **How**: Render Dashboard → Your Service → Settings → Instance Type → Starter

### Add Custom Domain (Optional)
1. Render Dashboard → Your Service → Settings
2. Scroll to "Custom Domain"
3. Add your domain (e.g., `rubiks.yourdomain.com`)
4. Update DNS with CNAME record

## Troubleshooting

### Build Failed
- Check logs in Render Dashboard
- Verify `requirements.txt` is correct
- Try deploying again (sometimes transient errors)

### App Shows 503 Error
- Wait 30-60 seconds (app is starting)
- Check logs for errors
- Verify start command is correct

### Static Files Not Loading
- Already fixed in `backend_api.py`
- Verify files are in GitHub repository
- Check that paths are relative

### Need Help?
- Check `RENDER-ACCESS-GUIDE.md` for detailed troubleshooting
- Check `RENDER-ARCHITECTURE.md` to understand how it works
- Visit Render Community: https://community.render.com

## Configuration Files

All configuration files are already created:

- ✅ `Procfile` - Start command
- ✅ `runtime.txt` - Python version
- ✅ `requirements.txt` - Dependencies
- ✅ `api/backend_api.py` - Flask app with static file serving

## Command Reference

```bash
# Test locally before deploying
cd api
python start_backend.py

# Or with gunicorn (production mode)
gunicorn --chdir api --bind 0.0.0.0:5000 backend_api:app

# Test API locally
curl http://localhost:5000/api/health
```

## URLs After Deployment

Replace `your-app-name` with your actual service name:

```
Frontend:  https://your-app-name.onrender.com/
About:     https://your-app-name.onrender.com/about.html
Health:    https://your-app-name.onrender.com/api/health
Test:      https://your-app-name.onrender.com/api/test
API:       https://your-app-name.onrender.com/api/*
```

## Cost

**Free Tier:**
- 750 hours/month (enough for one service)
- Spins down after 15 minutes
- 512 MB RAM
- 100 GB bandwidth

**Paid Tier ($7/month):**
- Always on (no spin down)
- 512 MB RAM
- Dedicated resources
- Better performance

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Render Status**: https://status.render.com

## Summary

1. ✅ Push code to GitHub
2. ✅ Create Web Service on Render
3. ✅ Configure with provided settings
4. ✅ Wait 5-10 minutes
5. ✅ Test your live app
6. 🎉 Share your URL!

**Total Time**: ~10 minutes (including build time)

Your Rubik's Cube app is now live and accessible to anyone! 🚀
